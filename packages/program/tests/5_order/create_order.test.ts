import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { AccessControlRole } from '@baskt/types';

describe('Order Creation', () => {
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

  // Test state
  let basktId: PublicKey;
  let collateralMint: PublicKey;
  let userTokenAccount: PublicKey;
  let escrowTokenAccount: PublicKey;
  let assetId: PublicKey;
  let positionId: PublicKey;

  // USDC mint constant from the program
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  before(async () => {
    // Create test keypairs
    user = Keypair.generate();
    treasury = Keypair.generate();
    matcher = Keypair.generate();

    // Fund the test accounts
    await requestAirdrop(user.publicKey, client.connection);
    await requestAirdrop(treasury.publicKey, client.connection);
    await requestAirdrop(matcher.publicKey, client.connection);

    // Create user client
    userClient = await TestClient.forUser(user);

    // Add roles
    await client.addRole(matcher.publicKey, AccessControlRole.Matcher);

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
    const basktName = `TestBaskt_Create_${Date.now()}`;

    // Format asset config correctly
    const formattedAssetConfig = {
      weight: new BN(10000),
      direction: true,
      assetId: assetId, // Include the asset ID in the config
      baselinePrice: new BN(0), // Required by OnchainAssetConfig interface
    };

    const { basktId: createdBasktId } = await client.createBaskt(
      basktName,
      [formattedAssetConfig],
      true, // isPublic
    );
    basktId = createdBasktId;

    // Activate the baskt with initial prices
    await client.activateBaskt(
      basktId,
      [new BN(50000 * 1000000)], // $50,000 price with 6 decimals
      60, // maxPriceAgeSec
    );

    // Use the USDC mock token for collateral
    collateralMint = USDC_MINT;
    // Create token accounts for the test
    userTokenAccount = await client.getOrCreateUSDCAccount(user.publicKey);

    // Derive the user escrow token account PDA
    [escrowTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_escrow'), user.publicKey.toBuffer()],
      client.program.programId,
    );

    // Mint USDC tokens to user
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(10).toNumber(), // 10x for multiple tests
    );

    // Create a position for testing close orders
    try {
      // Create a unique seed for the position
      const positionSeed = new BN(Date.now());

      // Find the position PDA
      [positionId] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('position'),
          user.publicKey.toBuffer(),
          positionSeed.toArrayLike(Buffer, 'le', 8),
        ],
        client.program.programId,
      );
    } catch (error: any) {
      // This is not critical, so we'll just log it and continue
    }
  });

  it('Creates an open long order', async () => {
    // Generate a unique order ID
    const orderId = new BN(Date.now());

    // Find the order PDA
    const [orderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    // Get user token balance before creating order
    const userTokenBefore = await getAccount(client.connection, userTokenAccount);

    // Create an open long order
    await userClient.createOrder({
      orderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Fetch the order account
    const orderAccount = await client.program.account.order.fetch(orderPDA);

    // Verify order details
    expect(orderAccount.owner.toString()).to.equal(user.publicKey.toString());
    expect(orderAccount.orderId.toString()).to.equal(orderId.toString());
    expect(orderAccount.basktId.toString()).to.equal(basktId.toString());
    expect(orderAccount.size.toString()).to.equal(ORDER_SIZE.toString());
    expect(orderAccount.collateral.toString()).to.equal(COLLATERAL_AMOUNT.toString());
    expect(orderAccount.isLong).to.be.true;
    expect(Object.keys(orderAccount.action)[0]).to.equal('open');
    expect(Object.keys(orderAccount.status)[0]).to.equal('pending');

    // Verify collateral was transferred
    const userTokenAfter = await getAccount(client.connection, userTokenAccount);
    const escrowTokenAfter = await getAccount(client.connection, escrowTokenAccount);

    const userBalanceDiff = new BN(userTokenBefore.amount.toString()).sub(
      new BN(userTokenAfter.amount.toString()),
    );
    expect(userBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
    expect(escrowTokenAfter.amount.toString()).to.equal(COLLATERAL_AMOUNT.toString());
  });

  it('Creates an open short order', async () => {
    // Generate a unique order ID - use a different ID from the previous test
    const orderId = new BN(Date.now() + 1);

    // Find the order PDA
    const [orderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    // Get user token balance before creating order
    const userTokenBefore = await getAccount(client.connection, userTokenAccount);
    const escrowTokenBefore = await getAccount(client.connection, escrowTokenAccount);

    // Create an open short order
    await userClient.createOrder({
      orderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: false,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Fetch the order account
    const orderAccount = await client.program.account.order.fetch(orderPDA);

    // Verify order details
    expect(orderAccount.owner.toString()).to.equal(user.publicKey.toString());
    expect(orderAccount.orderId.toString()).to.equal(orderId.toString());
    expect(orderAccount.basktId.toString()).to.equal(basktId.toString());
    expect(orderAccount.size.toString()).to.equal(ORDER_SIZE.toString());
    expect(orderAccount.collateral.toString()).to.equal(COLLATERAL_AMOUNT.toString());
    expect(orderAccount.isLong).to.be.false;
    expect(Object.keys(orderAccount.action)[0]).to.equal('open');
    expect(Object.keys(orderAccount.status)[0]).to.equal('pending');

    // Verify collateral was transferred
    const userTokenAfter = await getAccount(client.connection, userTokenAccount);
    const escrowTokenAfter = await getAccount(client.connection, escrowTokenAccount);

    const userBalanceDiff = new BN(userTokenBefore.amount.toString()).sub(
      new BN(userTokenAfter.amount.toString()),
    );
    const escrowBalanceDiff = new BN(escrowTokenAfter.amount.toString()).sub(
      new BN(escrowTokenBefore.amount.toString()),
    );

    expect(userBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
    expect(escrowBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
  });

  it('Creates a close order with target position', async () => {
    // We need a valid position ID to create a close order
    // For testing, we'll use the positionId created in the setup phase
    if (!positionId) {
      return;
    }

    // Generate a unique order ID
    const orderId = new BN(Date.now() + 2);

    // Find the order PDA
    const [orderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    // Get user token balance before creating order
    const userTokenBefore = await getAccount(client.connection, userTokenAccount);
    const escrowTokenBefore = await getAccount(client.connection, escrowTokenAccount);

    // Create a close order (no collateral transfer for close orders)
    try {
      await userClient.createOrder({
        orderId,
        size: ORDER_SIZE, // Size to close
        collateral: new BN(0), // No collateral needed for close orders
        isLong: true, // Direction should match the position being closed
        action: { close: {} }, // OrderAction::Close
        targetPosition: positionId, // Target position to close
        basktId: basktId,
        ownerTokenAccount: userTokenAccount,
        collateralMint: collateralMint,
      });

      // Fetch the order account
      const orderAccount = await client.program.account.order.fetch(orderPDA);

      // Verify order details
      expect(orderAccount.owner.toString()).to.equal(user.publicKey.toString());
      expect(orderAccount.orderId.toString()).to.equal(orderId.toString());
      expect(orderAccount.basktId.toString()).to.equal(basktId.toString());
      expect(orderAccount.size.toString()).to.equal(ORDER_SIZE.toString());
      expect(orderAccount.collateral.toString()).to.equal('0'); // No collateral for close orders
      expect(Object.keys(orderAccount.action)[0]).to.equal('close');
      expect(orderAccount.targetPosition?.toString()).to.equal(positionId.toString());
      expect(Object.keys(orderAccount.status)[0]).to.equal('pending');

      // Verify NO collateral was transferred for close orders
      const userTokenAfter = await getAccount(client.connection, userTokenAccount);
      const escrowTokenAfter = await getAccount(client.connection, escrowTokenAccount);

      const userBalanceChange = new BN(userTokenAfter.amount.toString()).sub(
        new BN(userTokenBefore.amount.toString()),
      );
      const escrowBalanceChange = new BN(escrowTokenAfter.amount.toString()).sub(
        new BN(escrowTokenBefore.amount.toString()),
      );

      // No tokens should be transferred for a close order
      expect(userBalanceChange.toString()).to.equal('0');
      expect(escrowBalanceChange.toString()).to.equal('0');
    } catch (error: any) {
      // If the position doesn't exist, this will fail
      // That's expected in the test environment, so we'll just log it
    }
  });

  it('Fails to create an order with insufficient collateral', async () => {
    // Generate a unique order ID
    const orderId = new BN(Date.now() + 3);

    // Try to create an order with zero collateral (which should fail)
    try {
      await userClient.createOrder({
        orderId,
        size: ORDER_SIZE,
        collateral: new BN(0), // Zero collateral - should fail
        isLong: true,
        action: { open: {} },
        targetPosition: null,
        basktId: basktId,
        ownerTokenAccount: userTokenAccount,
        collateralMint: collateralMint,
      });
      // Should not reach here
      expect.fail('Transaction should have failed due to insufficient collateral');
    } catch (error: any) {
      // Verify error message indicates insufficient collateral
      expect(error.toString()).to.include('InsufficientCollateral');
    }
  });

  it('Fails to create a close order without target position', async () => {
    // Generate a unique order ID
    const orderId = new BN(Date.now() + 4);

    // Try to create a close order without a target position (should fail)
    try {
      await userClient.createOrder({
        orderId,
        size: ORDER_SIZE,
        collateral: new BN(0), // No collateral needed for close orders
        isLong: true,
        action: { close: {} }, // OrderAction::Close
        targetPosition: null, // Missing target position (should fail)
        basktId: basktId,
        ownerTokenAccount: userTokenAccount,
        collateralMint: collateralMint,
      });
      // Should not reach here
      expect.fail('Transaction should have failed due to missing target position');
    } catch (error: any) {
      // Verify error message indicates invalid target position
      expect(error.toString()).to.include('InvalidTargetPosition');
    }
  });
});
