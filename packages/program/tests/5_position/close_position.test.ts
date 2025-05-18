import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { AccessControlRole } from '@baskt/types';

describe('Close Position', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters
  const ORDER_SIZE = new BN(10_000_000); // 10 units
  const COLLATERAL_AMOUNT = new BN(15_000_000); // 15 USDC (assuming 6 decimals)
  const ENTRY_PRICE = new BN(50_000_000_000_000); // $50,000 with 9 decimals
  // Use small price deltas to keep profit/loss within pool liquidity
  const EXIT_PRICE_PROFIT = ENTRY_PRICE.add(new BN(1_000_000_000)); // $50,001 for small profit
  const EXIT_PRICE_LOSS = ENTRY_PRICE.sub(new BN(1_000_000_000)); // $49,999 for small loss
  const TICKER = 'BTC';

  // Test accounts
  let user: Keypair;
  let treasury: Keypair;
  let matcher: Keypair;
  let nonMatcher: Keypair;
  let userClient: TestClient;
  let matcherClient: TestClient;
  let nonMatcherClient: TestClient;

  // Test state
  let basktId: PublicKey;
  let collateralMint: PublicKey;
  let userTokenAccount: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let assetId: PublicKey;
  let fundingIndexPDA: PublicKey;

  // Liquidity pool accounts for Closing tests
  let liquidityPool: PublicKey;
  let lpMint: PublicKey;
  let tokenVault: PublicKey;
  let providerLpAccount: PublicKey;

  // Position state for profit scenario
  let openOrderId: BN;
  let openOrderPDA: PublicKey;
  let positionId: BN;
  let positionPDA: PublicKey;
  let closeOrderId: BN;
  let closeOrderPDA: PublicKey;

  // Position state for loss scenario
  let openOrderIdLoss: BN;
  let openOrderPDALoss: PublicKey;
  let positionIdLoss: BN;
  let positionPDALoss: PublicKey;
  let closeOrderIdLoss: BN;
  let closeOrderPDALoss: PublicKey;

  // USDC mint constant from the program
  const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

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
    nonMatcher = Keypair.generate();

    // Fund the test accounts
    await requestAirdrop(user.publicKey, client.connection);
    await requestAirdrop(treasury.publicKey, client.connection);
    await requestAirdrop(matcher.publicKey, client.connection);
    await requestAirdrop(nonMatcher.publicKey, client.connection);

    // Create user clients
    userClient = await TestClient.forUser(user);
    matcherClient = await TestClient.forUser(matcher);
    nonMatcherClient = await TestClient.forUser(nonMatcher);

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
    const basktName = `TestBaskt_ClosePos_${Date.now()}`;

    // Format asset config correctly
    const formattedAssetConfig = {
      weight: new BN(10000), // 100% weight (10000 bps)
      direction: true, // Long direction
      assetId: assetId, // Include the asset ID in the config
      baselinePrice: new BN(0), // Required by OnchainAssetConfig interface
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

    // Find the funding index PDA for the baskt
    [fundingIndexPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('funding_index'), basktId.toBuffer()],
      client.program.programId
    );

    // Initialize the funding index
    await client.program.methods
      .initializeFundingIndex()
      .accounts({
        authority: client.getPublicKey(),
        // @ts-ignore: fundingIndex matches IDL but TS types are out of sync
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
        protocol: client.protocolPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Use the USDC mock token for collateral
    collateralMint = USDC_MINT;

    // Create token accounts for the test
    userTokenAccount = await client.getOrCreateUSDCAccount(user.publicKey);
    treasuryTokenAccount = await client.getOrCreateUSDCAccount(treasury.publicKey);

    // Find the funding index PDA for the baskt
    [fundingIndexPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('funding_index'), basktId.toBuffer()],
      client.program.programId
    );

    // Mint USDC tokens to user
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(10).toNumber() // 10x for multiple tests
    );

    // Set up a liquidity pool for closing positions
    ({ liquidityPool, lpMint, tokenVault } = await client.setupLiquidityPool({
      depositFeeBps: 0,
      withdrawalFeeBps: 0,
      minDeposit: new BN(0),
      collateralMint,
    }));
    // Create LP token account for provider (user)
    providerLpAccount = await userClient.createTokenAccount(lpMint, user.publicKey);
    // Deposit liquidity into the pool to cover settlements
    await userClient.addLiquidityToPool({
      liquidityPool,
      amount: COLLATERAL_AMOUNT.muln(5), // deposit 5x collateral
      minSharesOut: new BN(1),
      providerTokenAccount: userTokenAccount,
      tokenVault,
      providerLpAccount,
      lpMint,
      treasuryTokenAccount,
      treasury: treasury.publicKey,
    });

    // Generate unique IDs for orders and positions
    openOrderId = new BN(Date.now());
    positionId = new BN(Date.now() + 1);
    closeOrderId = new BN(Date.now() + 2);

    openOrderIdLoss = new BN(Date.now() + 100);
    positionIdLoss = new BN(Date.now() + 101);
    closeOrderIdLoss = new BN(Date.now() + 102);

    // Find the order and position PDAs for profit scenario
    [openOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), openOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    [positionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), user.publicKey.toBuffer(), positionId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    [closeOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), closeOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    // Find the order and position PDAs for loss scenario
    [openOrderPDALoss] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), openOrderIdLoss.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    [positionPDALoss] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), user.publicKey.toBuffer(), positionIdLoss.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    [closeOrderPDALoss] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), closeOrderIdLoss.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    // Create an open order and position for profit scenario
    await userClient.createOrder({
      orderId: openOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Open the position for profit scenario
    await matcherClient.openPosition({
      positionId: positionId,
      entryPrice: ENTRY_PRICE,
      order: openOrderPDA,
      position: positionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Create a close order for the position
    await userClient.createOrder({
      orderId: closeOrderId,
      size: ORDER_SIZE, // Full size to close
      collateral: new BN(0), // No collateral needed for close
      isLong: true, // Same direction as position
      action: { close: {} },
      targetPosition: positionPDA,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Create an open order and position for loss scenario
    await userClient.createOrder({
      orderId: openOrderIdLoss,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Open the position for loss scenario
    await matcherClient.openPosition({
      positionId: positionIdLoss,
      entryPrice: ENTRY_PRICE,
      order: openOrderPDALoss,
      position: positionPDALoss,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Create a close order for the loss position
    await userClient.createOrder({
      orderId: closeOrderIdLoss,
      size: ORDER_SIZE, // Full size to close
      collateral: new BN(0), // No collateral needed for close
      isLong: true, // Same direction as position
      action: { close: {} },
      targetPosition: positionPDALoss,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });
  });

  it('Successfully closes a position with profit', async () => {
    // Derive the position escrow token account PDA
    const [positionEscrow] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), positionPDA.toBuffer()],
      client.program.programId
    );

    // Get token balances before closing
    const userTokenBefore = await getAccount(client.connection, userTokenAccount);
    const treasuryTokenBefore = await getAccount(client.connection, treasuryTokenAccount);
    // Get pool vault balance before closing
    const vaultBefore = await getAccount(client.connection, tokenVault);

    // Close the position with profit
    await matcherClient.closePosition({
      order: closeOrderPDA,
      position: positionPDA,
      exitPrice: EXIT_PRICE_PROFIT,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Position account should be closed
    try {
      await client.program.account.position.fetch(positionPDA);
      expect.fail("Position account should be closed");
    } catch (err: any) {
      expect(err.message).to.include('Account does not exist');
    }

    // Get token balances after closing
    const userTokenAfter = await getAccount(client.connection, userTokenAccount);
    const treasuryTokenAfter = await getAccount(client.connection, treasuryTokenAccount);

    // Calculate expected exact values
    const PRICE_PRECISION = new BN(10).pow(new BN(9)); // 10^9
    const BPS_DIVISOR = new BN(10000);
    const CLOSING_FEE_BPS = new BN(10);
    
    // Calculate PnL: (exit_price - entry_price) * size / PRICE_PRECISION
    const priceDelta = EXIT_PRICE_PROFIT.sub(ENTRY_PRICE); // 1_000_000_000
    const pnl = priceDelta.mul(ORDER_SIZE).div(PRICE_PRECISION); // 10_000_000
    
    // Calculate closing fee: size * CLOSING_FEE_BPS / BPS_DIVISOR
    const closingFee = ORDER_SIZE.mul(CLOSING_FEE_BPS).div(BPS_DIVISOR); // 10_000
    
    // Calculate expected user payout: collateral + PnL - fee
    const expectedUserPayout = COLLATERAL_AMOUNT.add(pnl).sub(closingFee); // 24_990_000
    
    // Verify exact user settlement amount
    const userBalanceDiff = new BN(userTokenAfter.amount.toString()).sub(new BN(userTokenBefore.amount.toString()));
    expect(userBalanceDiff.toString()).to.equal(expectedUserPayout.toString());

    // Verify exact treasury fee amount
    const treasuryBalanceDiff = new BN(treasuryTokenAfter.amount.toString()).sub(new BN(treasuryTokenBefore.amount.toString()));
    expect(treasuryBalanceDiff.toString()).to.equal(closingFee.toString());

    // Verify liquidity pool vault decreased by exact PnL amount
    const vaultAfter = await getAccount(client.connection, tokenVault);
    const vaultDiff = new BN(vaultBefore.amount.toString()).sub(new BN(vaultAfter.amount.toString()));
    // Pool pays out exactly the PnL amount
    expect(vaultDiff.toString()).to.equal(pnl.toString());

    // Position escrow account should be closed after position is closed
    try {
      await getAccount(client.connection, positionEscrow);
      expect.fail("Position escrow account should be closed");
    } catch (error) {
      // This is expected - the account should be closed
      expect((error as Error).toString()).to.include('TokenAccountNotFoundError');
    }

    // Try to fetch the order account - should be closed
    try {
      await client.program.account.order.fetch(closeOrderPDA);
      expect.fail("Order account should be closed");
    } catch (error) {
      // This is expected - the account should be closed
      expect((error as Error).message).to.include('Account does not exist');
    }
  });

  it('Successfully closes a position with loss', async () => {
    // Derive the position escrow token account PDA
    const [positionEscrowLoss] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), positionPDALoss.toBuffer()],
      client.program.programId
    );

    // Get token balances before closing
    const userTokenBefore = await getAccount(client.connection, userTokenAccount);
    const treasuryTokenBefore = await getAccount(client.connection, treasuryTokenAccount);
    // Get pool vault balance before closing
    const vaultBeforeLoss = await getAccount(client.connection, tokenVault);

    // Try to get position escrow account if it exists
    let positionEscrowBefore;
    try {
      positionEscrowBefore = await getAccount(client.connection, positionEscrowLoss);
    } catch (error) {
      // Position escrow might not exist yet, which is fine
    }

    // Close the position with loss
    const txSignatureLoss = await matcherClient.closePosition({
      order: closeOrderPDALoss,
      position: positionPDALoss,
      exitPrice: EXIT_PRICE_LOSS,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Position account should be closed
    try {
      await client.program.account.position.fetch(positionPDALoss);
      expect.fail("Position account should be closed");
    } catch (err: any) {
      expect(err.message).to.include('Account does not exist');
    }

    // Get token balances after closing
    const userTokenAfterLoss = await getAccount(client.connection, userTokenAccount);
    const treasuryTokenAfterLoss = await getAccount(client.connection, treasuryTokenAccount);

    // Verify user received settlement amount (collateral - loss - fees)
    const userBalanceDiff = new BN(userTokenAfterLoss.amount.toString()).sub(new BN(userTokenBefore.amount.toString()));
    expect(userBalanceDiff.lt(COLLATERAL_AMOUNT)).to.be.true; // Should be less than initial collateral due to loss
    expect(userBalanceDiff.gt(new BN(0))).to.be.true; // Should still receive something back

    // Verify treasury received fees
    const treasuryBalanceDiff = new BN(treasuryTokenAfterLoss.amount.toString()).sub(new BN(treasuryTokenBefore.amount.toString()));
    expect(treasuryBalanceDiff.gt(new BN(0))).to.be.true; // Should have received fees

    // Verify liquidity pool vault decreased by pool payout (loss)
    const vaultAfterLossPool = await getAccount(client.connection, tokenVault);
    expect(new BN(vaultBeforeLoss.amount.toString()).lt(new BN(vaultAfterLossPool.amount.toString()))).to.be.true;

    // Position escrow account should be closed after position is closed
    try {
      await getAccount(client.connection, positionEscrowLoss);
      expect.fail("Position escrow account should be closed");
    } catch (error) {
      // This is expected - the account should be closed
      expect((error as Error).toString()).to.include('TokenAccountNotFoundError');
    }

    // Try to fetch the order account - should be closed
    try {
      await client.program.account.order.fetch(closeOrderPDALoss);
      expect.fail("Order account should be closed");
    } catch (error) {
      // This is expected - the account should be closed
      expect((error as Error).message).to.include('Account does not exist');
    }
  });

  it('Fails to close a position without matcher role', async () => {
    // Create a new position for this test
    const newOpenOrderId = new BN(Date.now() + 200);
    const newPositionId = new BN(Date.now() + 201);
    const newCloseOrderId = new BN(Date.now() + 202);

    // Find the PDAs
    const [newOpenOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), newOpenOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    const [newPositionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), user.publicKey.toBuffer(), newPositionId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    const [newCloseOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), newCloseOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    // Create an open order
    await userClient.createOrder({
      orderId: newOpenOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Open the position
    await matcherClient.openPosition({
      positionId: newPositionId,
      entryPrice: ENTRY_PRICE,
      order: newOpenOrderPDA,
      position: newPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Create a close order
    await userClient.createOrder({
      orderId: newCloseOrderId,
      size: ORDER_SIZE,
      collateral: new BN(0),
      isLong: true,
      action: { close: {} },
      targetPosition: newPositionPDA,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });
    // Try to close the position with a non-matcher (should fail)
    try {
      await nonMatcherClient.closePosition({
        order: newCloseOrderPDA,
        position: newPositionPDA,
        exitPrice: EXIT_PRICE_PROFIT,
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });
      expect.fail("Transaction should have failed due to missing matcher role");
    } catch (error: any) {
      // This error should come from the on-chain unauthorized check
      // console.debug('Non-matcher close error:', error.toString());
      expect(error.error.errorName || error.toString()).to.include('Unauthorized');
    }
  });
});
