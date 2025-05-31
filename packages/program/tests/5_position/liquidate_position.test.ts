import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { AccessControlRole } from '@baskt/types';
import { initializeProtocolAndRoles, getGlobalTestAccounts } from '../utils/test-setup';

describe('Liquidate Position', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters
  const ORDER_SIZE = new BN(10_000_000); // 10 units
  const COLLATERAL_AMOUNT = new BN(11_000_000); // 11 USDC (110% of 10-unit order)
  const ENTRY_PRICE = new BN(100_000_000); // NAV starts at 100 with 6 decimals
  const LIQUIDATION_PRICE = new BN(98_000_000); // 98 with 6 decimals (2% price drop for long)
  const NON_LIQUIDATION_PRICE = new BN(102_000_000); // 102 with 6 decimals (2% price increase for long)
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
  let fundingIndexPDA: PublicKey;

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

  // USDC mint constant from the program
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  // Liquidity pool accounts for liquidation tests
  let liquidityPool: PublicKey;
  let lpMint: PublicKey;
  let tokenVault: PublicKey;
  let poolAuthority: PublicKey;
  let providerLpAccount: PublicKey;

  before(async () => {
    // Initialize protocol and roles using centralized setup
    const globalAccounts = await initializeProtocolAndRoles(client);
    treasury = globalAccounts.treasury;
    matcher = globalAccounts.matcher;
    liquidator = globalAccounts.liquidator;

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
      [new BN(100_000_000)], // NAV = 100 with 6 decimals
      60, // maxPriceAgeSec
    );

    // Find the funding index PDA for the baskt
    [fundingIndexPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('funding_index'), basktId.toBuffer()],
      client.program.programId,
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
      client.program.programId,
    );

    // Mint USDC tokens to user
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(25).toNumber(), // 25x for multiple tests (9 orders + liquidity pool)
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

    // Create an open order for liquidation scenario (low collateral)
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

    // Open the position for liquidation scenario
    await matcherClient.openPosition({
      positionId: positionId,
      entryPrice: ENTRY_PRICE,
      order: orderPDA,
      position: positionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Create an open order for non-liquidation scenario (higher collateral)
    await userClient.createOrder({
      orderId: orderIdSafe,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT.muln(5), // 5x more collateral
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Open the position for non-liquidation scenario
    await matcherClient.openPosition({
      positionId: positionIdSafe,
      entryPrice: ENTRY_PRICE,
      order: orderPDASafe,
      position: positionPDASafe,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });
  });

  it('Successfully liquidates a position that meets liquidation criteria', async () => {
    // Derive the position escrow token account PDA
    const [positionEscrow] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), positionPDA.toBuffer()],
      client.program.programId,
    );

    // Get token balances before liquidation
    const treasuryTokenBefore = await getAccount(client.connection, treasuryTokenAccount);
    // Get pool vault balance before liquidation
    const vaultBefore = await getAccount(client.connection, tokenVault);

    // Liquidate the position
    await liquidatorClient.liquidatePosition({
      position: positionPDA,
      exitPrice: LIQUIDATION_PRICE,
      fundingIndex: fundingIndexPDA,
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
    // Try to liquidate a position that doesn't meet liquidation criteria (higher collateral)
    try {
      await liquidatorClient.liquidatePosition({
        position: positionPDASafe,
        exitPrice: NON_LIQUIDATION_PRICE, // Price that would result in profit for long
        fundingIndex: fundingIndexPDA,
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

    // Create an open order with low collateral
    await userClient.createOrder({
      orderId: newOrderId,
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
      order: newOrderPDA,
      position: newPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Try to liquidate the position with a non-liquidator (should fail)
    try {
      await nonLiquidatorClient.liquidatePosition({
        position: newPositionPDA,
        exitPrice: LIQUIDATION_PRICE,
        fundingIndex: fundingIndexPDA,
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

    const validLiquidationPriceHigh = new BN(119_000_000); // 119 - within 20% bound
    const validLiquidationPriceLow = new BN(81_000_000); // 81 - within 20% bound

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

    // Create and open SHORT position with low collateral to make it liquidatable when price rises
    await userClient.createOrder({
      orderId: highOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT, // Low collateral for liquidation
      isLong: false, // SHORT position - will be liquidatable when price rises
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
      position: highPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Should succeed with valid high liquidation price for SHORT position
    await liquidatorClient.liquidatePosition({
      position: highPositionPDA,
      exitPrice: validLiquidationPriceHigh,
      fundingIndex: fundingIndexPDA,
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

    // Test with low valid liquidation price
    const lowOrderId = new BN(Date.now() + 810);
    const lowPositionId = new BN(Date.now() + 811);

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
    });

    await matcherClient.openPosition({
      positionId: lowPositionId,
      entryPrice: ENTRY_PRICE,
      order: lowOrderPDA,
      position: lowPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Should succeed with valid low liquidation price
    await liquidatorClient.liquidatePosition({
      position: lowPositionPDA,
      exitPrice: validLiquidationPriceLow,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Verify position is liquidated
    try {
      await client.program.account.position.fetch(lowPositionPDA);
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
    });

    await matcherClient.openPosition({
      positionId: highPositionId,
      entryPrice: ENTRY_PRICE,
      order: highOrderPDA,
      position: highPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Should fail with invalid high liquidation price
    try {
      await liquidatorClient.liquidatePosition({
        position: highPositionPDA,
        exitPrice: invalidLiquidationPriceHigh,
        fundingIndex: fundingIndexPDA,
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
    });

    await matcherClient.openPosition({
      positionId: lowPositionId,
      entryPrice: ENTRY_PRICE,
      order: lowOrderPDA,
      position: lowPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Should fail with invalid low liquidation price
    try {
      await liquidatorClient.liquidatePosition({
        position: lowPositionPDA,
        exitPrice: invalidLiquidationPriceLow,
        fundingIndex: fundingIndexPDA,
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
    });

    await matcherClient.openPosition({
      positionId: zeroPositionId,
      entryPrice: ENTRY_PRICE,
      order: zeroOrderPDA,
      position: zeroPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Should fail with zero exit price
    try {
      await liquidatorClient.liquidatePosition({
        position: zeroPositionPDA,
        exitPrice: new BN(0),
        fundingIndex: fundingIndexPDA,
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
    const strictBoundPrice = new BN(122_000_000); // 122 - 22% deviation

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

    // Create and open position with this price (should succeed with 25% bound)
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

    await matcherClient.openPosition({
      positionId: testPositionId,
      entryPrice: strictBoundPrice, // 22% deviation - valid for open
      order: testOrderPDA,
      position: testPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Verify position was created
    const positionAccount = await client.program.account.position.fetch(testPositionPDA);
    expect(positionAccount.entryPrice.toString()).to.equal(strictBoundPrice.toString());

    // Now try to liquidate with the same price (should fail with 20% bound)
    try {
      await liquidatorClient.liquidatePosition({
        position: testPositionPDA,
        exitPrice: strictBoundPrice, // 22% deviation - invalid for liquidation
        fundingIndex: fundingIndexPDA,
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
