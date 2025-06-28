import { expect } from 'chai';
import { describe, before, it, after } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';
import { BN } from 'bn.js';
import { OnchainAssetConfig } from '@baskt/types';
// Using TestClient static method instead of importing from test-setup
import {
  validateBasktPending,
  validateBasktActive,
  validateBasktDecommissioning,
  validateBasktSettled,
  validateBasktClosed,
} from '../utils/baskt-lifecycle-helpers';

/**
 * Close Baskt Tests - Core Business Logic
 *
 * Tests the close_baskt instruction which is the final step in baskt lifecycle.
 *
 * Core Requirements (from Rust code analysis):
 * 1. Must be in Settled state (InvalidBasktState otherwise)
 * 2. Must have zero open positions (PositionsStillOpen otherwise)
 * 3. Only OracleManager role can execute (Unauthorized otherwise)
 * 4. Final NAV = settlement_price from Settled state (get_settlement_nav())
 * 5. Emits BasktClosed event with baskt, final_nav, closed_at
 *
 * Note: PositionsStillOpen constraint with actual positions is tested
 * in close_baskt_with_positions.test.ts to avoid duplication.
 */
describe('Close Baskt - Core Logic', () => {
  const client = TestClient.getInstance();

  // Role-based test users
  let oracleManager: Keypair;
  let fundingManager: Keypair;
  let regularUser: Keypair;

  // Test assets
  let btcAssetId: PublicKey;
  let ethAssetId: PublicKey;

  // Test configuration
  const TEST_GRACE_PERIOD = 2; // 2 seconds for testing

  before(async () => {
    // Initialize protocol and roles
    const globalAccounts = await TestClient.initializeProtocolAndRoles(client);

    // Assign role-based users
    oracleManager = client.oracleManager;
    fundingManager = globalAccounts.fundingManager;
    regularUser = Keypair.generate();

    // Create test assets
    const btcResult = await client.addAsset('BTC');
    const ethResult = await client.addAsset('ETH');
    btcAssetId = btcResult.assetAddress;
    ethAssetId = ethResult.assetAddress;

    // Set grace period for testing
    await client.setDecommissionGracePeriod(TEST_GRACE_PERIOD);
  });

  after(async () => {
    // Reset grace period to default - use minimal retries for cleanup
    try {
      await client.executeWithRetry(() =>
        client.setDecommissionGracePeriod(86400), // 24 hours
        1, // Only 1 retry for cleanup to avoid hanging
        500 // 0.5 second delay
      );
    } catch (error) {
      // Silently ignore cleanup failures to avoid masking test results
      // Note: Failed to reset grace period during cleanup - this is non-critical
    }
  });

  /**
   * Helper to create baskt in specific lifecycle state
   * Follows the exact baskt lifecycle: pending -> active -> decommissioning -> settled -> closed
   */
  async function createBasktInState(
    name: string,
    targetState: 'pending' | 'active' | 'decommissioning' | 'settled' | 'closed',
    fundingRate: number = 0
  ): Promise<{ basktId: PublicKey; basktName: string }> {
    // Create baskt with standard asset allocation
    const assets: OnchainAssetConfig[] = [
      {
        assetId: btcAssetId,
        direction: true,
        weight: new BN(7000), // 70% BTC
        baselinePrice: new BN(0),
      },
      {
        assetId: ethAssetId,
        direction: true,
        weight: new BN(3000), // 30% ETH
        baselinePrice: new BN(0),
      },
    ];

    const uniqueName = `${name}_${Date.now()}`;
    const { basktId } = await client.executeWithRetry(() =>
      client.createBaskt(uniqueName, assets, true)
    );

    // Add small delay to reduce resource contention in full test suite
    await client.waitForSeconds(0.5);

    if (targetState === 'pending') {
      return { basktId, basktName: uniqueName };
    }

    // Activate baskt
    const btcPrice = new BN(50000_000000); // $50,000
    const ethPrice = new BN(3000_000000);  // $3,000
    await client.executeWithRetry(() =>
      client.activateBaskt(basktId, [btcPrice, ethPrice], 60)
    );
    await client.executeWithRetry(() =>
      client.initializeFundingIndex(basktId)
    );

    // Add delay after activation to reduce contention
    await client.waitForSeconds(0.5);

    if (targetState === 'active') {
      return { basktId, basktName: uniqueName };
    }

    // Decommission baskt (OracleManager only)
    const oracleManagerClient = await TestClient.forUser(oracleManager);
    await client.executeWithRetry(() =>
      oracleManagerClient.decommissionBaskt(basktId)
    );

    if (targetState === 'decommissioning') {
      return { basktId, basktName: uniqueName };
    }

    // Wait for grace period and settle
    await client.waitForSeconds(TEST_GRACE_PERIOD + 1);

    // Update funding index (FundingManager only)
    const fundingManagerClient = await TestClient.forUser(fundingManager);
    await client.executeWithRetry(() =>
      fundingManagerClient.updateFundingIndex(basktId, new BN(fundingRate))
    );

    // Settle baskt (OracleManager only)
    await client.executeWithRetry(() =>
      oracleManagerClient.settleBaskt(basktId)
    );

    if (targetState === 'settled') {
      return { basktId, basktName: uniqueName };
    }

    // Close baskt (OracleManager only)
    await client.executeWithRetry(() =>
      oracleManagerClient.closeBaskt(basktId)
    );

    return { basktId, basktName: uniqueName };
  }

  describe('Successful Close Operations', () => {
    it('Successfully closes settled baskt with zero open positions', async () => {
      // Create settled baskt
      const { basktId } = await createBasktInState('CloseSuccess', 'settled');

      // Verify pre-conditions
      const basktBefore = await client.getBaskt(basktId);
      const settledValidation = validateBasktSettled(basktBefore.status);
      expect(settledValidation.isValid).to.be.true;
      expect(basktBefore.openPositions.toString()).to.equal('0');

      // Get settlement details for NAV verification
      expect(settledValidation.details).to.not.be.undefined;
      const expectedFinalNav = settledValidation.details!.settlementPrice;

      // Record timestamp before close
      const beforeTimestamp = Math.floor(Date.now() / 1000);

      // Close baskt (OracleManager only)
      const oracleManagerClient = await TestClient.forUser(oracleManager);
      const txSignature = await client.executeWithRetry(() =>
        oracleManagerClient.closeBaskt(basktId)
      );
      expect(txSignature).to.be.a('string');

      // Verify final state
      const basktAfter = await client.getBaskt(basktId);
      const closedValidation = validateBasktClosed(basktAfter.status, expectedFinalNav);
      expect(closedValidation.isValid).to.be.true;

      // Verify close details - final NAV must equal settlement price
      expect(closedValidation.details).to.not.be.undefined;
      expect(closedValidation.details!.finalNav.toString()).to.equal(expectedFinalNav.toString());
      expect(closedValidation.details!.closedAt).to.be.greaterThanOrEqual(beforeTimestamp - 1);
      expect(closedValidation.details!.closedAt).to.be.lessThanOrEqual(beforeTimestamp + 10);
    });

    it('Verifies final NAV equals settlement price with funding rate', async () => {
      // Create settled baskt with specific funding rate
      const { basktId } = await createBasktInState('NavWithFunding', 'settled', 25); // 0.25% funding rate

      // Get settlement data before closing
      const basktBeforeClose = await client.getBaskt(basktId);
      const settledValidation = validateBasktSettled(basktBeforeClose.status);
      expect(settledValidation.isValid).to.be.true;
      expect(settledValidation.details!.settlementPrice.gt(new BN(0))).to.be.true;

      // Close baskt
      const oracleManagerClient = await TestClient.forUser(oracleManager);
      await client.executeWithRetry(() =>
        oracleManagerClient.closeBaskt(basktId)
      );

      // Verify final NAV matches settlement price exactly
      const basktAfterClose = await client.getBaskt(basktId);
      const closedValidation = validateBasktClosed(basktAfterClose.status, settledValidation.details!.settlementPrice);
      expect(closedValidation.isValid).to.be.true;

      // Critical constraint: final NAV must equal settlement price
      expect(closedValidation.details!.finalNav.toString()).to.equal(
        settledValidation.details!.settlementPrice.toString(),
        'Final NAV must equal settlement price from Settled state'
      );
    });

    it('Verifies final NAV calculation with zero funding rate', async () => {
      // Create settled baskt with zero funding rate for clean calculation
      const { basktId } = await createBasktInState('NavZeroFunding', 'settled', 0);

      // Get settlement details before closing
      const basktBeforeClose = await client.getBaskt(basktId);
      const settledValidation = validateBasktSettled(basktBeforeClose.status);
      expect(settledValidation.isValid).to.be.true;
      const expectedFinalNav = settledValidation.details!.settlementPrice;

      // Close the baskt
      const oracleManagerClient = await TestClient.forUser(oracleManager);
      await client.executeWithRetry(() =>
        oracleManagerClient.closeBaskt(basktId)
      );

      // Verify final NAV calculation
      const basktAfter = await client.getBaskt(basktId);
      const closedValidation = validateBasktClosed(basktAfter.status, expectedFinalNav);
      expect(closedValidation.isValid).to.be.true;

      // Final NAV must equal settlement price (get_settlement_nav() implementation)
      expect(closedValidation.details!.finalNav.toString()).to.equal(expectedFinalNav.toString());
      expect(closedValidation.details!.closedAt).to.be.greaterThan(0);
    });
  });

  describe('State Constraint Validation', () => {
    it('Rejects close on Pending baskt with InvalidBasktState', async () => {
      const { basktId } = await createBasktInState('PendingReject', 'pending');

      // Attempt close on pending baskt - must fail
      const oracleManagerClient = await TestClient.forUser(oracleManager);
      try {
        await oracleManagerClient.closeBaskt(basktId);
        expect.fail('Should have thrown InvalidBasktState error');
      } catch (error: unknown) {
        expect((error as Error).message).to.contains('InvalidBasktState');
      }

      // Verify state unchanged
      const basktAfter = await client.getBaskt(basktId);
      const pendingValidation = validateBasktPending(basktAfter.status);
      expect(pendingValidation.isValid).to.be.true;
    });

    it('Rejects close on Active baskt with InvalidBasktState', async () => {
      const { basktId } = await createBasktInState('ActiveReject', 'active');

      // Attempt close on active baskt - must fail
      const oracleManagerClient = await TestClient.forUser(oracleManager);
      try {
        await oracleManagerClient.closeBaskt(basktId);
        expect.fail('Should have thrown InvalidBasktState error');
      } catch (error: unknown) {
        expect((error as Error).message).to.contain('InvalidBasktState');
      }

      // Verify state unchanged
      const basktAfter = await client.getBaskt(basktId);
      const activeValidation = validateBasktActive(basktAfter.status);
      expect(activeValidation.isValid).to.be.true;
    });

    it('Rejects close on Decommissioning baskt with InvalidBasktState', async () => {
      const { basktId } = await createBasktInState('DecommissioningReject', 'decommissioning');

      // Attempt close on decommissioning baskt - must fail
      const oracleManagerClient = await TestClient.forUser(oracleManager);
      try {
        await oracleManagerClient.closeBaskt(basktId);
        expect.fail('Should have thrown InvalidBasktState error');
      } catch (error: unknown) {
        expect((error as Error).message).to.contain('InvalidBasktState');
      }

      // Verify state unchanged
      const basktAfter = await client.getBaskt(basktId);
      const decommissioningValidation = validateBasktDecommissioning(basktAfter.status);
      expect(decommissioningValidation.isValid).to.be.true;
    });

    it('Rejects double close with InvalidBasktState', async () => {
      const { basktId } = await createBasktInState('DoubleCloseReject', 'closed');

      // Attempt to close already closed baskt - must fail
      const oracleManagerClient = await TestClient.forUser(oracleManager);
      try {
        await oracleManagerClient.closeBaskt(basktId);
        expect.fail('Should have thrown InvalidBasktState error');
      } catch (error: unknown) {
        expect((error as Error).message).to.contain('InvalidBasktState');
      }

      // Verify state unchanged
      const basktAfter = await client.getBaskt(basktId);
      const closedValidation = validateBasktClosed(basktAfter.status);
      expect(closedValidation.isValid).to.be.true;
    });

    // Note: PositionsStillOpen constraint is tested in close_baskt_with_positions.test.ts
    // with actual position creation to avoid duplication and complexity here
  });

  describe('Authorization Constraints', () => {
    it('Rejects close by regular user with Unauthorized error', async () => {
      const { basktId } = await createBasktInState('RegularUserReject', 'settled');

      // Attempt close with regular user - must fail
      const regularUserClient = await TestClient.forUser(regularUser);
      try {
        await regularUserClient.closeBaskt(basktId);
        expect.fail('Should have thrown Unauthorized error');
      } catch (error: unknown) {
        expect((error as Error).message).to.contain('Unauthorized');
      }

      // Verify state unchanged
      const basktAfter = await client.getBaskt(basktId);
      const settledValidation = validateBasktSettled(basktAfter.status);
      expect(settledValidation.isValid).to.be.true;
    });

    it('Rejects close by FundingManager with Unauthorized error', async () => {
      const { basktId } = await createBasktInState('FundingManagerReject', 'settled');

      // Attempt close with FundingManager (wrong role) - must fail
      const fundingManagerClient = await TestClient.forUser(fundingManager);
      try {
        await fundingManagerClient.closeBaskt(basktId);
        expect.fail('Should have thrown Unauthorized error');
      } catch (error: unknown) {
        expect((error as Error).message).to.contain('Unauthorized');
      }

      // Verify state unchanged
      const basktAfter = await client.getBaskt(basktId);
      const settledValidation = validateBasktSettled(basktAfter.status);
      expect(settledValidation.isValid).to.be.true;
    });

    it('Allows close by OracleManager (correct role)', async () => {
      const { basktId } = await createBasktInState('OracleManagerSuccess', 'settled');

      // Close with OracleManager - must succeed
      const oracleManagerClient = await TestClient.forUser(oracleManager);
      const txSignature = await oracleManagerClient.closeBaskt(basktId);
      expect(txSignature).to.be.a('string');

      // Verify successful close
      const basktAfter = await client.getBaskt(basktId);
      const closedValidation = validateBasktClosed(basktAfter.status);
      expect(closedValidation.isValid).to.be.true;
    });
  });

  describe('Integration Tests', () => {
    it('Executes complete baskt lifecycle ending with close', async () => {
      // Create baskt with standard asset allocation
      const assetConfigs: OnchainAssetConfig[] = [
        {
          assetId: btcAssetId,
          direction: true,
          weight: new BN(7000), // 70% BTC
          baselinePrice: new BN(0),
        },
        {
          assetId: ethAssetId,
          direction: true,
          weight: new BN(3000), // 30% ETH
          baselinePrice: new BN(0),
        },
      ];

      // 1. Create baskt (Pending state)
      const basktName = `LifecycleTest_${Date.now()}`;
      const { basktId } = await client.executeWithRetry(() =>
        client.createBaskt(basktName, assetConfigs, true)
      );

      let baskt = await client.getBaskt(basktId);
      const pendingValidation = validateBasktPending(baskt.status);
      expect(pendingValidation.isValid).to.be.true;
      expect(baskt.openPositions.toString()).to.equal('0');

      // 2. Activate baskt
      const btcPrice = new BN(50000_000000); // $50,000
      const ethPrice = new BN(3000_000000);  // $3,000
      await client.executeWithRetry(() =>
        client.activateBaskt(basktId, [btcPrice, ethPrice], 60)
      );
      await client.executeWithRetry(() =>
        client.initializeFundingIndex(basktId)
      );

      baskt = await client.getBaskt(basktId);
      const activeValidation = validateBasktActive(baskt.status);
      expect(activeValidation.isValid).to.be.true;
      expect(baskt.baselineNav.gt(new BN(0))).to.be.true;

      // 3. Decommission baskt (OracleManager only)
      const oracleManagerClient = await TestClient.forUser(oracleManager);
      await client.executeWithRetry(() =>
        oracleManagerClient.decommissionBaskt(basktId)
      );

      baskt = await client.getBaskt(basktId);
      const decommissioningValidation = validateBasktDecommissioning(baskt.status);
      expect(decommissioningValidation.isValid).to.be.true;

      // 4. Update funding and settle (role-based operations)
      await client.waitForSeconds(TEST_GRACE_PERIOD + 1);

      // Update funding index (FundingManager only)
      const fundingManagerClient = await TestClient.forUser(fundingManager);
      const fundingRate = 15; // 0.15% hourly rate
      await client.executeWithRetry(() =>
        fundingManagerClient.updateFundingIndex(basktId, new BN(fundingRate))
      );

      // Settle baskt (OracleManager only)
      await client.executeWithRetry(() =>
        oracleManagerClient.settleBaskt(basktId)
      );

      baskt = await client.getBaskt(basktId);
      const settledValidation = validateBasktSettled(baskt.status);
      expect(settledValidation.isValid).to.be.true;

      // Verify settlement data
      expect(settledValidation.details).to.not.be.undefined;
      expect(settledValidation.details!.settlementPrice.gt(new BN(0))).to.be.true;
      expect(settledValidation.details!.settlementFundingIndex).to.exist;

      // 5. Close baskt (OracleManager only)
      const beforeCloseTimestamp = Math.floor(Date.now() / 1000);
      await client.executeWithRetry(() =>
        oracleManagerClient.closeBaskt(basktId)
      );

      baskt = await client.getBaskt(basktId);
      const closedValidation = validateBasktClosed(baskt.status);
      expect(closedValidation.isValid).to.be.true;

      // Verify final close data with precision
      expect(closedValidation.details).to.not.be.undefined;
      expect(closedValidation.details!.finalNav.toString()).to.equal(
        settledValidation.details!.settlementPrice.toString(),
        'Final NAV must equal settlement price'
      );
      expect(closedValidation.details!.closedAt).to.be.greaterThanOrEqual(beforeCloseTimestamp - 1);
      expect(closedValidation.details!.closedAt).to.be.lessThanOrEqual(beforeCloseTimestamp + 60);
    });

    it('Validates funding rate affects settlement price and final NAV', async () => {
      // Create active baskt and capture initial funding index
      const { basktId } = await createBasktInState('FundingAccumulation', 'active');

      const fundingIndexBeforeObj = await client.getFundingIndex(basktId);
      expect(fundingIndexBeforeObj).to.not.be.null;
      const fundingIndexBefore = new BN(fundingIndexBeforeObj!.cumulativeIndex.toString());

      // Set an initial funding rate so that the next update accrues using this rate
      const fundingManagerClient = await TestClient.forUser(fundingManager);
      await client.executeWithRetry(() =>
        fundingManagerClient.updateFundingIndex(basktId, new BN(50)) // 0.5% hourly
      );

      // Decommission, wait, update funding, settle
      const oracleManagerClient = await TestClient.forUser(oracleManager);
      await client.executeWithRetry(() =>
        oracleManagerClient.decommissionBaskt(basktId)
      );

      await client.waitForSeconds(TEST_GRACE_PERIOD + 1);

      // Accrue funding for the elapsed grace period using the previously set rate
      await client.executeWithRetry(() =>
        fundingManagerClient.updateFundingIndex(basktId, new BN(50))
      );

      await client.executeWithRetry(() =>
        oracleManagerClient.settleBaskt(basktId)
      );

      // Verify funding index increased
      const basktAfterSettle = await client.getBaskt(basktId);
      const settledValidation = validateBasktSettled(basktAfterSettle.status);
      expect(settledValidation.isValid).to.be.true;
      expect(settledValidation.details).to.not.be.undefined;
      const fundingIndexAfter = new BN(settledValidation.details!.settlementFundingIndex.toString());
      expect(fundingIndexAfter.gt(fundingIndexBefore)).to.be.true;

      // Close and verify final NAV matches settlement price
      await client.executeWithRetry(() =>
        oracleManagerClient.closeBaskt(basktId)
      );

      const basktAfterClose = await client.getBaskt(basktId);
      const closedValidation = validateBasktClosed(basktAfterClose.status);
      expect(closedValidation.isValid).to.be.true;
      expect(closedValidation.details).to.not.be.undefined;
      expect(closedValidation.details!.finalNav.toString()).to.equal(
        settledValidation.details!.settlementPrice.toString()
      );
    });
  });
});
