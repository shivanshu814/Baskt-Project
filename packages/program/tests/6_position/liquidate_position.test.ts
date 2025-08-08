import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient } from '../utils/test-client';
import { BASELINE_PRICE } from '../utils/test-constants';
import { calculateLiquidationPriceInternal, PRICE_PRECISION } from '@baskt/sdk';
import { BPS_DIVISOR } from '../utils/fee-utils';

describe('Liquidate Position', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  const NOTIONAL_ORDER_VALUE = new BN(20 * 1e6); // 20 USDC notional value
  const ENTRY_PRICE = BASELINE_PRICE; // NAV starts at 1 with 6 decimals
  const COLLATERAL = new BN(21 * 1e6); // 21 USDC collateral
  const LIQUIDATION_PRICE = new BN(200 * 1e6); // $200 for SHORT liquidation (200x price increase)

  // Test accounts from centralized setup
  let user: Keypair;
  let treasury: Keypair;
  let liquidator: Keypair;
  let userClient: TestClient;
  let matcherClient: TestClient;
  let liquidatorClient: TestClient;
  let nonMatcherClient: TestClient;

  // Test state
  let basktId: PublicKey;
  let collateralMint: PublicKey;
  let userTokenAccount: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let assetId: PublicKey;

  // Liquidity pool accounts
  let liquidityPool: PublicKey;
  let lpMint: PublicKey;
  let usdcVault: PublicKey;

  // Protocol configuration backup
  let prevThreshold: number;
  let liquidationFeeBps: BN;

  before(async () => {
    // Use centralized test setup
    const testSetup = await TestClient.setupPositionTest({
      client,
      ticker: 'BTC',
    });

    // Assign all the returned values from setup
    user = testSetup.user;
    userClient = testSetup.userClient;
    matcherClient = testSetup.matcherClient;
    nonMatcherClient = testSetup.nonMatcherClient;
    basktId = testSetup.basktId;
    collateralMint = testSetup.collateralMint;
    userTokenAccount = testSetup.userTokenAccount;
    assetId = testSetup.assetId;
    liquidityPool = testSetup.liquidityPool;
    lpMint = testSetup.lpMint;
    usdcVault = testSetup.usdcVault;

    // Get global accounts
    const globalAccounts = await TestClient.initializeProtocolAndRoles(client);
    treasury = client.treasury;
    liquidator = globalAccounts.liquidator;
    liquidatorClient = await TestClient.forUser(liquidator);

    // Create treasury token account
    treasuryTokenAccount = await client.getOrCreateUSDCAccountKey(treasury.publicKey);

    // Save current liquidation threshold and set to 40% for testing
    prevThreshold = (await client.getProtocolAccount()).config.liquidationThresholdBps.toNumber();
    await client.setLiquidationThresholdBps(4000); // 40%

    // Mint additional USDC to user for liquidation tests
    await client.mintUSDC(userTokenAccount, 1000 * 1e6); // 1000 USDC

    // Create a separate provider for substantial liquidity to avoid role conflicts
    const liquidityProviderClient = await TestClient.forUser(Keypair.generate());

    // Create token accounts for liquidity provider
    const liquidityProviderTokenAccount = await client.getOrCreateUSDCAccountKey(
      liquidityProviderClient.publicKey,
    );
    const liquidityProviderLpAccount = await client.createTokenAccount(
      lpMint,
      liquidityProviderClient.publicKey,
    );

    // Mint substantial USDC to liquidity provider
    await client.mintUSDC(liquidityProviderTokenAccount, 10_000 * 1e6); // 10,000 USDC

    // Add liquidity using the liquidity provider
    await liquidityProviderClient.addLiquidityToPool({
      liquidityPool,
      amount: new BN(10_000 * 1e6), // deposit 10,000 USDC
      minSharesOut: new BN(1),
      providerTokenAccount: liquidityProviderTokenAccount,
      usdcVault,
      providerLpAccount: liquidityProviderLpAccount,
      lpMint,
      treasuryTokenAccount,
      treasury: treasury.publicKey,
    });

    liquidationFeeBps = (await client.getProtocolAccount()).config.liquidationFeeBps;
  });

  afterEach(async () => {
    // Reset feature flags using centralized method
    await TestClient.resetFeatureFlags(client);
  });



  it('Successfully liquidates a short position that meets liquidation criteria: Around Liquidation Price', async () => {
    const orderId = client.newUID();
    const positionId = client.newUID();
    const positionPDA = await client.getPositionPDA(user.publicKey, positionId);

    const protocolConfig = await client.getProtocolAccount();
    const liquidationThreshold = protocolConfig.config.liquidationThresholdBps;
    const minCollateralRatio = protocolConfig.config.minCollateralRatioBps;


  

    
      // Create and open SHORT position with minimal collateral
    await matcherClient.createAndOpenMarketPosition({
      userClient, 
      orderId,
      positionId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL,
      isLong: false, // SHORT position - will lose money when price increases
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000), // 1x leverage
    });
   
    const snapshotBeforeLiquidation = await client.snapshotPositionBalances(
      positionPDA,
      user.publicKey,
      basktId
    );


    const liquidationPrice = calculateLiquidationPriceInternal(
      snapshotBeforeLiquidation.positionAccount!.entryPrice,
      snapshotBeforeLiquidation.positionAccount!.collateral,
      snapshotBeforeLiquidation.positionAccount!.size,
      new BN(liquidationThreshold),
      false,
      new BN(0),
    ).add(new BN(1e6));



    await liquidatorClient.liquidatePosition({
      position: positionPDA,
      exitPrice: liquidationPrice,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    await client.verifyClose({
        snapshotBefore: snapshotBeforeLiquidation,
        snapshotAfter: await client.snapshotPositionBalances(positionPDA, user.publicKey, basktId),
        basktId,
        collateralRatioBps: BPS_DIVISOR,
        entryPrice: ENTRY_PRICE,
        exitPrice: liquidationPrice,
        sizeClosed: snapshotBeforeLiquidation.positionAccount!.size,
        feeBps: liquidationFeeBps,
    });
    
    



  });

  it('Successfully liquidates a short position that meets liquidation criteria', async () => {    

    const orderId = client.newUID();
    const positionId = client.newUID();
    const positionPDA = await client.getPositionPDA(user.publicKey, positionId);
    
    // Create and open SHORT position with minimal collateral
    await matcherClient.createAndOpenMarketPosition({
      userClient,
      orderId,
      positionId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL,
      isLong: false, // SHORT position - will lose money when price increases
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000), // 1x leverage
    });
    

    
    // Take snapshot after position creation but before liquidation
    const snapshotAfterOpen = await client.snapshotPositionBalances(
      positionPDA,
      user.publicKey,
      basktId
    );
    
    // Liquidate the SHORT position (200x price increase makes it highly liquidatable)
    await liquidatorClient.liquidatePosition({
      position: positionPDA,
      exitPrice: LIQUIDATION_PRICE, // $200 (200x increase from $1)
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });
    


    await client.verifyClose({
      snapshotBefore: snapshotAfterOpen,
      snapshotAfter: await client.snapshotPositionBalances(positionPDA, user.publicKey, basktId),
      basktId,
      collateralRatioBps: BPS_DIVISOR,
      entryPrice: ENTRY_PRICE,
      exitPrice: LIQUIDATION_PRICE,
      sizeClosed: snapshotAfterOpen.positionAccount!.size,
      feeBps: liquidationFeeBps,
    });
  
    // Take snapshot after liquidation
    const snapshotAfterLiquidation = await client.snapshotPositionBalances(
      positionPDA,
      user.publicKey,
      basktId
    );
    
    await client.verifyClose({
        collateralRatioBps: BPS_DIVISOR,
        entryPrice: ENTRY_PRICE,
        exitPrice: LIQUIDATION_PRICE,
        sizeClosed: snapshotAfterOpen.positionAccount!.size,
        snapshotBefore: snapshotAfterOpen,
        snapshotAfter: snapshotAfterLiquidation,
        basktId,
        feeBps: liquidationFeeBps,
    });
       
  });

  it('Fails to liquidate a position that does not meet liquidation criteria', async () => {
    // This test demonstrates that well-collateralized positions cannot be liquidated
    // even when the liquidator has the proper role
    
    const protocolConfig = await client.getProtocolAccount();
    const minCollateralRatioBps = protocolConfig.config.minCollateralRatioBps;
    const openingFeeBps = protocolConfig.config.openingFeeBps;
    
    const minCollateral = NOTIONAL_ORDER_VALUE.mul(minCollateralRatioBps).div(BPS_DIVISOR);
    const openingFee = NOTIONAL_ORDER_VALUE.mul(openingFeeBps).div(BPS_DIVISOR);
    const safeCollateral = minCollateral.add(openingFee).muln(3); // 3x collateral for safety
    
    const orderId = client.newUID();
    const positionId = client.newUID();
    const positionPDA = await client.getPositionPDA(user.publicKey, positionId);
    
    // Create and open position with substantial collateral (LONG position)
    await matcherClient.createAndOpenMarketPosition({
      userClient,
      orderId,
      positionId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: safeCollateral, // 3x collateral for safety
      isLong: true, // LONG position - will be profitable with price increases
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000), // 1x leverage
    });
    
    // Verify position was created with good collateral
    const position = await client.program.account.position.fetch(positionPDA);
    expect(position.isLong).to.be.true;
    expect(position.collateral.gt(minCollateral.muln(2))).to.be.true; // Should have > 2x min collateral
    
    const moderatePriceIncrease = new BN(1.2 * 1e6); // $1.20 (20% increase - profitable for LONG)
    
    // Try to liquidate the well-collateralized position (should fail)
    try {
      await liquidatorClient.liquidatePosition({
        position: positionPDA,
        exitPrice: moderatePriceIncrease, // Profitable for LONG, not liquidatable
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
    // This test verifies that only accounts with the Liquidator role can liquidate positions
    
    const protocolConfig = await client.getProtocolAccount();
    const minCollateralRatioBps = protocolConfig.config.minCollateralRatioBps;
    const openingFeeBps = protocolConfig.config.openingFeeBps;
    
    const minCollateral = NOTIONAL_ORDER_VALUE.mul(minCollateralRatioBps).div(BPS_DIVISOR);
    const openingFee = NOTIONAL_ORDER_VALUE.mul(openingFeeBps).div(BPS_DIVISOR);
    const roleTestCollateral = minCollateral.add(openingFee); // Minimal collateral for liquidation
    
    const orderId = client.newUID();
    const positionId = client.newUID();
    const positionPDA = await client.getPositionPDA(user.publicKey, positionId);
    
    // Create and open position with minimal collateral (SHORT position)
    await matcherClient.createAndOpenMarketPosition({
      userClient,
      orderId,
      positionId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: roleTestCollateral,
      isLong: false, // SHORT position for liquidation test
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000), // 1x leverage
    });
    
    // Verify position was created and is liquidatable
    const position = await client.program.account.position.fetch(positionPDA);
    expect(position.isLong).to.be.false;
    
    
    // Try to liquidate the position with nonMatcherClient (no liquidator role)
    try {
      await nonMatcherClient.liquidatePosition({
        position: positionPDA,
        exitPrice: LIQUIDATION_PRICE, // $200 - sufficient for SHORT liquidation
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });
      
      expect.fail('Transaction should have failed due to missing liquidator role');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('Unauthorized');
    }
  });

  it('Successfully liquidates multiple positions with different liquidation prices', async () => {
    // This test demonstrates liquidation at different price levels
    // to verify the liquidation logic works across various scenarios
    
    
    // Test Case 1: HIGH liquidation price for SHORT position
    const orderId1 = client.newUID();
    const positionId1 = client.newUID();
    const positionPDA1 = await client.getPositionPDA(user.publicKey, positionId1);

    const highLiquidationPrice = new BN(199 * 1e6); // $199 - very high price
    const moderateLiquidationPrice = new BN(180 * 1e6); // $190 - moderate price increase
    
    await matcherClient.createAndOpenMarketPosition({
      userClient,
      orderId: orderId1,
      positionId: positionId1,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL,
      isLong: false, // SHORT position - loses money when price rises
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000), // 1x leverage
    });
    
    const snapshotBeforeLiquidation1 = await client.snapshotPositionBalances(
      positionPDA1,
      user.publicKey,
      basktId
    );

    // Liquidate at high price
    await liquidatorClient.liquidatePosition({
      position: positionPDA1,
      exitPrice: highLiquidationPrice,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });
    
    await client.verifyClose({
      snapshotBefore: snapshotBeforeLiquidation1,
      snapshotAfter: await client.snapshotPositionBalances(positionPDA1, user.publicKey, basktId),
      basktId,
      collateralRatioBps: BPS_DIVISOR,
      entryPrice: ENTRY_PRICE,    
      exitPrice: highLiquidationPrice,
      sizeClosed: snapshotBeforeLiquidation1.positionAccount!.size,
      feeBps: liquidationFeeBps,
    });

    
    // Test Case 2: MODERATE liquidation price for SHORT position
    const orderId2 = client.newUID();
    const positionId2 = client.newUID();
    const positionPDA2 = await client.getPositionPDA(user.publicKey, positionId2);
    
    await matcherClient.createAndOpenMarketPosition({
      userClient,
      orderId: orderId2,
      positionId: positionId2,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL,
      isLong: false, // SHORT position - loses money when price rises
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000), // 1x leverage
    });

    const snapshotBeforeLiquidation2 = await client.snapshotPositionBalances(
      positionPDA2,
      user.publicKey,
      basktId
    );
    
  
        
    // Liquidate at moderate price
    await liquidatorClient.liquidatePosition({
      position: positionPDA2,
      exitPrice: moderateLiquidationPrice,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });
    
    await client.verifyClose({
      snapshotBefore: snapshotBeforeLiquidation2,
      snapshotAfter: await client.snapshotPositionBalances(positionPDA2, user.publicKey, basktId),
      basktId,
      collateralRatioBps: BPS_DIVISOR,
      entryPrice: ENTRY_PRICE,
      exitPrice: moderateLiquidationPrice,
      sizeClosed: snapshotBeforeLiquidation2.positionAccount!.size,
      feeBps: liquidationFeeBps,
    });
  });

  it('Fails to liquidate position with zero exit price', async () => {
    // This test verifies that liquidation fails with invalid (zero) exit price
    
    const protocolConfig = await client.getProtocolAccount();
    const minCollateralRatioBps = protocolConfig.config.minCollateralRatioBps;
    const openingFeeBps = protocolConfig.config.openingFeeBps;
    
    const minCollateral = NOTIONAL_ORDER_VALUE.mul(minCollateralRatioBps).div(BPS_DIVISOR);
    const openingFee = NOTIONAL_ORDER_VALUE.mul(openingFeeBps).div(BPS_DIVISOR);
    const testCollateral = minCollateral.add(openingFee);
    
    const orderId = client.newUID();
    const positionId = client.newUID();
    const positionPDA = await client.getPositionPDA(user.publicKey, positionId);
    
    // Create and open position
    await matcherClient.createAndOpenMarketPosition({
      userClient,
      orderId,
      positionId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: testCollateral,
      isLong: true, // LONG position
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000), // 1x leverage
    });
    
    // Verify position was created
    const position = await client.program.account.position.fetch(positionPDA);
    expect(position.isLong).to.be.true;
    

    // Try to liquidate with zero exit price (should fail)
    try {
      await liquidatorClient.liquidatePosition({
        position: positionPDA,
        exitPrice: new BN(0), // Invalid zero price
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


  after(async () => {
    // Restore original liquidation threshold
    if (prevThreshold) {
      await client.setLiquidationThresholdBps(prevThreshold);
    }
  });
});
