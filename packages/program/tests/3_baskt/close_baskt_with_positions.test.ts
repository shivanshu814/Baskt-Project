import { expect } from 'chai';
import { describe, before, it, after } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { BN } from 'bn.js';
import { OnchainAssetConfig } from '@baskt/types';
// Using TestClient static method instead of importing from test-setup
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';
import {
  validateBasktSettled,
  validateBasktClosed,
  validatePositionCount,
  validateSpecificError,
  validateBasktStateConsistency,
} from '../utils/baskt-lifecycle-helpers';
import { MIN_COLLATERAL_RATIO_BPS, OPENING_FEE_BPS, BASELINE_PRICE } from '../utils/test-constants';

/**
 * Production-level test for PositionsStillOpen constraint
 * 
 * This test demonstrates the critical constraint that prevents closing
 * a baskt when positions are still open. This is the most important
 * business logic constraint for baskt closure.
 * 
 * Flow:
 * 1. Create and activate baskt
 * 2. Open actual position (increments open_positions)
 * 3. Decommission and settle baskt
 * 4. Attempt close with open position - MUST FAIL with PositionsStillOpen
 * 5. Close position (decrements open_positions)
 * 6. Attempt close again - MUST SUCCEED
 */
describe('Close Baskt - Positions Constraint', () => {
  const client = TestClient.getInstance();

  // Test users
  let oracleManager: Keypair;
  let fundingManager: Keypair;
  let matcher: Keypair;
  let positionOwner: Keypair;

  // Test assets
  let btcAssetId: PublicKey;
  let ethAssetId: PublicKey;

  // Position test data
  let basktId: PublicKey;
  let orderId;
  let positionId;
  let orderPDA: PublicKey;
  let positionPDA: PublicKey;
  let ownerTokenAccount: PublicKey;
  let treasuryTokenAccount: PublicKey;

  const TEST_GRACE_PERIOD = 2;
  const ORDER_SIZE = new BN(10_000_000); // 10 units
  const ENTRY_PRICE = BASELINE_PRICE; // $1 with 6 decimals

  // Calculate required collateral based on worst-case notional (limit price + slippage)
  // Base notional = 10 * 1 = 10 USDC
  // Slippage (5%) = 0.5 USDC
  // Worst-case notional = 10.5 USDC
  // Min collateral (100%) = 10.5 USDC
  // Opening fee (0.1%) = 0.0105 USDC
  // Total required = 10.5105 USDC
  const BASE_NOTIONAL = ORDER_SIZE.mul(ENTRY_PRICE).div(new BN(1_000_000)); // 10 USDC
  const SLIPPAGE_ADJUSTMENT = BASE_NOTIONAL.muln(500).divn(10000); // 5% = 0.5 USDC
  const WORST_CASE_NOTIONAL = BASE_NOTIONAL.add(SLIPPAGE_ADJUSTMENT); // 10.5 USDC
  const MIN_COLLATERAL = WORST_CASE_NOTIONAL.muln(MIN_COLLATERAL_RATIO_BPS).divn(10000); // 100% = 10.5 USDC
  const OPENING_FEE = WORST_CASE_NOTIONAL.muln(OPENING_FEE_BPS).divn(10000); // 0.1% = 0.0105 USDC
  const COLLATERAL_AMOUNT = MIN_COLLATERAL.add(OPENING_FEE).addn(1_000_000); // Add 1 USDC buffer

  before(async () => {
    // Initialize protocol and roles
    const globalAccounts = await TestClient.initializeProtocolAndRoles(client);
    
    oracleManager = client.oracleManager;
    fundingManager = globalAccounts.fundingManager;
    matcher = globalAccounts.matcher;
    positionOwner = Keypair.generate();

    // Fund position owner
    await requestAirdrop(positionOwner.publicKey, client.connection);

    // Create assets
    const btcResult = await client.addAsset('BTC');
    const ethResult = await client.addAsset('ETH');
    btcAssetId = btcResult.assetAddress;
    ethAssetId = ethResult.assetAddress;

    // Enable all features for position testing
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

    // Set grace period
    await client.setDecommissionGracePeriod(TEST_GRACE_PERIOD);
  });

  after(async () => {
    // --- Test Suite Cleanup ---
    // This hook is critical for ensuring that this test file does not
    // leak state into other tests. It resets protocol settings to their
    // default values in a robust way.

    const cleanupStep = async (name: string, action: () => Promise<any>) => {
      try {
        const sig = await action();
        if (sig && typeof sig === 'string') {
          await waitForTx(client.connection, sig);
        }
        // Always wait for the next slot to ensure the state change is processed.
        await waitForNextSlot(client.connection);
      } catch (error) {
        console.warn(`[Cleanup Warning] Failed to reset ${name}:`, error?.toString());
      }
    };

    // Reset feature flags to all-enabled
    await cleanupStep('feature flags', () =>
      client.updateFeatureFlags({
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
      }),
    );

    // Reset grace period to default (24 hours)
    await cleanupStep('grace period', () => client.setDecommissionGracePeriod(86400));
  });

  it('Demonstrates PositionsStillOpen constraint with actual position', async () => {
    // 1. Create and activate baskt
    const assets: OnchainAssetConfig[] = [
      {
        assetId: btcAssetId,
        direction: true,
        weight: new BN(10000), // 100% BTC for simplicity
        baselinePrice: new BN(0),
      },
    ];

    const basktName = `PositionConstraintTest_${Date.now()}`;
    const createResult = await client.createBaskt(basktName, assets, true);
    basktId = createResult.basktId;

    // Activate baskt
    const btcPrice = new BN(500_000000); // $500 (adjusted for $1 baseline)
    await client.activateBaskt(basktId, [btcPrice], 60);
    await client.initializeFundingIndex(basktId);

    // Setup liquidity pool for position operations
    const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    await client.setupLiquidityPool({
      depositFeeBps: 0,
      withdrawalFeeBps: 0,
      minDeposit: new BN(0),
      collateralMint: USDC_MINT,
    });

    // Create token accounts for position owner and treasury
    ownerTokenAccount = await client.getOrCreateUSDCAccount(positionOwner.publicKey);
    treasuryTokenAccount = await client.getOrCreateUSDCAccount(client.treasury.publicKey);
    await client.mintUSDC(ownerTokenAccount, COLLATERAL_AMOUNT.muln(2));

    // 2. Create and open position
    orderId = new BN(Date.now());
    positionId = new BN(Date.now() + 1);

    // Find PDAs
    [orderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), positionOwner.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    [positionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), positionOwner.publicKey.toBuffer(), positionId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    // Create position owner client
    const positionOwnerClient = await TestClient.forUser(positionOwner);
    const matcherClient = await TestClient.forUser(matcher);

    // Create order with proper limit price matching the expected execution price (NAV = $1)
    await positionOwnerClient.createOrder({
      orderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: ownerTokenAccount,
      collateralMint: USDC_MINT,
      limitPrice: ENTRY_PRICE, // Set limit price to match entry price (NAV = $1)
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      orderType: { limit: {} },
    });

    // Open position (this increments open_positions)
    await matcherClient.openPosition({
      positionId: positionId,
      entryPrice: ENTRY_PRICE,
      order: orderPDA,
      baskt: basktId,
      orderOwner: positionOwner.publicKey,
    });

    // Verify position was created and open_positions incremented
    const positionCountResult = await validatePositionCount(client, basktId, 1);
    expect(positionCountResult.isValid, `Position count validation failed: ${positionCountResult.errors?.join(', ')}`).to.be.true;
    expect(positionCountResult.actualCount).to.equal(1);

    // 3. Decommission and settle baskt
    const oracleManagerClient = await TestClient.forUser(oracleManager);
    await oracleManagerClient.decommissionBaskt(basktId);

    await client.waitForSeconds(TEST_GRACE_PERIOD + 1);

    const fundingManagerClient = await TestClient.forUser(fundingManager);
    await fundingManagerClient.updateFundingIndex(basktId, new BN(0));

    await oracleManagerClient.settleBaskt(basktId);

    // Verify baskt is settled but still has open position
    const basktAfterSettle = await client.getBaskt(basktId);
    // Use comprehensive validation instead of superficial check
    const settledValidation = validateBasktSettled(basktAfterSettle.status);
    expect(settledValidation.isValid, `Settled status validation failed: ${settledValidation.errors?.join(', ')}`).to.be.true;

    // Verify settlement details are meaningful
    expect(settledValidation.details!.settlementPrice.gt(new BN(0)), 'Settlement price should be positive').to.be.true;
    expect(settledValidation.details!.settledAt).to.be.a('number');
    expect(settledValidation.details!.settledAt).to.be.greaterThan(0);

    // Verify position count is still 1
    const positionCountAfterSettle = await validatePositionCount(client, basktId, 1);
    expect(positionCountAfterSettle.isValid, `Position count validation failed: ${positionCountAfterSettle.errors?.join(', ')}`).to.be.true;

    // 4. Attempt to close with open position - MUST FAIL
    try {
      await oracleManagerClient.closeBaskt(basktId);
      expect.fail('Should have thrown PositionsStillOpen error');
    } catch (error: any) {
      // Use specific error validation instead of string matching
      const errorValidation = validateSpecificError(error, 'PositionsStillOpen');
      expect(errorValidation.isValid, `Expected PositionsStillOpen error but got: ${errorValidation.actualError}`).to.be.true;
    }

    // Verify baskt is still settled and state is unchanged after failed close
    const stateConsistencyAfterFail = await validateBasktStateConsistency(client, basktId, 1);
    expect(stateConsistencyAfterFail.isValid, `State consistency check failed: ${stateConsistencyAfterFail.errors?.join(', ')}`).to.be.true;

    const basktAfterFailedClose = await client.getBaskt(basktId);
    const settledValidationAfterFail = validateBasktSettled(basktAfterFailedClose.status);
    expect(settledValidationAfterFail.isValid, 'Baskt should still be in settled state after failed close').to.be.true;

    // 5. Close position (this decrements open_positions)
    // Create close order
    const closeOrderId = new BN(Date.now() + 100);
    const [closeOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), positionOwner.publicKey.toBuffer(), closeOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    await positionOwnerClient.createOrder({
      orderId: closeOrderId,
      size: ORDER_SIZE,
      collateral: new BN(0), // No additional collateral for close
      isLong: true,
      action: { close: {} },
      targetPosition: positionPDA,
      basktId: basktId,
      ownerTokenAccount: ownerTokenAccount,
      collateralMint: USDC_MINT,
      limitPrice: ENTRY_PRICE, // Set limit price to match exit price (NAV = $1)
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      orderType: { limit: {} },
    });

    // Close position with correct parameters
    await matcherClient.closePosition({
      orderPDA: closeOrderPDA,
      position: positionPDA,
      exitPrice: ENTRY_PRICE, // Same price for simplicity
      baskt: basktId,
      ownerTokenAccount: ownerTokenAccount,
      treasury: client.treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Verify position was closed and open_positions decremented
    const positionCountAfterClose = await validatePositionCount(client, basktId, 0);
    expect(positionCountAfterClose.isValid, `Position count validation failed: ${positionCountAfterClose.errors?.join(', ')}`).to.be.true;
    expect(positionCountAfterClose.actualCount).to.equal(0);

    // 6. Now close baskt should succeed
    await oracleManagerClient.closeBaskt(basktId);

    // Verify successful close with comprehensive validation
    const basktFinal = await client.getBaskt(basktId);
    // Use comprehensive validation instead of superficial check
    const closedValidation = validateBasktClosed(basktFinal.status);
    expect(closedValidation.isValid, `Closed status validation failed: ${closedValidation.errors?.join(', ')}`).to.be.true;

    // Verify close details are meaningful
    expect(closedValidation.details!.finalNav.gt(new BN(0)), 'Final NAV should be positive').to.be.true;
    expect(closedValidation.details!.closedAt).to.be.a('number');
    expect(closedValidation.details!.closedAt).to.be.greaterThan(0);

    // Verify final state consistency
    const finalStateConsistency = await validateBasktStateConsistency(client, basktId, 0);
    expect(finalStateConsistency.isValid, `Final state consistency check failed: ${finalStateConsistency.errors?.join(', ')}`).to.be.true;
  });
});
