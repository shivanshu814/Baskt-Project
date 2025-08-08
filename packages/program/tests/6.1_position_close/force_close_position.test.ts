import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient } from '../utils/test-client';
import { BASELINE_PRICE } from '../utils/test-constants';
import { OrderAction, OrderType } from '@baskt/types';
import { PRICE_PRECISION } from '@baskt/sdk';

/**
 * Force Close Position Tests
 *
 * Tests the force_close_position instruction which allows Matcher to close positions
 * after baskt decommissioning. This is a critical instruction for handling positions when
 * a baskt has been decommissioned and normal trading is no longer possible.
 *
 * Core Requirements:
 * 1. Only Matcher role can execute (Unauthorized otherwise)
 * 2. Baskt must be in Decommissioned state (PositionsStillOpen otherwise)
 * 3. Position must be Open (PositionAlreadyClosed otherwise)
 * 4. Supports both full and partial position closing
 * 5. Uses ForceClose fee logic (ClosingType::ForceClose)
 * 6. Updates position funding before closing
 */
describe('Force Close Position', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters
  const NOTIONAL_ORDER_VALUE = new BN(10 * 1e6); // 10 USDC
  const ENTRY_PRICE = BASELINE_PRICE; // NAV starts at 1 with 6 decimals
  const FORCE_CLOSE_PRICE = BASELINE_PRICE.add(new BN(2 * 1e5)); // Slightly higher for testing
  const TICKER = 'BTC';

  // Calculate proper collateral amount based on worst-case notional
  const COLLATERAL_AMOUNT = new BN(12 * 1e6); // 12 USDC with 6 decimals

  // Calculate position size in contracts (NOTIONAL_ORDER_VALUE * PRICE_PRECISION / ENTRY_PRICE)
  const POSITION_SIZE_CONTRACTS = NOTIONAL_ORDER_VALUE.mul(PRICE_PRECISION).div(ENTRY_PRICE);

  // Test accounts from centralized setup
  let user: Keypair;
  let treasury: Keypair;
  let matcher: Keypair;
  let basktManager: Keypair;
  let nonBasktManager: Keypair;
  let userClient: TestClient;
  let matcherClient: TestClient;
  let basktManagerClient: TestClient;
  let nonBasktManagerClient: TestClient;

  // Test state
  let basktId: PublicKey;
  let collateralMint: PublicKey;
  let userTokenAccount: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let assetId: PublicKey;

  // Liquidity pool accounts for Force Close tests
  let liquidityPool: PublicKey;
  let lpMint: PublicKey;
  let usdcVault: PublicKey;

  before(async () => {
    // Use centralized test setup
    const testSetup = await TestClient.setupPositionTest({
      client,
      ticker: TICKER,
    });

    // Assign all the returned values to our test variables
    user = testSetup.user;
    matcher = testSetup.matcher;
    nonBasktManager = testSetup.nonMatcher; // Use nonMatcher as nonBasktManager for this test
    userClient = testSetup.userClient;
    matcherClient = testSetup.matcherClient;
    nonBasktManagerClient = testSetup.nonMatcherClient;
    basktId = testSetup.basktId;
    collateralMint = testSetup.collateralMint;
    userTokenAccount = testSetup.userTokenAccount;
    assetId = testSetup.assetId;
    lpMint = testSetup.lpMint;
    liquidityPool = testSetup.liquidityPool;
    usdcVault = testSetup.usdcVault;

    // Get treasury and basktManager from protocol
    treasury = client.treasury;
    basktManager = client.basktManager;
    basktManagerClient = await TestClient.forUser(basktManager);
    treasuryTokenAccount = await client.getOrCreateUSDCAccountKey(treasury.publicKey);

    // Mint additional USDC for multiple tests
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(5).toNumber(), // 5x for multiple tests
    );

    // Create a separate provider for liquidity to avoid role conflicts
    const liquidityProviderClient = await TestClient.forUser(Keypair.generate());

    // Create token accounts for liquidity provider
    const liquidityProviderTokenAccount = await client.getOrCreateUSDCAccountKey(
      liquidityProviderClient.publicKey,
    );
    const liquidityProviderLpAccount = await client.createTokenAccount(
      lpMint,
      liquidityProviderClient.publicKey,
    );

    // Mint USDC to liquidity provider
    await client.mintUSDC(liquidityProviderTokenAccount, NOTIONAL_ORDER_VALUE.muln(10));

    // Add liquidity using the liquidity provider
    await liquidityProviderClient.addLiquidityToPool({
      liquidityPool,
      amount: NOTIONAL_ORDER_VALUE.muln(10), // deposit 10x notional = 100 USDC
      minSharesOut: new BN(1),
      providerTokenAccount: liquidityProviderTokenAccount,
      usdcVault,
      providerLpAccount: liquidityProviderLpAccount,
      lpMint,
      treasuryTokenAccount,
      treasury: treasury.publicKey,
    });
  });

  afterEach(async () => {
    // Reset feature flags to enabled state after each test using centralized helper
    await TestClient.resetFeatureFlags(client);
  });

  /**
   * Helper function to create a decommissioned baskt with an open position
   * This sets up the prerequisite state for force close testing
   */
  async function createDecommissionedBasktWithPosition(): Promise<{
    positionPDA: PublicKey;
    basktId: PublicKey;
    positionId: number;
  }> {
    // Generate unique IDs for this specific call to avoid conflicts
    const uniqueOrderId = client.newUID();
    const uniquePositionId = client.newUID();

    // Create a fresh baskt for this test
    const formattedAssetConfig = {
      weight: new BN(10000), // 100% weight (10000 bps)
      direction: true, // Long direction
      assetId: assetId,
      baselinePrice: new BN(0),
    };

    const { basktId: testBasktId } = await client.createBaskt(
      [formattedAssetConfig],
      true, // isPublic
    );

    // Activate the baskt
    await client.activateBaskt(testBasktId, [ENTRY_PRICE]);

    // Create and open position using helper
    await matcherClient.createAndOpenMarketPosition({
      userClient,
      orderId: uniqueOrderId,
      positionId: uniquePositionId,
      basktId: testBasktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000),
    });

    // Decommission the baskt
    await basktManagerClient.decommissionBaskt(testBasktId);

    const uniquePositionPDA = await client.getPositionPDA(user.publicKey, uniquePositionId);

    return {
      positionPDA: uniquePositionPDA,
      basktId: testBasktId,
      positionId: uniquePositionId,
    };
  }

  it('Successfully force closes position as Matcher', async () => {
    // Set up decommissioned baskt with position
    const {
      positionPDA: testPositionPDA,
      basktId: testBasktId,
      positionId,
    } = await createDecommissionedBasktWithPosition();

    // Take snapshot before force close
    const snapshotBefore = await client.snapshotPositionBalances(testPositionPDA, user.publicKey, testBasktId);

    // Force close the position as Matcher (has required role)
    await matcherClient.forceClosePosition({
      position: testPositionPDA,
      closePrice: FORCE_CLOSE_PRICE,
      baskt: testBasktId,
      ownerTokenAccount: userTokenAccount,
    });

    // Take snapshot after force close
    const snapshotAfter = await client.snapshotPositionBalances(testPositionPDA, user.publicKey, testBasktId);

    // Verify using the comprehensive verifyClose function
    await client.verifyClose({
      collateralRatioBps: new BN(10000),
      entryPrice: ENTRY_PRICE,
      exitPrice: FORCE_CLOSE_PRICE,
      sizeClosed: POSITION_SIZE_CONTRACTS,
      snapshotBefore,
      snapshotAfter,
      basktId: testBasktId,
    });
  });

  it('Fails to force close position as non-Matcher', async () => {
    // Set up decommissioned baskt with position for this test
    const {
      positionPDA: testPositionPDA,
      basktId: testBasktId,
    } = await createDecommissionedBasktWithPosition();

    // Attempt to force close as non-Matcher - should fail
    try {
      await nonBasktManagerClient.forceClosePosition({
        position: testPositionPDA,
        closePrice: FORCE_CLOSE_PRICE,
        baskt: testBasktId,
        ownerTokenAccount: userTokenAccount,
      });
      expect.fail('Should have thrown Unauthorized error');
    } catch (error) {
      expect((error as Error).message).to.include('Unauthorized');
    }

    // Verify position is still open
    const positionAfter = await client.program.account.position.fetch(testPositionPDA);
    expect(positionAfter.status).to.deep.equal({ open: {} });
  });

  it('Fails to force close position when baskt is not decommissioned', async () => {
    // Create a new active baskt for this test
    const activeOrderId = client.newUID();
    const activePositionId = client.newUID();

    const activePositionPDA = await client.getPositionPDA(user.publicKey, activePositionId);

    // Create and open position in active baskt (not decommissioned)
    await matcherClient.createAndOpenMarketPosition({
      userClient,
      orderId: activeOrderId,
      positionId: activePositionId,
      basktId, // Use the original active baskt
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000),
    });

    // Attempt to force close position in active baskt - should fail
    try {
      await matcherClient.forceClosePosition({
        position: activePositionPDA,
        closePrice: FORCE_CLOSE_PRICE,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
      });
      expect.fail('Should have thrown PositionsStillOpen error');
    } catch (error) {
      expect((error as Error).message).to.include('PositionsStillOpen');
    }

    // Verify position is still open
    const positionAfter = await client.program.account.position.fetch(activePositionPDA);
    expect(positionAfter.status).to.deep.equal({ open: {} });
  });

  it('Fails to force close already closed position', async () => {
    // Set up decommissioned baskt with position
    const {
      positionPDA: testPositionPDA,
      basktId: testBasktId,
    } = await createDecommissionedBasktWithPosition();

    // Force close the position first
    await matcherClient.forceClosePosition({
      position: testPositionPDA,
      closePrice: FORCE_CLOSE_PRICE,
      baskt: testBasktId,
      ownerTokenAccount: userTokenAccount,
    });

    // Attempt to force close again - should fail
    try {
      await matcherClient.forceClosePosition({
        position: testPositionPDA,
        closePrice: FORCE_CLOSE_PRICE,
        baskt: testBasktId,
        ownerTokenAccount: userTokenAccount,
      });
      expect.fail('Should have thrown error for closed position');
    } catch (error) {
      // Position account should be closed, so this should fail with account not found or similar error
      const errorMessage = (error as Error).message;
      const isValidError = errorMessage.includes('Account does not exist') || 
                          errorMessage.includes('AnchorError caused by account: position') ||
                          errorMessage.includes('AccountNotInitialized');
      expect(isValidError).to.be.true;
    }
  });

  it('Successfully partially force closes position', async () => {
    // Set up decommissioned baskt with position
    const {
      positionPDA: testPositionPDA,
      basktId: testBasktId,
    } = await createDecommissionedBasktWithPosition();

    // Get position before partial force close
    const positionBefore = await client.program.account.position.fetch(testPositionPDA);
    const originalSize = positionBefore.size;
    const partialSize = originalSize.div(new BN(2)); // Close 50%

    // Take snapshot before partial force close
    const snapshotBefore = await client.snapshotPositionBalances(testPositionPDA, user.publicKey, testBasktId);

    // Partially force close the position
    await matcherClient.forceClosePosition({
      position: testPositionPDA,
      closePrice: FORCE_CLOSE_PRICE,
      baskt: testBasktId,
      ownerTokenAccount: userTokenAccount,
      sizeToClose: partialSize,
    });

    // Take snapshot after partial force close
    const snapshotAfter = await client.snapshotPositionBalances(testPositionPDA, user.publicKey, testBasktId);

    // Verify using the comprehensive verifyClose function
    await client.verifyClose({
      collateralRatioBps: new BN(10000),
      entryPrice: ENTRY_PRICE,
      exitPrice: FORCE_CLOSE_PRICE,
      sizeClosed: partialSize,
      snapshotBefore,
      snapshotAfter,
      basktId: testBasktId,
    });

    // Verify position is still open with reduced size
    const positionAfter = await client.program.account.position.fetch(testPositionPDA);
    expect(positionAfter.status).to.deep.equal({ open: {} });
    expect(positionAfter.size.toString()).to.equal(originalSize.sub(partialSize).toString());
  });

  it('Fails to partially close with invalid size', async () => {
    // Set up decommissioned baskt with position for this test
    const {
      positionPDA: testPositionPDA,
      basktId: testBasktId,
    } = await createDecommissionedBasktWithPosition();

    // Get position size
    const position = await client.program.account.position.fetch(testPositionPDA);
    const oversizedCloseSize = position.size.muln(2); // 200% of position size

    // Attempt to partially close with oversized amount - should fail
    try {
      await matcherClient.forceClosePosition({
        position: testPositionPDA,
        closePrice: FORCE_CLOSE_PRICE,
        baskt: testBasktId,
        ownerTokenAccount: userTokenAccount,
        sizeToClose: oversizedCloseSize,
      });
      expect.fail('Should have thrown InvalidPositionSize error');
    } catch (error) {
      expect((error as Error).message).to.include('InvalidPositionSize');
    }

    // Verify position is still open and unchanged
    const positionAfter = await client.program.account.position.fetch(testPositionPDA);
    expect(positionAfter.status).to.deep.equal({ open: {} });
    expect(positionAfter.size.toString()).to.equal(position.size.toString());
  });
});
