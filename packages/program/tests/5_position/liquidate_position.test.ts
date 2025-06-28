import { expect } from 'chai';
import { describe, it, before, afterEach, after } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient, requestAirdrop } from '../utils/test-client';
// Using TestClient static method instead of importing from test-setup
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';
import { MIN_COLLATERAL_RATIO_BPS, OPENING_FEE_BPS, BASE_NAV_BN, BASELINE_PRICE } from '../utils/test-constants';

describe('Liquidate Position', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters
  const ORDER_SIZE = new BN(1_000_000); // 1 unit
  const ENTRY_PRICE = BASELINE_PRICE; // NAV starts at $1 with 6 decimals

  // Calculate required collateral based on worst-case notional (limit price + slippage)
  // Base notional = 1 * 1 = 1 USDC
  // Slippage (5%) = 0.05 USDC
  // Worst-case notional = 1.05 USDC
  // Min collateral (100%) = 1.05 USDC
  // Opening fee (0.1%) = 0.00105 USDC
  // Total required = 1.05105 USDC
  const BASE_NOTIONAL = ORDER_SIZE.mul(ENTRY_PRICE).div(new BN(1_000_000)); // 1 USDC
  const SLIPPAGE_ADJUSTMENT = BASE_NOTIONAL.muln(500).divn(10000); // 5% = 0.05 USDC
  const WORST_CASE_NOTIONAL = BASE_NOTIONAL.add(SLIPPAGE_ADJUSTMENT); // 1.05 USDC
  const MIN_COLLATERAL = WORST_CASE_NOTIONAL.muln(MIN_COLLATERAL_RATIO_BPS).divn(10000); // 100% = 1.05 USDC
  const OPENING_FEE = WORST_CASE_NOTIONAL.muln(OPENING_FEE_BPS).divn(10000); // 0.1% = 0.00105 USDC
  const COLLATERAL_AMOUNT = MIN_COLLATERAL.add(OPENING_FEE).muln(105).divn(100); // Total + 5% buffer

  // With 40% liquidation threshold, SHORT position needs ~60% price rise to be liquidatable
  const LIQUIDATION_PRICE = new BN(1_730_000); // $1.73 with 6 decimals (73% price rise for SHORT liquidation)
  const NON_LIQUIDATION_PRICE = new BN(1_200_000); // $1.20 with 6 decimals (20% price rise - not enough for liquidation)
  const TICKER = 'BTC';

  // Test accounts
  let user: Keypair;
  let treasury: Keypair;
  let matcher: Keypair;
  let liquidator: Keypair;
  let nonLiquidator: Keypair;
  let userClient: TestClient;
  let matcherClient: TestClient;
  let liquidatorClient: TestClient;
  let nonLiquidatorClient: TestClient;

  // Test state
  let basktId: PublicKey;
  let collateralMint: PublicKey;
  let userTokenAccount: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let assetId: PublicKey;

  // Position state for liquidation
  let orderId: BN;
  let orderPDA: PublicKey;
  let positionId: BN;
  let positionPDA: PublicKey;

  // Position state for non-liquidation
  let orderIdSafe: BN;
  let orderPDASafe: PublicKey;
  let positionIdSafe: BN;
  let positionPDASafe: PublicKey;

  // Protocol configuration backup
  let prevThreshold: number;

  // USDC mint constant from the program
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  // Liquidity pool accounts for liquidation tests
  let liquidityPool: PublicKey;
  let lpMint: PublicKey;
  let tokenVault: PublicKey;

  before(async () => {
    // Initialize protocol and roles using centralized setup
    const globalAccounts = await TestClient.initializeProtocolAndRoles(client);
    treasury = client.treasury;
    matcher = globalAccounts.matcher;
    liquidator = globalAccounts.liquidator;

    // Save current liquidation threshold and set to 40% for testing
    prevThreshold = (await client.getProtocolAccount()).config.liquidationThresholdBps.toNumber();
    await client.setLiquidationThresholdBps(4000); // 40%

    // Create test-specific accounts
    user = Keypair.generate();
    nonLiquidator = Keypair.generate();

    // Fund the test-specific accounts
    await requestAirdrop(user.publicKey, client.connection);
    await requestAirdrop(nonLiquidator.publicKey, client.connection);

    // Create user clients
    userClient = await TestClient.forUser(user);
    matcherClient = await TestClient.forUser(matcher);
    liquidatorClient = await TestClient.forUser(liquidator);
    nonLiquidatorClient = await TestClient.forUser(nonLiquidator);

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
    const basktName = `TestBaskt_Liquidate_${Date.now()}`;

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
      [BASELINE_PRICE], // NAV = $1 with 6 decimals
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
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(50).toNumber(), // 50x for multiple tests (9 orders + liquidity pool)
    );

    // Set up a liquidity pool for liquidation tests
    ({ liquidityPool, lpMint, tokenVault } = await client.setupLiquidityPool({
      depositFeeBps: 0,
      withdrawalFeeBps: 0,
      minDeposit: new BN(0),
      collateralMint,
    }));

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
    await client.mintUSDC(liquidityProviderTokenAccount, COLLATERAL_AMOUNT.muln(3));

    // Add liquidity using the liquidity provider
    await liquidityProviderClient.addLiquidityToPool({
      liquidityPool,
      amount: COLLATERAL_AMOUNT.muln(3), // deposit 3x collateral
      minSharesOut: new BN(1),
      providerTokenAccount: liquidityProviderTokenAccount,
      tokenVault,
      providerLpAccount: liquidityProviderLpAccount,
      lpMint,
      treasuryTokenAccount,
      treasury: treasury.publicKey,
    });

    // Generate unique IDs for orders and positions
    orderId = new BN(Date.now());
    positionId = new BN(Date.now() + 1);
    orderIdSafe = new BN(Date.now() + 100);
    positionIdSafe = new BN(Date.now() + 101);

    // Find the order and position PDAs for liquidation scenario
    [orderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    [positionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), user.publicKey.toBuffer(), positionId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    // Find the order and position PDAs for non-liquidation scenario
    [orderPDASafe] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), orderIdSafe.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    [positionPDASafe] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        positionIdSafe.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    // Create an open order for liquidation scenario (SHORT position with minimal collateral)
    // With 40% liquidation threshold, SHORT position needs ~60% price rise to be liquidatable
    const liquidatableCollateral = MIN_COLLATERAL.add(OPENING_FEE); // Use minimum required collateral
    await userClient.createOrder({
      orderId,
      size: ORDER_SIZE,
      collateral: liquidatableCollateral,
      isLong: false, // SHORT position - will be liquidatable when price rises significantly
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: ENTRY_PRICE, // Set limit price to match expected execution price
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      orderType: { limit: {} },
      leverageBps: new BN(10000), // 1x leverage
    });

    // Open the position for liquidation scenario
    await matcherClient.openPosition({
      positionId: positionId,
      entryPrice: ENTRY_PRICE,
      order: orderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Create an open order for non-liquidation scenario (LONG position with good collateral)
    await userClient.createOrder({
      orderId: orderIdSafe,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT.muln(2), // 2x collateral for safety
      isLong: true, // LONG position - will be profitable with price increases
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: ENTRY_PRICE, // Set limit price to match expected execution price
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      orderType: { limit: {} },
      leverageBps: new BN(10000), // 1x leverage
    });

    // Open the position for non-liquidation scenario
    await matcherClient.openPosition({
      positionId: positionIdSafe,
      entryPrice: ENTRY_PRICE,
      order: orderPDASafe,
      baskt: basktId,
      orderOwner: user.publicKey,
    });
  });

  afterEach(async () => {
    // Always attempt to restore protocol switches and oracle price.
    // Run the two maintenance steps independently so a failure in one does not
    // prevent the other, ensuring the basket price is consistently reset.

    // 1️⃣  Feature flags back to fully-enabled ― ignore errors.
    try {
      const resetSig = await client.updateFeatureFlags({
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
      await waitForTx(client.connection, resetSig);
    } catch (err) {
      console.warn('Feature-flag reset failed (continuing):', err?.toString?.());
    }

    // 2️⃣  Reset oracle price back to the baseline NAV.
    try {
      await client.updateOraclePrice(basktId, ENTRY_PRICE);
    } catch (err) {
      console.warn('Oracle-price reset failed (continuing):', err?.toString?.());
    }

    // Ensure at least one new slot so subsequent tests see the fresh state.
    await waitForNextSlot(client.connection);
  });

  it('Successfully liquidates a position that meets liquidation criteria', async () => {
    // Get token balances before liquidation
    const treasuryTokenBefore = await getAccount(client.connection, treasuryTokenAccount);
    // Get pool vault balance before liquidation
    const vaultBefore = await getAccount(client.connection, tokenVault);

    // Update oracle price in ≤20% increments to reach liquidation threshold
    await client.updateOraclePrice(basktId, new BN(1.2 * 1e6)); // +20% (1 -> 1.2)
    await client.updateOraclePrice(basktId, new BN(1.44 * 1e6)); // +20% (1.2 -> 1.44)
    await client.updateOraclePrice(basktId, new BN(1.73 * 1e6)); // +20% (1.44 -> 1.73)

    // Liquidate the SHORT position (73% price rise makes it liquidatable)
    await liquidatorClient.liquidatePosition({
      position: positionPDA,
      exitPrice: LIQUIDATION_PRICE, // $1.73
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

    // Get token balances after liquidation
    const treasuryTokenAfter = await getAccount(client.connection, treasuryTokenAccount);

    // Verify treasury received liquidation fee
    const treasuryBalanceDiff = new BN(treasuryTokenAfter.amount.toString()).sub(
      new BN(treasuryTokenBefore.amount.toString()),
    );
    expect(treasuryBalanceDiff.gt(new BN(0))).to.be.true; // Should have received liquidation fee

    // Verify liquidity pool vault decreased by pool payout
    const vaultAfter = await getAccount(client.connection, tokenVault);
    expect(new BN(vaultBefore.amount.toString()).lt(new BN(vaultAfter.amount.toString()))).to.be
      .true;
  });

  it('Fails to liquidate a position that does not meet liquidation criteria', async () => {
    // Update oracle price by only 20% (not enough to liquidate LONG position)
    await client.updateOraclePrice(basktId, NON_LIQUIDATION_PRICE); // $1.20 (+20%)

    // Try to liquidate a LONG position that doesn't meet liquidation criteria (profitable with price increase)
    try {
      await liquidatorClient.liquidatePosition({
        position: positionPDASafe,
        exitPrice: NON_LIQUIDATION_PRICE, // $1.20 - profitable for LONG, not liquidatable
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail('Transaction should have failed due to position not being liquidatable');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PositionNotLiquidatable');
    }
  });

  it('Fails to liquidate without liquidator role', async () => {
    // Create a new position for this test
    const newOrderId = new BN(Date.now() + 300);
    const newPositionId = new BN(Date.now() + 301);

    // Find the PDAs
    const [newOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), newOrderId.toArrayLike(Buffer, 'le', 8)],
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

    // Create an open order with minimal collateral (SHORT position)
    const roleTestCollateral = MIN_COLLATERAL.add(OPENING_FEE);
    await userClient.createOrder({
      orderId: newOrderId,
      size: ORDER_SIZE,
      collateral: roleTestCollateral,
      isLong: false, // SHORT position for liquidation test
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: ENTRY_PRICE, // Set limit price to match expected execution price
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      orderType: { limit: {} },
      leverageBps: new BN(10000), // 1x leverage
    });

    // Open the position
    await matcherClient.openPosition({
      positionId: newPositionId,
      entryPrice: ENTRY_PRICE,
      order: newOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Update oracle price to make SHORT position liquidatable
    await client.updateOraclePrice(basktId, new BN(1.2 * 1e6)); // +20%
    await client.updateOraclePrice(basktId, new BN(1.44 * 1e6)); // +20%
    await client.updateOraclePrice(basktId, new BN(1.73 * 1e6)); // +20%

    // Try to liquidate the position with a non-liquidator (should fail)
    try {
      await nonLiquidatorClient.liquidatePosition({
        position: newPositionPDA,
        exitPrice: LIQUIDATION_PRICE, // $1.73
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail('Transaction should have failed due to missing liquidator role');
    } catch (error: any) {
      // console.debug('Non-liquidator liquidate error:', error.toString());
      expect(error.error?.errorName || error.toString()).to.include('Unauthorized');
    }
  });

  it('Successfully liquidates position with price within oracle deviation bounds (20%)', async () => {
    // Oracle price is NAV = 100 with 6 decimals = 100_000_000
    // 20% deviation for liquidation = ±20_000_000
    // Valid range: 80_000_000 to 120_000_000

    // With 40% liquidation threshold, SHORT position needs ~54% price rise to be liquidatable
    // Use 160 USDC (60% rise) to ensure liquidation while staying within 20% oracle bounds
    const validLiquidationPriceHigh = new BN(1.6 * 1e6); // 1.6 - sufficient for liquidation
    const validLiquidationPriceLow = new BN(0.8 * 1e6); // 0.8 - within 20% bound

    // Test with high valid liquidation price - SHORT position will be liquidatable when price rises
    const highOrderId = new BN(Date.now() + 800);
    const highPositionId = new BN(Date.now() + 801);

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
    // Create and open SHORT position with minimal collateral to make it liquidatable when price rises
    const oracleTestCollateral = MIN_COLLATERAL.add(OPENING_FEE); // Use minimum required collateral
    await userClient.createOrder({
      orderId: highOrderId,
      size: ORDER_SIZE,
      collateral: oracleTestCollateral, // Minimal collateral for liquidation
      isLong: false, // SHORT position - will be liquidatable when price rises
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: ENTRY_PRICE, // Set limit price to match expected execution price
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      orderType: { limit: {} },
      leverageBps: new BN(10000), // 1x leverage
    });

    await matcherClient.openPosition({
      positionId: highPositionId,
      entryPrice: ENTRY_PRICE,
      order: highOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Update oracle price in ≤20% increments to reach liquidation threshold

    await client.updateOraclePrice(basktId, new BN(120_000_000)); // +20% (100 -> 120)
    await client.updateOraclePrice(basktId, new BN(144_000_000)); // +20% (120 -> 144)
    await client.updateOraclePrice(basktId, validLiquidationPriceHigh); // +11% (144 -> 160)

    // --- DEBUG: compute equity & minCollateral on-chain before attempting liquidation ---
    {
      const positionAcc: any = await client.program.account.position.fetch(highPositionPDA);
      const collateral = positionAcc.collateral.toString();
      const size = positionAcc.size.toString();
      const entryPrice = positionAcc.entryPrice.toString();
    }

    // Should succeed with valid high liquidation price for SHORT position
    await liquidatorClient.liquidatePosition({
      position: highPositionPDA,
      exitPrice: validLiquidationPriceHigh,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Verify position is liquidated
    try {
      await client.program.account.position.fetch(highPositionPDA);
      expect.fail('Position account should be closed');
    } catch (err: any) {
      expect(err.message).to.include('Account does not exist');
    }

    // --- RESET ORACLE PRICE back to baseline NAV ($1) before proceeding ---
    await client.updateOraclePrice(basktId, ENTRY_PRICE);
    await waitForNextSlot(client.connection);

    // Test with a second SHORT position to confirm liquidation logic
    const secondShortOrderId = new BN(Date.now() + 810);
    const secondShortPositionId = new BN(Date.now() + 811);

    const [secondShortOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), secondShortOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [secondShortPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        secondShortPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    // Create and open another SHORT position with minimal collateral
    const secondShortCollateral = MIN_COLLATERAL.add(OPENING_FEE);
    await userClient.createOrder({
      orderId: secondShortOrderId,
      size: ORDER_SIZE,
      collateral: secondShortCollateral, // Minimal collateral for liquidation
      isLong: false, // SHORT position
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: ENTRY_PRICE, // Set limit price to match expected execution price
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      orderType: { limit: {} },
      leverageBps: new BN(10000), // 1x leverage
    });

    await matcherClient.openPosition({
      positionId: secondShortPositionId,
      entryPrice: ENTRY_PRICE,
      order: secondShortOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Update oracle price to make the new SHORT position liquidatable
    const secondLiquidationPrice = new BN(1.7 * 1e6); // Use a different high price
    await client.updateOraclePrice(basktId, new BN(1.2 * 1e6)); // +20% (1 -> 1.2)
    await client.updateOraclePrice(basktId, new BN(1.44 * 1e6)); // +20% (1.2 -> 1.44)
    await client.updateOraclePrice(basktId, secondLiquidationPrice); // +18% (144 -> 170)

    // Should succeed with valid high liquidation price for SHORT position
    await liquidatorClient.liquidatePosition({
      position: secondShortPositionPDA,
      exitPrice: secondLiquidationPrice, // 170 USDC - sufficient for SHORT liquidation
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Verify position is liquidated
    try {
      await client.program.account.position.fetch(secondShortPositionPDA);
      expect.fail('Position account should be closed');
    } catch (err: any) {
      expect(err.message).to.include('Account does not exist');
    }
  });

  it('Fails to liquidate position with price outside oracle deviation bounds (>20%)', async () => {
    // Oracle price is NAV = 100 with 6 decimals = 100_000_000
    // 20% deviation for liquidation = ±20_000_000
    // Invalid range: <80_000_000 or >120_000_000

    const invalidLiquidationPriceHigh = new BN(125_000_000); // 125 - outside 20% bound
    const invalidLiquidationPriceLow = new BN(75_000_000); // 75 - outside 20% bound

    // Test with invalid high liquidation price
    const highOrderId = new BN(Date.now() + 900);
    const highPositionId = new BN(Date.now() + 901);

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

    // Create and open position with low collateral to make it liquidatable
    await userClient.createOrder({
      orderId: highOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT, // Low collateral for liquidation
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: ENTRY_PRICE, // Set limit price to match expected execution price
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      orderType: { limit: {} },
      leverageBps: new BN(10000), // 1x leverage
    });

    await matcherClient.openPosition({
      positionId: highPositionId,
      entryPrice: ENTRY_PRICE,
      order: highOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Should fail with invalid high liquidation price
    try {
      await liquidatorClient.liquidatePosition({
        position: highPositionPDA,
        exitPrice: invalidLiquidationPriceHigh,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail(
        'Transaction should have failed due to price outside liquidation deviation bounds',
      );
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }

    // Test with invalid low liquidation price
    const lowOrderId = new BN(Date.now() + 910);
    const lowPositionId = new BN(Date.now() + 911);

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

    // Create and open position with low collateral to make it liquidatable
    await userClient.createOrder({
      orderId: lowOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT, // Low collateral for liquidation
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: ENTRY_PRICE, // Set limit price to match expected execution price
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      orderType: { limit: {} },
      leverageBps: new BN(10000), // 1x leverage
    });

    await matcherClient.openPosition({
      positionId: lowPositionId,
      entryPrice: ENTRY_PRICE,
      order: lowOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Should fail with invalid low liquidation price
    try {
      await liquidatorClient.liquidatePosition({
        position: lowPositionPDA,
        exitPrice: invalidLiquidationPriceLow,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail(
        'Transaction should have failed due to price outside liquidation deviation bounds',
      );
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }
  });

  it('Fails to liquidate position with zero exit price', async () => {
    const zeroOrderId = new BN(Date.now() + 1000);
    const zeroPositionId = new BN(Date.now() + 1001);

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

    // Create and open position with low collateral to make it liquidatable
    await userClient.createOrder({
      orderId: zeroOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT, // Low collateral for liquidation
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: ENTRY_PRICE, // Set limit price to match expected execution price
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      orderType: { limit: {} },
      leverageBps: new BN(10000), // 1x leverage
    });

    await matcherClient.openPosition({
      positionId: zeroPositionId,
      entryPrice: ENTRY_PRICE,
      order: zeroOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Should fail with zero exit price
    try {
      await liquidatorClient.liquidatePosition({
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

  it('Verifies liquidation bounds are stricter than regular operation bounds', async () => {
    // This test verifies that liquidation bounds (20%) are stricter than regular bounds (25%)
    // A price that's valid for regular operations should fail for liquidation if it's between 20-25%

    // Oracle price is NAV = 100 with 6 decimals = 100_000_000
    // Price at 22% deviation: should be valid for open/close but invalid for liquidation
    const strictBoundPrice = new BN(1.22 * 1e6); // 1.22 - 22% deviation

    const testOrderId = new BN(Date.now() + 1100);
    const testPositionId = new BN(Date.now() + 1101);

    const [testOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), testOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [testPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        testPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    // Calculate required collateral for the strict bound price (122 USDC)
    const strictBaseNotional = ORDER_SIZE.mul(strictBoundPrice).div(new BN(1_000_000)); // 1,220 USDC
    const strictSlippageAdjustment = strictBaseNotional.muln(500).divn(10000); // 5% = 61 USDC
    const strictWorstCaseNotional = strictBaseNotional.add(strictSlippageAdjustment); // 1,281 USDC
    const strictMinCollateral = strictWorstCaseNotional.muln(11000).divn(10000); // 110% = 1,409.1 USDC
    const strictOpeningFee = strictWorstCaseNotional.muln(10).divn(10000); // 0.1% = 1.281 USDC
    const strictCollateralAmount = strictMinCollateral.add(strictOpeningFee).muln(105).divn(100); // Total + 5% buffer

    // Create and open position with this price (should succeed with 25% bound)
    await userClient.createOrder({
      orderId: testOrderId,
      size: ORDER_SIZE,
      collateral: strictCollateralAmount,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: strictBoundPrice, // Set limit price to match expected execution price
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      orderType: { limit: {} },
      leverageBps: new BN(10000), // 1x leverage
    });

    await matcherClient.openPosition({
      positionId: testPositionId,
      entryPrice: strictBoundPrice, // 22% deviation - valid for open
      order: testOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Verify position was created
    const positionAccount = await client.program.account.position.fetch(testPositionPDA);
    expect(positionAccount.entryPrice.toString()).to.equal(strictBoundPrice.toString());

    // Now try to liquidate with the same price (should fail with 20% bound)
    try {
      await liquidatorClient.liquidatePosition({
        position: testPositionPDA,
        exitPrice: strictBoundPrice, // 22% deviation - invalid for liquidation
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail('Liquidation should have failed due to stricter bounds');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }
  });
});
