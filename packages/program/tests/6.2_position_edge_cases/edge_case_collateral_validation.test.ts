import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient } from '../utils/test-client';
import { BASELINE_PRICE } from '../utils/test-constants';
import { PRICE_PRECISION } from '@baskt/sdk';
import { BPS_DIVISOR } from '../utils/fee-utils';

/**
 * This test demonstrates a potential edge case where:
 * 1. A position can be created with collateral that passes initial validation
 * 2. But the collateral after fees becomes insufficient for proper operation
 * 
 * The issue arises because:
 * - Position creation validates: collateral >= min_collateral_ratio * size
 * - Opening fees are deducted from collateral, potentially leaving insufficient net collateral
 */
describe('Edge Case: Collateral Validation Gap', () => {
  const client = TestClient.getInstance();
  
  // Test parameters
  const TICKER = 'BTC';
  const ENTRY_PRICE = BASELINE_PRICE; // NAV starts at 1 with 6 decimals
  const POSITION_SIZE = new BN(10 * 1e6); // 10 USDC notional
  
  // Test accounts from centralized setup
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
  
  // Liquidity pool accounts
  let liquidityPool: PublicKey;
  let lpMint: PublicKey;
  let usdcVault: PublicKey;
  
  before(async () => {
    // Use centralized test setup
    const testSetup = await TestClient.setupPositionTest({
      client,
      ticker: TICKER,
    });
    
    // Assign all the returned values from setup
    user = testSetup.user;
    matcher = testSetup.matcher;
    nonMatcher = testSetup.nonMatcher;
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
    
    // Create treasury token account
    treasuryTokenAccount = await client.getOrCreateUSDCAccountKey(treasury.publicKey);
    
    // Mint additional USDC to user for edge case testing
    await client.mintUSDC(userTokenAccount, 1000 * 1e6); // 1000 USDC
  });
  
  afterEach(async () => {
    // Reset feature flags using centralized method
    await TestClient.resetFeatureFlags(client);
  });
  
  it('Demonstrates position with minimal collateral edge case', async () => {
    // Get current protocol config
    const protocolConfig = await client.getProtocolAccount();
    
    const MIN_COLLATERAL_RATIO_BPS = protocolConfig.config.minCollateralRatioBps.toNumber();
    const OPENING_FEE_BPS = protocolConfig.config.openingFeeBps.toNumber();
    
    console.log('Protocol Config:');
    console.log('- Min Collateral Ratio:', MIN_COLLATERAL_RATIO_BPS, 'bps');
    console.log('- Opening Fee:', OPENING_FEE_BPS, 'bps');
    
    // Calculate edge case values
    const minCollateralRequired = POSITION_SIZE.muln(MIN_COLLATERAL_RATIO_BPS).divn(10000);
    const openingFee = POSITION_SIZE.muln(OPENING_FEE_BPS).divn(10000);
    
    // Set collateral to EXACTLY the minimum required
    // This creates an edge case where net collateral after fees is minimal
    const MINIMAL_COLLATERAL = minCollateralRequired.add(openingFee);
    
    console.log('\nCalculated Values:');
    console.log('- Position Size:', POSITION_SIZE.toString());
    console.log('- Min Collateral Required:', minCollateralRequired.toString());
    console.log('- Opening Fee:', openingFee.toString());
    console.log('- Minimal Collateral Provided:', MINIMAL_COLLATERAL.toString());
    console.log('- Net Collateral After Fee:', MINIMAL_COLLATERAL.sub(openingFee).toString());
    
    // Create position with minimal collateral
    const orderId = client.newUID();
    const positionId = client.newUID();
    
    try {
      // This should succeed with proper minimal collateral
      await matcherClient.createAndOpenMarketPosition({
        userClient,
        orderId,
        positionId,
        basktId,
        notionalValue: POSITION_SIZE,
        collateral: MINIMAL_COLLATERAL,
        isLong: true,
        entryPrice: ENTRY_PRICE,
        ownerTokenAccount: userTokenAccount,
        leverageBps: new BN(10000), // 1x leverage
      });
      
      console.log('\n✅ Position creation SUCCEEDED with minimal collateral');
      
      // Verify position was created with expected net collateral
      const positionPDA = await client.getPositionPDA(user.publicKey, positionId);
      const position = await client.program.account.position.fetch(positionPDA);
      
      const expectedNetCollateral = MINIMAL_COLLATERAL.sub(openingFee);
      console.log('Expected net collateral:', expectedNetCollateral.toString());
      console.log('Actual position collateral:', position.collateral.toString());
      
      // Allow for small rounding differences
      const tolerance = new BN(100); // 0.0001 USDC tolerance
      const difference = position.collateral.sub(expectedNetCollateral).abs();
      expect(
        difference.lte(tolerance),
        `Collateral difference ${difference.toString()} exceeds tolerance ${tolerance.toString()}`
      ).to.be.true;
      
    } catch (error: any) {
      console.log('\n❌ Position creation FAILED:', error.message);
      throw error;
    }
  });
  
  it('Demonstrates insufficient collateral scenario that should fail', async () => {
    // Get protocol config
    const protocolConfig = await client.getProtocolAccount();
    
    const MIN_COLLATERAL_RATIO_BPS = protocolConfig.config.minCollateralRatioBps.toNumber();
    const OPENING_FEE_BPS = protocolConfig.config.openingFeeBps.toNumber();
    
    // Calculate collateral that will be insufficient after fee deduction
    const minCollateralRequired = POSITION_SIZE.muln(MIN_COLLATERAL_RATIO_BPS).divn(10000);
    const openingFee = POSITION_SIZE.muln(OPENING_FEE_BPS).divn(10000);
    
    // Insufficient approach: Use less than minimum + fee
    const INSUFFICIENT_COLLATERAL = minCollateralRequired.add(openingFee.divn(2)); // Only half the fee
    
    console.log('\nInsufficient Collateral Scenario:');
    console.log('- Min Collateral Required:', minCollateralRequired.toString());
    console.log('- Opening Fee:', openingFee.toString());
    console.log('- Insufficient Collateral Provided:', INSUFFICIENT_COLLATERAL.toString());
    console.log('- Net After Fee:', INSUFFICIENT_COLLATERAL.sub(openingFee).toString());
    console.log('- Shortfall:', minCollateralRequired.sub(INSUFFICIENT_COLLATERAL.sub(openingFee)).toString());
    
    // Try to create position with insufficient collateral  
    const orderId = client.newUID();
    const positionId = client.newUID();
    
    try {
      await matcherClient.createAndOpenMarketPosition({
        userClient,
        orderId,
        positionId,
        basktId,
        notionalValue: POSITION_SIZE,
        collateral: INSUFFICIENT_COLLATERAL,
        isLong: true,
        entryPrice: ENTRY_PRICE,
        ownerTokenAccount: userTokenAccount,
        leverageBps: new BN(10000), // 1x leverage
      });
      
      console.log('\n❌ Position creation SUCCEEDED (unexpected - should have failed)');
      expect.fail('Position creation should have failed with insufficient collateral');
      
    } catch (error: any) {
      console.log('\n✅ Position creation FAILED as expected:', error.message);
      
      // Verify the error is about insufficient collateral
      expect(error.message).to.include('InsufficientCollateral');
    }
  });
  
  it('Shows the correct way to handle collateral with buffer', async () => {
    // Get protocol config
    const protocolConfig = await client.getProtocolAccount();
    
    const MIN_COLLATERAL_RATIO_BPS = protocolConfig.config.minCollateralRatioBps.toNumber();
    const OPENING_FEE_BPS = protocolConfig.config.openingFeeBps.toNumber();
    
    // Calculate collateral with proper buffer
    const minCollateralRequired = POSITION_SIZE.muln(MIN_COLLATERAL_RATIO_BPS).divn(10000);
    const openingFee = POSITION_SIZE.muln(OPENING_FEE_BPS).divn(10000);
    
    // Best practice: Add buffer on top of minimum + fees
    const buffer = minCollateralRequired.muln(10).divn(100); // 10% buffer
    const OPTIMAL_COLLATERAL = minCollateralRequired.add(openingFee).add(buffer);
    
    console.log('\nOptimal Collateral Calculation:');
    console.log('- Min Collateral Required:', minCollateralRequired.toString());
    console.log('- Opening Fee:', openingFee.toString());
    console.log('- Buffer (10%):', buffer.toString());
    console.log('- Total Optimal Collateral:', OPTIMAL_COLLATERAL.toString());
    console.log('- Net After Fee:', OPTIMAL_COLLATERAL.sub(openingFee).toString());
    console.log('- Safety Margin:', OPTIMAL_COLLATERAL.sub(openingFee).sub(minCollateralRequired).toString());
    
    // Take snapshot before position creation 
    const orderId = client.newUID();
    const positionId = client.newUID();
    const positionPDA = await client.getPositionPDA(user.publicKey, positionId);
    
    const snapshotBefore = await client.snapshotPositionBalances(
      positionPDA,
      user.publicKey,
      basktId
    );
    
    // Create and open position with optimal collateral
    await matcherClient.createAndOpenMarketPosition({
      userClient,
      orderId,
      positionId,
      basktId,
      notionalValue: POSITION_SIZE,
      collateral: OPTIMAL_COLLATERAL,
      isLong: true,
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000), // 1x leverage
    });
    
    // Take snapshot after position creation
    const snapshotAfter = await client.snapshotPositionBalances(
      positionPDA,
      user.publicKey,
      basktId
    );
    
    console.log('\n✅ Position creation succeeded with optimal collateral');
    
    // Verify position details
    const position = snapshotAfter.positionAccount;
    expect(position).to.not.be.undefined;
    expect(position!.size.eq(POSITION_SIZE.mul(PRICE_PRECISION).div(ENTRY_PRICE))).to.be.true;
    expect(position!.isLong).to.be.true;
    
    // Verify collateral after fees has good safety margin
    const expectedNetCollateral = OPTIMAL_COLLATERAL.sub(openingFee);
    const safetyMargin = expectedNetCollateral.sub(minCollateralRequired);
    expect(safetyMargin.gt(new BN(0))).to.be.true;
    
    console.log('Position created with net collateral:', position!.collateral.toString());
    console.log('Safety margin:', safetyMargin.toString());
  });
});