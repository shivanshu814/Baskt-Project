import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { AccessControlRole } from '@baskt/types';

describe('Order Cancellation', () => {
  // Get the test client instance
  const client = TestClient.getInstance();
  
  // Test parameters
  const ORDER_SIZE = new BN(10_000_000); // 10 units
  const COLLATERAL_AMOUNT = new BN(11_000_000); // 11 USDC (110% of 10-unit order)
  const TICKER = 'BTC';
  
  // Test accounts
  let user: Keypair;
  let treasury: Keypair;
  let matcher: Keypair;
  let userClient: TestClient;
  let otherUser: Keypair;
  let otherUserClient: TestClient;
  
  // Test state
  let basktId: PublicKey;
  let collateralMint: PublicKey;
  let userTokenAccount: PublicKey;
  let escrowTokenAccount: PublicKey;
  let programAuthority: PublicKey;
  let assetId: PublicKey;
  
  // USDC mint constant from the program
  const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  
  // Order state for tests
  let longOrderId: BN;
  let longOrderPDA: PublicKey;
  let shortOrderId: BN;
  let shortOrderPDA: PublicKey;
  
  before(async () => {
    try {
      // Check if protocol is already initialized
      await client.getProtocolAccount();
    } catch (error) {
      try {
        await client.initializeProtocol();
      } catch (initError) {
        throw initError; // Fail the test if we can't initialize the protocol
      }
    }
    
    // Set up test roles
    await client.initializeRoles();
    
    // Create test keypairs
    user = Keypair.generate();
    treasury = Keypair.generate();
    matcher = Keypair.generate();
    otherUser = Keypair.generate();
    
    // Fund the test accounts
    await requestAirdrop(user.publicKey, client.connection);
    await requestAirdrop(treasury.publicKey, client.connection);
    await requestAirdrop(matcher.publicKey, client.connection);
    await requestAirdrop(otherUser.publicKey, client.connection);
    await requestAirdrop(new PublicKey('6UvSQ8aRj4z1iD6eQPV6NJMdPXbMUjUzgDFKB9ExekvK'), client.connection);
    // Create user clients
    userClient = await TestClient.forUser(user);
    otherUserClient = await TestClient.forUser(otherUser);
    
    // Add roles
    await client.addRole(treasury.publicKey, AccessControlRole.Treasury);
    await client.addRole(matcher.publicKey, AccessControlRole.Matcher);
    
    // Verify roles
    const hasTreasuryRole = await client.hasRole(treasury.publicKey, AccessControlRole.Treasury);
    const hasMatcherRole = await client.hasRole(matcher.publicKey, AccessControlRole.Matcher);
    expect(hasTreasuryRole).to.be.true;
    expect(hasMatcherRole).to.be.true;
    
    // Enable features for testing
    await client.updateFeatureFlags({
      allowAddLiquidity: true,
      allowRemoveLiquidity: true,
      allowOpenPosition: true,
      allowClosePosition: true,
      allowPnlWithdrawal: true,
      allowCollateralWithdrawal: true,
      allowAddCollateral: true,
      allowBasktCreation: true,
      allowBasktUpdate: true,
      allowTrading: true,
      allowLiquidations: true,
    });
    
    // Create a synthetic asset
    const assetResult = await client.addAsset(TICKER, {
      allowLongs: true,
      allowShorts: true,
    });
    assetId = assetResult.assetAddress;
    
    // Create a baskt with the asset - use a unique name with timestamp
    const basktName = `TestBaskt_Cancel_${Date.now()}`;
    
    // Format asset config correctly with assetId
    const formattedAssetConfig = {
      weight: new BN(10000), // 100% weight (10000 bps)
      direction: true, // Long direction
      assetId: assetId, // Include the asset ID in the config
      baselinePrice: new BN(0), // Required by OnchainAssetConfig
    };
    
    const { basktId: createdBasktId } = await client.createBaskt(
      basktName,
      [formattedAssetConfig],
      true // isPublic
    );
    basktId = createdBasktId;
    
    // Activate the baskt with initial prices
    await client.activateBaskt(
      basktId,
      [new BN(50000 * 1000000)], // $50,000 price with 6 decimals
      60 // maxPriceAgeSec
    );
    
    // Use the USDC mock token for collateral
    collateralMint = USDC_MINT;
    
    // Find the program authority PDA
    [programAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority')],
      client.program.programId
    );
    
    // Create token accounts for the test using userClient so the user pays for the ATA
    userTokenAccount = await userClient.getOrCreateUSDCAccount(user.publicKey);
    
    // Derive the user escrow token account PDA
    [escrowTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_escrow'), user.publicKey.toBuffer()],
      client.program.programId
    );
    
    // Mint USDC tokens to user
    await userClient.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(10).toNumber() // 10x for multiple tests
    );
    
    // Create orders that we'll cancel in our tests
    
    // Create a long order
    longOrderId = new BN(Date.now());
    [longOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), longOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );
    
    await userClient.createOrder({
      orderId: longOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });
    
    // Create a short order
    shortOrderId = new BN(Date.now() + 1);
    [shortOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), shortOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );
    
    await userClient.createOrder({
      orderId: shortOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: false,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });
    
    // Create the additional order
    const additionalOrderId = new BN(Date.now() + 100);
    await userClient.createOrder({
      orderId: additionalOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });
  });

  it('Cancels a long order and returns collateral', async () => {
    // Create a new order PDA for additional testing
    const additionalOrderId = new BN(Date.now() + 100);
    
    // Create the additional order
    await userClient.createOrder({
      orderId: additionalOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });
    
    // Get balances before cancellation
    const userTokenBefore = await getAccount(client.connection, userTokenAccount);
    const escrowTokenBefore = await getAccount(client.connection, escrowTokenAccount);
    
    // Verify the order is in pending status before cancellation
    let orderAccount = await client.program.account.order.fetch(longOrderPDA);
    expect(Object.keys(orderAccount.status)[0]).to.equal('pending');
    
    // Cancel the long order
  await userClient.cancelOrder({
      orderPDA: longOrderPDA,
      ownerTokenAccount: userTokenAccount,
    });
    
    // Try to fetch the order account after cancellation
    try {
      // The order should be closed, so this should fail
      await client.program.account.order.fetch(longOrderPDA);
      expect.fail("Order account should be closed");
    } catch (error) {
      // This is expected - the account should be closed
      expect((error as Error).message).to.include('Account does not exist');
    }
    
    // Verify collateral was returned to the user
    const userTokenAfter = await getAccount(client.connection, userTokenAccount);
    const escrowTokenAfter = await getAccount(client.connection, escrowTokenAccount);
    
    const userBalanceDiff = new BN(userTokenAfter.amount.toString()).sub(new BN(userTokenBefore.amount.toString()));
    const escrowBalanceDiff = new BN(escrowTokenBefore.amount.toString()).sub(new BN(escrowTokenAfter.amount.toString()));
    
    expect(userBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
    expect(escrowBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
  });

  it('Cancels a short order and returns collateral', async () => {
    // Get balances before cancellation
    const userTokenBefore = await getAccount(client.connection, userTokenAccount);
    const escrowTokenBefore = await getAccount(client.connection, escrowTokenAccount);
    
    // Verify the order is in pending status before cancellation
    let orderAccount = await client.program.account.order.fetch(shortOrderPDA);
    expect(Object.keys(orderAccount.status)[0]).to.equal('pending');
    
    // Cancel the short order
    await userClient.cancelOrder({
      orderPDA: shortOrderPDA,
      ownerTokenAccount: userTokenAccount,
    });
    
    // Try to fetch the order account after cancellation
    try {
      // The order should be closed, so this should fail
      await client.program.account.order.fetch(shortOrderPDA);
      expect.fail("Order account should be closed");
    } catch (error) {
      // This is expected - the account should be closed
      expect((error as Error).message).to.include('Account does not exist');
    }
    
    // Verify collateral was returned to the user
    const userTokenAfter = await getAccount(client.connection, userTokenAccount);
    const escrowTokenAfter = await getAccount(client.connection, escrowTokenAccount);
    
    const userBalanceDiff = new BN(userTokenAfter.amount.toString()).sub(new BN(userTokenBefore.amount.toString()));
    const escrowBalanceDiff = new BN(escrowTokenBefore.amount.toString()).sub(new BN(escrowTokenAfter.amount.toString()));
    
    expect(userBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
    expect(escrowBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
  });
  
  it('Fails to cancel an order by a non-owner', async () => {
    // Create a new order for testing
    const testOrderId = new BN(Date.now() + 200);
    const [testOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), testOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );
    
    // Create the test order
    await userClient.createOrder({
      orderId: testOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });
    
    // Try to cancel the order as a different user (which should fail)
    try {
      await otherUserClient.cancelOrder({
        orderPDA: testOrderPDA,
        ownerTokenAccount: userTokenAccount,
      });
      
      expect.fail('Should have thrown an error');
    } catch (error) {
      // This is expected - should fail with escrow account error for non-owner
      expect((error as Error).message).to.include('AccountNotInitialized');
    }
    
    // Verify order is still in pending status
    const orderAccount = await client.program.account.order.fetch(testOrderPDA);
    expect(Object.keys(orderAccount.status)[0]).to.equal('pending');
    
    // Clean up by cancelling with the correct owner
    await userClient.cancelOrder({
      orderPDA: testOrderPDA,
      ownerTokenAccount: userTokenAccount,
    });
  });

  it('Fails to cancel an already cancelled order', async () => {
    // Create a new order for testing
    const orderIdToCancel = new BN(Date.now() + 300);
    const [orderPDAToCancel] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), orderIdToCancel.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );
    
    // Create the order
    await userClient.createOrder({
      orderId: orderIdToCancel,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });
    
    // Cancel the order first time
    await userClient.cancelOrder({
      orderPDA: orderPDAToCancel,
      ownerTokenAccount: userTokenAccount,
    });
    
    // Try to cancel the order a second time (should fail)
    try {
      await userClient.cancelOrder({
        orderPDA: orderPDAToCancel,
        ownerTokenAccount: userTokenAccount,
      });
      
      expect.fail('Should have thrown an error');
    } catch (error) {
      // This is expected - account should be closed
      expect((error as Error).message).to.include('Account does not exist');
    }
  });
});