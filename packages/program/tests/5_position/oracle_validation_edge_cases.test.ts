import { expect } from 'chai';
import { describe, it, before, afterEach, after } from 'mocha';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { TestClient, requestAirdrop } from '../utils/test-client';
// Using TestClient static method instead of importing from test-setup
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';

describe('Oracle Price Validation Edge Cases', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters
  const ORDER_SIZE = new BN(10_000_000); // 10 units
  const ENTRY_PRICE = new BN(1_000_000); // NAV starts at 1 with 6 decimals
  const TICKER = 'BTC';

  // Helper function to calculate required collateral for a given limit price
  const calculateRequiredCollateral = (limitPrice: BN, slippageBps: number = 100): BN => {
    // Base notional = size * limit_price / PRICE_PRECISION
    const baseNotional = ORDER_SIZE.mul(limitPrice).div(new BN(1_000_000));
    // Slippage adjustment
    const slippageAdjustment = baseNotional.muln(slippageBps).divn(10_000);
    // Worst-case notional
    const worstCaseNotional = baseNotional.add(slippageAdjustment);
    // Min collateral (110%)
    const minCollateral = worstCaseNotional.muln(11_000).divn(10_000);
    // Opening fee (0.1%)
    const openingFee = worstCaseNotional.muln(10).divn(10_000);
    // Total required with some buffer
    return minCollateral.add(openingFee).muln(105).divn(100); // 5% buffer
  };

  // Define minimal collateral for liquidation testing - use proper amount for 10 units
  const MINIMAL_COLLATERAL = calculateRequiredCollateral(ENTRY_PRICE); // Proper collateral for liquidation testing

  // Oracle price NAV = 100 with 6 decimals = 100_000_000
  // 25% deviation = ±25_000_000
  // Valid range for regular operations: 75_000_000 to 125_000_000
  // 20% deviation = ±20_000_000
  // Valid range for liquidation: 80_000_000 to 120_000_000

  // Regular operation boundaries (25%)
  const REGULAR_LOWER_BOUNDARY = new BN(75_000_0); // Exactly 25% below
  const REGULAR_UPPER_BOUNDARY = new BN(125_000_0); // Exactly 25% above
  const REGULAR_INVALID_LOW = new BN(74_999_9); // Just below 25%
  const REGULAR_INVALID_HIGH = new BN(125_000_1); // Just above 25%

  // Liquidation boundaries (20%)
  const LIQUIDATION_LOWER_BOUNDARY = new BN(80_000_0); // Exactly 20% below
  const LIQUIDATION_UPPER_BOUNDARY = new BN(120_000_0); // Exactly 20% above
  const LIQUIDATION_INVALID_LOW = new BN(79_999_9); // Just below 20%
  const LIQUIDATION_INVALID_HIGH = new BN(120_000_1); // Just above 20%

  // Test accounts
  let user: Keypair;
  let treasury: Keypair;
  let matcher: Keypair;
  let liquidator: Keypair;
  let userClient: TestClient;
  let matcherClient: TestClient;
  let liquidatorClient: TestClient;

  // Test state
  let basktId: PublicKey;
  let collateralMint: PublicKey;
  let userTokenAccount: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let assetId: PublicKey;
  let fundingIndexPDA: PublicKey;

  // Liquidity pool accounts
  let liquidityPool: PublicKey;
  let lpMint: PublicKey;
  let tokenVault: PublicKey;

  // Protocol configuration backup
  let prevThreshold: number;

  // USDC mint constant from the program
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  before(async () => {
    // Initialize protocol and roles using centralized setup
    const globalAccounts = await TestClient.initializeProtocolAndRoles(client);
    treasury = client.treasury;
    matcher = globalAccounts.matcher;
    liquidator = globalAccounts.liquidator;

    // Save current liquidation threshold and set to 40% for testing
    prevThreshold = (await client.getProtocolAccount()).config.liquidationThresholdBps.toNumber();
    await client.setLiquidationThresholdBps(4000); // 40%

    // Create test user
    user = Keypair.generate();
    await requestAirdrop(user.publicKey, client.connection);

    // Create user clients
    userClient = await TestClient.forUser(user);
    matcherClient = await TestClient.forUser(matcher);
    liquidatorClient = await TestClient.forUser(liquidator);

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

    // Create a baskt with the asset
    const basktName = `TestBaskt_Oracle_${Date.now()}`;
    const formattedAssetConfig = {
      weight: new BN(10000),
      direction: true,
      assetId: assetId,
      baselinePrice: new BN(0),
    };

    const { basktId: createdBasktId } = await client.createBaskt(
      basktName,
      [formattedAssetConfig],
      true,
    );
    basktId = createdBasktId;

    // Activate the baskt with initial prices
    // Since weight is 100% (10000 bps), the asset price should equal the target NAV
    await client.activateBaskt(
      basktId,
      [new BN(100_000_000)], // NAV = 100 with 6 decimals
      60, // maxPriceAgeSec
    );

    // Find and initialize the funding index PDA
    [fundingIndexPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('funding_index'), basktId.toBuffer()],
      client.program.programId,
    );

    await client.program.methods
      .initializeFundingIndex()
      .accounts({
        authority: client.getPublicKey(),
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
        protocol: client.protocolPDA,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();

    // Use the USDC mock token for collateral
    collateralMint = USDC_MINT;

    // Create token accounts
    userTokenAccount = await client.getOrCreateUSDCAccount(user.publicKey);
    treasuryTokenAccount = await client.getOrCreateUSDCAccount(treasury.publicKey);

    // Mint USDC tokens to user - calculate max needed collateral and mint plenty
    const maxCollateral = calculateRequiredCollateral(REGULAR_UPPER_BOUNDARY);
    await client.mintUSDC(
      userTokenAccount,
      maxCollateral.muln(50).toNumber(), // 50x for multiple tests
    );

    // Set up liquidity pool
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

    // Mint USDC to liquidity provider - use a very large amount for liquidations
    // Calculate the maximum possible collateral needed and provide 10x that amount
    const liquidityAmount = maxCollateral.muln(10); // 10x the max collateral for safety
    await client.mintUSDC(liquidityProviderTokenAccount, liquidityAmount.toNumber());

    // Add liquidity using the liquidity provider
    await liquidityProviderClient.addLiquidityToPool({
      liquidityPool,
      amount: liquidityAmount,
      minSharesOut: new BN(1),
      providerTokenAccount: liquidityProviderTokenAccount,
      tokenVault,
      providerLpAccount: liquidityProviderLpAccount,
      lpMint,
      treasuryTokenAccount,
      treasury: treasury.publicKey,
    });
  });

  afterEach(async () => {
    // Reset feature flags to enabled state after each test
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
      await waitForNextSlot(client.connection);

      // Reset oracle price to original value for subsequent tests
      await client.updateOraclePrice(basktId, ENTRY_PRICE); // Reset to 100 USDC
    } catch (error) {
      // Silently handle cleanup errors to avoid masking test failures
      console.warn('Cleanup error in oracle_validation_edge_cases.test.ts:', error);
    }
  });

  it('Opens position at exact 25% deviation boundaries', async () => {
    // Test exact boundary values for regular operations (25% deviation)

    // Test upper boundary
    const upperOrderId = new BN(Date.now());
    const upperPositionId = new BN(Date.now() + 1);

    const [upperOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), upperOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [upperPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        upperPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    const upperCollateral = calculateRequiredCollateral(REGULAR_UPPER_BOUNDARY);
    await userClient.createOrder({
      orderId: upperOrderId,
      size: ORDER_SIZE,
      collateral: upperCollateral,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: REGULAR_UPPER_BOUNDARY, // Set limit price to match expected execution price
      maxSlippageBps: new BN(100), // 1% slippage
      orderType: { limit: {} },
    });

    // Should succeed at exactly 25% above oracle price
    await matcherClient.openPosition({
      positionId: upperPositionId,
      entryPrice: REGULAR_UPPER_BOUNDARY,
      order: upperOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    const upperPosition = await client.program.account.position.fetch(upperPositionPDA);
    expect(upperPosition.entryPrice.toString()).to.equal(REGULAR_UPPER_BOUNDARY.toString());

    // Test lower boundary
    const lowerOrderId = new BN(Date.now() + 10);
    const lowerPositionId = new BN(Date.now() + 11);

    const [lowerOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), lowerOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [lowerPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        lowerPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    const lowerCollateral = calculateRequiredCollateral(REGULAR_LOWER_BOUNDARY);
    await userClient.createOrder({
      orderId: lowerOrderId,
      size: ORDER_SIZE,
      collateral: lowerCollateral,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: REGULAR_LOWER_BOUNDARY, // Set limit price to match expected execution price
      maxSlippageBps: new BN(100), // 1% slippage
      orderType: { limit: {} },
    });

    // Should succeed at exactly 25% below oracle price
    await matcherClient.openPosition({
      positionId: lowerPositionId,
      entryPrice: REGULAR_LOWER_BOUNDARY,
      order: lowerOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    const lowerPosition = await client.program.account.position.fetch(lowerPositionPDA);
    expect(lowerPosition.entryPrice.toString()).to.equal(REGULAR_LOWER_BOUNDARY.toString());
  });

  it('Fails to open position just outside 25% deviation boundaries', async () => {
    // Test just outside boundary values for regular operations

    // Test just above upper boundary
    const highOrderId = new BN(Date.now() + 20);
    const highPositionId = new BN(Date.now() + 21);

    const [highOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), highOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const highCollateral = calculateRequiredCollateral(REGULAR_INVALID_HIGH);
    await userClient.createOrder({
      orderId: highOrderId,
      size: ORDER_SIZE,
      collateral: highCollateral,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: REGULAR_INVALID_HIGH, // Set limit price to match expected execution price
      maxSlippageBps: new BN(100), // 1% slippage
      orderType: { limit: {} },
    });

    // Should fail just above 25% boundary
    try {
      await matcherClient.openPosition({
        positionId: highPositionId,
        entryPrice: REGULAR_INVALID_HIGH,
        order: highOrderPDA,
        baskt: basktId,
        orderOwner: user.publicKey,
      });

      expect.fail('Should have failed just above 25% boundary');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }

    // Test just below lower boundary
    const lowOrderId = new BN(Date.now() + 30);
    const lowPositionId = new BN(Date.now() + 31);

    const [lowOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), lowOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const lowCollateral = calculateRequiredCollateral(REGULAR_INVALID_LOW);
    await userClient.createOrder({
      orderId: lowOrderId,
      size: ORDER_SIZE,
      collateral: lowCollateral,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: REGULAR_INVALID_LOW, // Set limit price to match expected execution price
      maxSlippageBps: new BN(100), // 1% slippage
      orderType: { limit: {} },
    });

    // Should fail just below 25% boundary
    try {
      await matcherClient.openPosition({
        positionId: lowPositionId,
        entryPrice: REGULAR_INVALID_LOW,
        order: lowOrderPDA,
        baskt: basktId,
        orderOwner: user.publicKey,
      });

      expect.fail('Should have failed just below 25% boundary');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }
  });

  it('Liquidates position within 20% oracle deviation bounds', async () => {
    // With 40% liquidation threshold, demonstrate that liquidation can occur within oracle bounds
    // Use very small position size to make liquidation achievable with smaller price movements
    const LIQUIDATION_ORDER_SIZE = new BN(100_000); // 0.1 unit for easy liquidation
    // For 0.1 unit: worst-case notional = 10.1 USDC, min collateral = 11.11 USDC, opening fee = 0.0101 USDC
    // Use exactly minimum required: 11.1201 USDC
    const LIQUIDATION_COLLATERAL = new BN(11_130_000); // 11.13 USDC - exactly minimum required

    // Test upper boundary - for a short position to be liquidatable when price goes up significantly
    const upperOrderId = new BN(Date.now() + 40);
    const upperPositionId = new BN(Date.now() + 41);

    const [upperOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), upperOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [upperPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        upperPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    // Create and open SHORT position (will be liquidatable when price rises significantly)
    // Use smaller size and minimal collateral for liquidation testing
    await userClient.createOrder({
      orderId: upperOrderId,
      size: LIQUIDATION_ORDER_SIZE,
      collateral: LIQUIDATION_COLLATERAL,
      isLong: false, // SHORT position
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: ENTRY_PRICE, // Set limit price to match expected execution price
      maxSlippageBps: new BN(100), // 1% slippage
      orderType: { limit: {} },
    });

    await matcherClient.openPosition({
      positionId: upperPositionId,
      entryPrice: ENTRY_PRICE,
      order: upperOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Update oracle price to reach liquidation threshold
    // With 0.1 unit and 11.13 USDC collateral, SHORT position becomes liquidatable at ~151 USDC
    // Update oracle in steps to reach 160 USDC
    await client.updateOraclePrice(basktId, new BN(120_000_000)); // +20% (100 -> 120)
    await client.updateOraclePrice(basktId, new BN(144_000_000)); // +20% (120 -> 144)
    await client.updateOraclePrice(basktId, new BN(160_000_000)); // +11% (144 -> 160)

    // Should succeed with price sufficient for liquidation and within oracle bounds
    await liquidatorClient.liquidatePosition({
      position: upperPositionPDA,
      exitPrice: new BN(160_000_000), // 160 USDC - sufficient for liquidation, within 20% of 160
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Verify the SHORT position was liquidated successfully
    try {
      await client.program.account.position.fetch(upperPositionPDA);
      expect.fail('Position account should be closed after liquidation');
    } catch (err: any) {
      expect(err.message).to.include('Account does not exist');
    }
  });

  it('Fails to liquidate position just outside 20% deviation boundaries', async () => {
    // Test just outside boundary values for liquidation operations
    const entryCollateral = calculateRequiredCollateral(ENTRY_PRICE);

    // Test just above upper boundary
    const highOrderId = new BN(Date.now() + 60);
    const highPositionId = new BN(Date.now() + 61);

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

    await userClient.createOrder({
      orderId: highOrderId,
      size: ORDER_SIZE,
      collateral: entryCollateral, // Reuse the same collateral calculation
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: ENTRY_PRICE, // Set limit price to match expected execution price
      maxSlippageBps: new BN(100), // 1% slippage
      orderType: { limit: {} },
    });

    await matcherClient.openPosition({
      positionId: highPositionId,
      entryPrice: ENTRY_PRICE,
      order: highOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Should fail just above 20% boundary for liquidation
    try {
      await liquidatorClient.liquidatePosition({
        position: highPositionPDA,
        exitPrice: LIQUIDATION_INVALID_HIGH,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail('Should have failed just above 20% liquidation boundary');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }

    // Test just below lower boundary
    const lowOrderId = new BN(Date.now() + 70);
    const lowPositionId = new BN(Date.now() + 71);

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

    await userClient.createOrder({
      orderId: lowOrderId,
      size: ORDER_SIZE,
      collateral: entryCollateral, // Reuse the same collateral calculation
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: ENTRY_PRICE, // Set limit price to match expected execution price
      maxSlippageBps: new BN(100), // 1% slippage
      orderType: { limit: {} },
    });

    await matcherClient.openPosition({
      positionId: lowPositionId,
      entryPrice: ENTRY_PRICE,
      order: lowOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Should fail just below 20% boundary for liquidation
    try {
      await liquidatorClient.liquidatePosition({
        position: lowPositionPDA,
        exitPrice: LIQUIDATION_INVALID_LOW,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail('Should have failed just below 20% liquidation boundary');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }
  });

  it('Validates that 22% deviation works for open/close but fails for liquidation', async () => {
    // Price at 22% deviation: valid for regular ops (25% bound) but invalid for liquidation (20% bound)
    const edgeCasePrice = new BN(1.22 * 1e6); // 22% above oracle price (1)
    const entryCollateral = calculateRequiredCollateral(ENTRY_PRICE);

    // Test opening position (should succeed)
    const openOrderId = new BN(Date.now() + 80);
    const openPositionId = new BN(Date.now() + 81);

    const [openOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), openOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [openPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        openPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    const edgeCaseCollateral = calculateRequiredCollateral(edgeCasePrice);
    await userClient.createOrder({
      orderId: openOrderId,
      size: ORDER_SIZE,
      collateral: edgeCaseCollateral,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: edgeCasePrice, // Set limit price to match expected execution price
      maxSlippageBps: new BN(100), // 1% slippage
      orderType: { limit: {} },
    });

    // Should succeed with 22% deviation for opening
    await matcherClient.openPosition({
      positionId: openPositionId,
      entryPrice: edgeCasePrice,
      order: openOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    const position = await client.program.account.position.fetch(openPositionPDA);
    expect(position.entryPrice.toString()).to.equal(edgeCasePrice.toString());

    // Test closing position with same price (should succeed)
    const closeOrderId = new BN(Date.now() + 90);

    const [closeOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), closeOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    await userClient.createOrder({
      orderId: closeOrderId,
      size: ORDER_SIZE,
      collateral: new BN(0),
      isLong: true,
      action: { close: {} },
      targetPosition: openPositionPDA,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: edgeCasePrice, // Set limit price to match expected execution price
      maxSlippageBps: new BN(100), // 1% slippage
      orderType: { limit: {} },
    });

    // Should succeed with 22% deviation for closing
    await matcherClient.closePosition({
      orderPDA: closeOrderPDA,
      position: openPositionPDA,
      exitPrice: edgeCasePrice,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Now test liquidation with same price (should fail)
    const liquidateOrderId = new BN(Date.now() + 100);
    const liquidatePositionId = new BN(Date.now() + 101);

    const [liquidateOrderPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('order'),
        user.publicKey.toBuffer(),
        liquidateOrderId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    const [liquidatePositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        liquidatePositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    await userClient.createOrder({
      orderId: liquidateOrderId,
      size: ORDER_SIZE,
      collateral: entryCollateral, // Reuse the same collateral calculation
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: ENTRY_PRICE, // Set limit price to match expected execution price
      maxSlippageBps: new BN(100), // 1% slippage
      orderType: { limit: {} },
    });

    await matcherClient.openPosition({
      positionId: liquidatePositionId,
      entryPrice: ENTRY_PRICE,
      order: liquidateOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Should fail with 22% deviation for liquidation
    try {
      await liquidatorClient.liquidatePosition({
        position: liquidatePositionPDA,
        exitPrice: edgeCasePrice,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail('Liquidation should have failed with 22% deviation');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }
  });
});
