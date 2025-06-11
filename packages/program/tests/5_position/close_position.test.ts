import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { initializeProtocolAndRoles } from '../utils/test-setup';

describe('Close Position', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters
  const ORDER_SIZE = new BN(10_000_000); // 10 units
  const COLLATERAL_AMOUNT = new BN(15_000_000); // 15 USDC (assuming 6 decimals)
  const ENTRY_PRICE = new BN(100_000_000); // NAV starts at 100 with 6 decimals
  // Use small price deltas to keep profit/loss within pool liquidity
  const EXIT_PRICE_PROFIT = ENTRY_PRICE.add(new BN(1_000_000)); // 101 for small profit
  const EXIT_PRICE_LOSS = ENTRY_PRICE.sub(new BN(1_000_000)); // 99 for small loss
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

  // Liquidity pool accounts for Closing tests
  let liquidityPool: PublicKey;
  let lpMint: PublicKey;
  let tokenVault: PublicKey;

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
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  before(async () => {
    // Initialize protocol and roles using centralized setup
    const globalAccounts = await initializeProtocolAndRoles(client);
    treasury = client.treasury;
    matcher = globalAccounts.matcher;

    // Create test-specific accounts
    user = Keypair.generate();
    nonMatcher = Keypair.generate();

    // Fund the test-specific accounts
    await requestAirdrop(user.publicKey, client.connection);
    await requestAirdrop(nonMatcher.publicKey, client.connection);

    // Create user clients
    userClient = await TestClient.forUser(user);
    matcherClient = await TestClient.forUser(matcher);
    nonMatcherClient = await TestClient.forUser(nonMatcher);

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
      true, // isPublic
    );
    basktId = createdBasktId;

    // Activate the baskt with initial prices
    // Since weight is 100% (10000 bps), the asset price should equal the target NAV
    await client.activateBaskt(
      basktId,
      [new BN(100_000_000)], // NAV = 100 with 6 decimals
      60, // maxPriceAgeSec
    );

    // Initialize the funding index
    await client.program.methods
      .initializeFundingIndex()
      .accounts({
        authority: client.getPublicKey(),
        baskt: basktId,
      })
      .rpc();

    // Use the USDC mock token for collateral
    collateralMint = USDC_MINT;

    // Create token accounts for the test
    userTokenAccount = await client.getOrCreateUSDCAccount(user.publicKey);
    treasuryTokenAccount = await client.getOrCreateUSDCAccount(treasury.publicKey);

    // Mint USDC tokens to user
    // Need enough for: 1000x collateral for pool liquidity + multiple test positions
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(1020).toNumber(), // 1000x for pool + 20x for multiple tests
    );

    // Set up a liquidity pool for closing positions
    ({ liquidityPool, lpMint, tokenVault } = await client.setupLiquidityPool({
      depositFeeBps: 0,
      withdrawalFeeBps: 0,
      minDeposit: new BN(0),
      collateralMint,
    }));

    // Initialize the protocol registry after liquidity pool setup
    await initializeProtocolAndRoles(client);

    // Create a separate provider for liquidity to avoid role conflicts
    const liquidityProvider = Keypair.generate();
    await requestAirdrop(liquidityProvider.publicKey, client.connection);
    const liquidityProviderClient = await TestClient.forUser(liquidityProvider);

    // Create token accounts for liquidity provider
    const liquidityProviderTokenAccount = await client.getOrCreateUSDCAccount(
      liquidityProvider.publicKey,
    );
    const liquidityProviderLpAccount = await client.createTokenAccount(
      lpMint,
      liquidityProvider.publicKey,
    );

    // Mint USDC to liquidity provider
    await client.mintUSDC(liquidityProviderTokenAccount, COLLATERAL_AMOUNT.muln(1000));

    // Add liquidity using the liquidity provider
    await liquidityProviderClient.addLiquidityToPool({
      liquidityPool,
      amount: COLLATERAL_AMOUNT.muln(1000), // deposit 1000x collateral = 15,000 USDC
      minSharesOut: new BN(1),
      providerTokenAccount: liquidityProviderTokenAccount,
      tokenVault,
      providerLpAccount: liquidityProviderLpAccount,
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
      client.program.programId,
    );

    [positionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), user.publicKey.toBuffer(), positionId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    [closeOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), closeOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    // Find the order and position PDAs for loss scenario
    [openOrderPDALoss] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('order'),
        user.publicKey.toBuffer(),
        openOrderIdLoss.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    [positionPDALoss] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        positionIdLoss.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    [closeOrderPDALoss] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('order'),
        user.publicKey.toBuffer(),
        closeOrderIdLoss.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
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
      baskt: basktId,
      orderOwner: user.publicKey,
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
      baskt: basktId,
      orderOwner: user.publicKey,
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
      client.program.programId,
    );

    // Get token balances before closing
    const userTokenBefore = await getAccount(client.connection, userTokenAccount);
    const treasuryTokenBefore = await getAccount(client.connection, treasuryTokenAccount);
    // Get pool vault balance before closing
    const vaultBefore = await getAccount(client.connection, tokenVault);

    // Close the position with profit
    await matcherClient.closePosition({
      orderPDA: closeOrderPDA,
      position: positionPDA,
      exitPrice: EXIT_PRICE_PROFIT,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Position account should be closed
    try {
      await client.program.account.position.fetch(positionPDA);
      expect.fail('Position account should be closed');
    } catch (err: any) {
      expect(err.message).to.include('Account does not exist');
    }

    // Get token balances after closing
    const userTokenAfter = await getAccount(client.connection, userTokenAccount);
    const treasuryTokenAfter = await getAccount(client.connection, treasuryTokenAccount);

    // Calculate expected exact values
    const PRICE_PRECISION = new BN(10).pow(new BN(6)); // 10^6
    const BPS_DIVISOR = new BN(10000);
    const CLOSING_FEE_BPS = new BN(10);

    // Calculate PnL: (exit_price - entry_price) * size / PRICE_PRECISION
    const priceDelta = EXIT_PRICE_PROFIT.sub(ENTRY_PRICE); // 1_000_000
    const pnl = priceDelta.mul(ORDER_SIZE).div(PRICE_PRECISION); // 10_000_000

    // Calculate closing fee: size * CLOSING_FEE_BPS / BPS_DIVISOR
    const closingFee = ORDER_SIZE.mul(CLOSING_FEE_BPS).div(BPS_DIVISOR); // 10_000

    // Calculate expected user payout: collateral + PnL - fee
    const expectedUserPayout = COLLATERAL_AMOUNT.add(pnl).sub(closingFee); // 24_990_000

    // Verify exact user settlement amount
    const userBalanceDiff = new BN(userTokenAfter.amount.toString()).sub(
      new BN(userTokenBefore.amount.toString()),
    );
    expect(userBalanceDiff.toString()).to.equal(expectedUserPayout.toString());

    // Verify exact treasury fee amount
    const treasuryBalanceDiff = new BN(treasuryTokenAfter.amount.toString()).sub(
      new BN(treasuryTokenBefore.amount.toString()),
    );
    expect(treasuryBalanceDiff.toString()).to.equal(closingFee.toString());

    // Verify liquidity pool vault decreased by exact PnL amount
    const vaultAfter = await getAccount(client.connection, tokenVault);
    const vaultDiff = new BN(vaultBefore.amount.toString()).sub(
      new BN(vaultAfter.amount.toString()),
    );
    // Pool pays out exactly the PnL amount
    expect(vaultDiff.toString()).to.equal(pnl.toString());

    // Position escrow account should be closed after position is closed
    try {
      await getAccount(client.connection, positionEscrow);
      expect.fail('Position escrow account should be closed');
    } catch (error) {
      // This is expected - the account should be closed
      expect((error as Error).toString()).to.include('TokenAccountNotFoundError');
    }

    // Try to fetch the order account - should be closed
    try {
      await client.program.account.order.fetch(closeOrderPDA);
      expect.fail('Order account should be closed');
    } catch (error) {
      // This is expected - the account should be closed
      expect((error as Error).message).to.include('Account does not exist');
    }
  });

  it('Successfully closes a position with loss', async () => {
    // Derive the position escrow token account PDA
    const [positionEscrowLoss] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), positionPDALoss.toBuffer()],
      client.program.programId,
    );

    // Get token balances before closing
    const userTokenBefore = await getAccount(client.connection, userTokenAccount);
    const treasuryTokenBefore = await getAccount(client.connection, treasuryTokenAccount);
    // Get pool vault balance before closing
    const vaultBeforeLoss = await getAccount(client.connection, tokenVault);

    await matcherClient.closePosition({
      orderPDA: closeOrderPDALoss,
      position: positionPDALoss,
      exitPrice: EXIT_PRICE_LOSS,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Position account should be closed
    try {
      await client.program.account.position.fetch(positionPDALoss);
      expect.fail('Position account should be closed');
    } catch (err: any) {
      expect(err.message).to.include('Account does not exist');
    }

    // Get token balances after closing
    const userTokenAfterLoss = await getAccount(client.connection, userTokenAccount);
    const treasuryTokenAfterLoss = await getAccount(client.connection, treasuryTokenAccount);

    // Verify user received settlement amount (collateral - loss - fees)
    const userBalanceDiff = new BN(userTokenAfterLoss.amount.toString()).sub(
      new BN(userTokenBefore.amount.toString()),
    );
    expect(userBalanceDiff.lt(COLLATERAL_AMOUNT)).to.be.true; // Should be less than initial collateral due to loss
    expect(userBalanceDiff.gt(new BN(0))).to.be.true; // Should still receive something back

    // Verify treasury received fees
    const treasuryBalanceDiff = new BN(treasuryTokenAfterLoss.amount.toString()).sub(
      new BN(treasuryTokenBefore.amount.toString()),
    );
    expect(treasuryBalanceDiff.gt(new BN(0))).to.be.true; // Should have received fees

    // Verify liquidity pool vault decreased by pool payout (loss)
    const vaultAfterLossPool = await getAccount(client.connection, tokenVault);
    expect(
      new BN(vaultBeforeLoss.amount.toString()).lt(new BN(vaultAfterLossPool.amount.toString())),
    ).to.be.true;

    // Position escrow account should be closed after position is closed
    try {
      await getAccount(client.connection, positionEscrowLoss);
      expect.fail('Position escrow account should be closed');
    } catch (error) {
      // This is expected - the account should be closed
      expect((error as Error).toString()).to.include('TokenAccountNotFoundError');
    }

    // Try to fetch the order account - should be closed
    try {
      await client.program.account.order.fetch(closeOrderPDALoss);
      expect.fail('Order account should be closed');
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
      [
        Buffer.from('order'),
        user.publicKey.toBuffer(),
        newOpenOrderId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    const [newPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        newPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    const [newCloseOrderPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('order'),
        user.publicKey.toBuffer(),
        newCloseOrderId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
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
      baskt: basktId,
      orderOwner: user.publicKey,
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
        orderPDA: newCloseOrderPDA,
        position: newPositionPDA,
        exitPrice: EXIT_PRICE_PROFIT,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });
      expect.fail('Transaction should have failed due to missing matcher role');
    } catch (error: any) {
      // This error should come from the on-chain unauthorized check
      // console.debug('Non-matcher close error:', error.toString());
      expect(error.error.errorName || error.toString()).to.include('Unauthorized');
    }
  });

  it('Successfully closes position with price within oracle deviation bounds (25%)', async () => {
    // Oracle price is NAV = 100 with 6 decimals = 100_000_000
    // 25% deviation = ±25 = ±25_000_000
    // Valid range: 75_000_000 to 125_000_000

    const validExitPriceHigh = new BN(124_000_000); // 124 - within 25% bound
    const validExitPriceLow = new BN(76_000_000); // 76 - within 25% bound

    // Create positions for testing valid price ranges
    const highOrderId = new BN(Date.now() + 500);
    const highPositionId = new BN(Date.now() + 501);
    const highCloseOrderId = new BN(Date.now() + 502);

    const [highOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), highOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [highPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        highPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    const [highCloseOrderPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('order'),
        user.publicKey.toBuffer(),
        highCloseOrderId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    // Create and open position
    await userClient.createOrder({
      orderId: highOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    await matcherClient.openPosition({
      positionId: highPositionId,
      entryPrice: ENTRY_PRICE,
      order: highOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Create close order
    await userClient.createOrder({
      orderId: highCloseOrderId,
      size: ORDER_SIZE,
      collateral: new BN(0),
      isLong: true,
      action: { close: {} },
      targetPosition: highPositionPDA,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Should succeed with valid high exit price
    await matcherClient.closePosition({
      orderPDA: highCloseOrderPDA,
      position: highPositionPDA,
      exitPrice: validExitPriceHigh,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Verify position is closed
    try {
      await client.program.account.position.fetch(highPositionPDA);
      expect.fail('Position account should be closed');
    } catch (err: any) {
      expect(err.message).to.include('Account does not exist');
    }

    // Test with low valid price - create another position
    const lowOrderId = new BN(Date.now() + 510);
    const lowPositionId = new BN(Date.now() + 511);
    const lowCloseOrderId = new BN(Date.now() + 512);

    const [lowOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), lowOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [lowPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        lowPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    const [lowCloseOrderPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('order'),
        user.publicKey.toBuffer(),
        lowCloseOrderId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    // Create and open position
    await userClient.createOrder({
      orderId: lowOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    await matcherClient.openPosition({
      positionId: lowPositionId,
      entryPrice: ENTRY_PRICE,
      order: lowOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Create close order
    await userClient.createOrder({
      orderId: lowCloseOrderId,
      size: ORDER_SIZE,
      collateral: new BN(0),
      isLong: true,
      action: { close: {} },
      targetPosition: lowPositionPDA,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Should succeed with valid low exit price
    await matcherClient.closePosition({
      orderPDA: lowCloseOrderPDA,
      position: lowPositionPDA,
      exitPrice: validExitPriceLow,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Verify position is closed
    try {
      await client.program.account.position.fetch(lowPositionPDA);
      expect.fail('Position account should be closed');
    } catch (err: any) {
      expect(err.message).to.include('Account does not exist');
    }
  });

  it('Fails to close position with price outside oracle deviation bounds (>25%)', async () => {
    // Oracle price is NAV = 100 with 6 decimals = 100_000_000
    // 25% deviation = ±25 = ±25_000_000
    // Invalid range: <75_000_000 or >125_000_000

    const invalidExitPriceHigh = new BN(130_000_000); // 130 - outside 25% bound
    const invalidExitPriceLow = new BN(70_000_000); // 70 - outside 25% bound

    // Test with invalid high price
    const highOrderId = new BN(Date.now() + 600);
    const highPositionId = new BN(Date.now() + 601);
    const highCloseOrderId = new BN(Date.now() + 602);

    const [highOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), highOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [highPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        highPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    const [highCloseOrderPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('order'),
        user.publicKey.toBuffer(),
        highCloseOrderId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    // Create and open position
    await userClient.createOrder({
      orderId: highOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    await matcherClient.openPosition({
      positionId: highPositionId,
      entryPrice: ENTRY_PRICE,
      order: highOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Create close order
    await userClient.createOrder({
      orderId: highCloseOrderId,
      size: ORDER_SIZE,
      collateral: new BN(0),
      isLong: true,
      action: { close: {} },
      targetPosition: highPositionPDA,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Should fail with invalid high exit price
    try {
      await matcherClient.closePosition({
        orderPDA: highCloseOrderPDA,
        position: highPositionPDA,
        exitPrice: invalidExitPriceHigh,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail('Transaction should have failed due to price outside deviation bounds');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }

    // Test with invalid low price
    const lowOrderId = new BN(Date.now() + 610);
    const lowPositionId = new BN(Date.now() + 611);
    const lowCloseOrderId = new BN(Date.now() + 612);

    const [lowOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), lowOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [lowPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        lowPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    const [lowCloseOrderPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('order'),
        user.publicKey.toBuffer(),
        lowCloseOrderId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    // Create and open position
    await userClient.createOrder({
      orderId: lowOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    await matcherClient.openPosition({
      positionId: lowPositionId,
      entryPrice: ENTRY_PRICE,
      order: lowOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Create close order
    await userClient.createOrder({
      orderId: lowCloseOrderId,
      size: ORDER_SIZE,
      collateral: new BN(0),
      isLong: true,
      action: { close: {} },
      targetPosition: lowPositionPDA,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Should fail with invalid low exit price
    try {
      await matcherClient.closePosition({
        orderPDA: lowCloseOrderPDA,
        position: lowPositionPDA,
        exitPrice: invalidExitPriceLow,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail('Transaction should have failed due to price outside deviation bounds');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }
  });

  it('Fails to close position with zero exit price', async () => {
    const zeroOrderId = new BN(Date.now() + 700);
    const zeroPositionId = new BN(Date.now() + 701);
    const zeroCloseOrderId = new BN(Date.now() + 702);

    const [zeroOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), zeroOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [zeroPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        zeroPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    const [zeroCloseOrderPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('order'),
        user.publicKey.toBuffer(),
        zeroCloseOrderId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    // Create and open position
    await userClient.createOrder({
      orderId: zeroOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    await matcherClient.openPosition({
      positionId: zeroPositionId,
      entryPrice: ENTRY_PRICE,
      order: zeroOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Create close order
    await userClient.createOrder({
      orderId: zeroCloseOrderId,
      size: ORDER_SIZE,
      collateral: new BN(0),
      isLong: true,
      action: { close: {} },
      targetPosition: zeroPositionPDA,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Should fail with zero exit price
    try {
      await matcherClient.closePosition({
        orderPDA: zeroCloseOrderPDA,
        position: zeroPositionPDA,
        exitPrice: new BN(0),
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail('Transaction should have failed due to zero exit price');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('InvalidOraclePrice');
    }
  });
});
