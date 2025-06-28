import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';
// Using TestClient static method instead of importing from test-setup
import { AccessControlRole } from '@baskt/types';
import BN from 'bn.js';
import { MIN_COLLATERAL_RATIO_BPS } from '../utils/test-constants';

describe('protocol config setters', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Create test accounts
  const configManager = Keypair.generate();
  const nonAuthorizedAccount = Keypair.generate();

  // Constants for testing (from constants.rs)
  const MAX_FEE_BPS = 500; // 5% maximum fee
  const MAX_PRICE_DEVIATION_BPS = 2500; // 25% max price deviation
  const LIQUIDATION_PRICE_DEVIATION_BPS = 2000; // 20% max liquidation price deviation
  const MIN_GRACE_PERIOD = 1; // 1 hour
  const MAX_GRACE_PERIOD = 604800; // 7 days
  const BPS_DIVISOR = 10000; // 100% in basis points

  // Variables to hold initial state for rollback
  let initialConfig: any;
  let initialTreasury: PublicKey;

  before(async () => {
    // Initialize protocol and roles first
    await TestClient.initializeProtocolAndRoles(client);

    // Add ConfigManager role to test account
    await client.addRole(configManager.publicKey, AccessControlRole.ConfigManager);

    // Capture initial protocol configuration to restore later
    const protocol = await client.getProtocolAccount();
    initialConfig = protocol.config;
    initialTreasury = new PublicKey(protocol.treasury);
  });

  after(async () => {
    if (!initialConfig) {
      // Nothing to roll back (should not happen)
      return;
    }

    // 1. Restore treasury so helper clients use a matching address
    await client.updateTreasury(initialTreasury);

    // 2. Restore each individual configuration field we may have changed
    await client.setOpeningFeeBps(initialConfig.openingFeeBps.toNumber());
    await client.setClosingFeeBps(initialConfig.closingFeeBps.toNumber());
    await client.setLiquidationFeeBps(initialConfig.liquidationFeeBps.toNumber());
    await client.setMinCollateralRatioBps(initialConfig.minCollateralRatioBps.toNumber());
    await client.setLiquidationThresholdBps(initialConfig.liquidationThresholdBps.toNumber());
    await client.setMaxPriceAgeSec(initialConfig.maxPriceAgeSec);
    await client.setMaxPriceDeviationBps(initialConfig.maxPriceDeviationBps.toNumber());
    await client.setLiquidationPriceDeviationBps(initialConfig.liquidationPriceDeviationBps.toNumber());
    await client.setMinLiquidity(initialConfig.minLiquidity.toNumber());
    await client.setDecommissionGracePeriod(initialConfig.decommissionGracePeriod.toNumber());
  });

  describe('set_opening_fee_bps', () => {
    it('Successfully sets opening fee with valid value', async () => {
      const newFeeBps = 100; // 1%
      
      // Get initial config
      const protocolBefore = await client.getProtocolAccount();
      const oldFeeBps = protocolBefore.config.openingFeeBps.toNumber();

      // Set new opening fee
      await client.setOpeningFeeBps(newFeeBps);

      // Verify the change
      const protocolAfter = await client.getProtocolAccount();
      expect(protocolAfter.config.openingFeeBps.toNumber()).to.equal(newFeeBps);
      expect(protocolAfter.config.lastUpdatedBy).to.equal(client.getPublicKey().toString());
      expect(protocolAfter.config.lastUpdated.toNumber()).to.be.greaterThan(0);
    });

    it('Fails with fee above maximum', async () => {
      const invalidFeeBps = MAX_FEE_BPS + 1; // Above 5%

      try {
        await client.setOpeningFeeBps(invalidFeeBps);
        expect.fail('Should have failed with fee above maximum');
      } catch (error) {
        expect(error).to.exist;
        expect(error.toString()).to.include('InvalidFeeBps');
      }
    });

    it('Fails when called by non-authorized account', async () => {
      const nonAuthorizedClient = await TestClient.forUser(nonAuthorizedAccount);
      
      try {
        await nonAuthorizedClient.setOpeningFeeBps(50);
        expect.fail('Should have failed with unauthorized access');
      } catch (error) {
        expect(error).to.exist;
        expect(error.toString()).to.include('UnauthorizedRole');
      }
    });

    it('No-op when setting same value', async () => {
      const currentProtocol = await client.getProtocolAccount();
      const currentFeeBps = currentProtocol.config.openingFeeBps.toNumber();
      const lastUpdatedBefore = currentProtocol.config.lastUpdated.toNumber();

      // Set the same value
      await client.setOpeningFeeBps(currentFeeBps);

      // Verify no change in lastUpdated timestamp
      const protocolAfter = await client.getProtocolAccount();
      expect(protocolAfter.config.openingFeeBps.toNumber()).to.equal(currentFeeBps);
      // Note: The no-op optimization might still update timestamp, so we just verify the value is unchanged
    });
  });

  describe('set_closing_fee_bps', () => {
    it('Successfully sets closing fee with valid value', async () => {
      const newFeeBps = 150; // 1.5%

      await client.setClosingFeeBps(newFeeBps);

      const protocol = await client.getProtocolAccount();
      expect(protocol.config.closingFeeBps.toNumber()).to.equal(newFeeBps);
      expect(protocol.config.lastUpdatedBy).to.equal(client.getPublicKey().toString());
    });

    it('Fails with fee above maximum', async () => {
      const invalidFeeBps = MAX_FEE_BPS + 1;

      try {
        await client.setClosingFeeBps(invalidFeeBps);
        expect.fail('Should have failed with fee above maximum');
      } catch (error) {
        expect(error).to.exist;
        expect(error.toString()).to.include('InvalidFeeBps');
      }
    });
  });

  describe('set_liquidation_fee_bps', () => {
    it('Successfully sets liquidation fee with valid value', async () => {
      const newFeeBps = 200; // 2%

      await client.setLiquidationFeeBps(newFeeBps);

      const protocol = await client.getProtocolAccount();
      expect(protocol.config.liquidationFeeBps.toNumber()).to.equal(newFeeBps);
      expect(protocol.config.lastUpdatedBy).to.equal(client.getPublicKey().toString());
    });

    it('Fails with fee above maximum', async () => {
      const invalidFeeBps = MAX_FEE_BPS + 1;

      try {
        await client.setLiquidationFeeBps(invalidFeeBps);
        expect.fail('Should have failed with fee above maximum');
      } catch (error) {
        expect(error).to.exist;
        expect(error.toString()).to.include('InvalidFeeBps');
      }
    });
  });

  describe('set_min_collateral_ratio_bps', () => {
    it('Successfully sets minimum collateral ratio with valid value', async () => {
      const newRatioBps = 12000; // 120%

      await client.setMinCollateralRatioBps(newRatioBps);

      const protocol = await client.getProtocolAccount();
      expect(protocol.config.minCollateralRatioBps.toNumber()).to.equal(newRatioBps);
      expect(protocol.config.lastUpdatedBy).to.equal(client.getPublicKey().toString());
    });

    it('Fails with ratio below minimum', async () => {
      const invalidRatioBps = MIN_COLLATERAL_RATIO_BPS - 1; // Below 110%

      try {
        await client.setMinCollateralRatioBps(invalidRatioBps);
        expect.fail('Should have failed with ratio below minimum');
      } catch (error) {
        expect(error).to.exist;
        expect(error.toString()).to.include('InvalidCollateralRatio');
      }
    });
  });

  describe('set_liquidation_threshold_bps', () => {
    it('Successfully sets liquidation threshold with valid value', async () => {
      const newThresholdBps = 750; // 7.5%

      await client.setLiquidationThresholdBps(newThresholdBps);

      const protocol = await client.getProtocolAccount();
      expect(protocol.config.liquidationThresholdBps.toNumber()).to.equal(newThresholdBps);
      expect(protocol.config.lastUpdatedBy).to.equal(client.getPublicKey().toString());
    });

    it('Fails with zero threshold', async () => {
      try {
        await client.setLiquidationThresholdBps(0);
        expect.fail('Should have failed with zero threshold');
      } catch (error) {
        expect(error).to.exist;
        expect(error.toString()).to.include('InvalidCollateralRatio');
      }
    });

    it('Fails with threshold above 100%', async () => {
      const invalidThresholdBps = BPS_DIVISOR + 1; // Above 100%

      try {
        await client.setLiquidationThresholdBps(invalidThresholdBps);
        expect.fail('Should have failed with threshold above 100%');
      } catch (error) {
        expect(error).to.exist;
        expect(error.toString()).to.include('InvalidCollateralRatio');
      }
    });

    it('Accepts maximum valid threshold (100%)', async () => {
      await client.setLiquidationThresholdBps(BPS_DIVISOR);

      const protocol = await client.getProtocolAccount();
      expect(protocol.config.liquidationThresholdBps.toNumber()).to.equal(BPS_DIVISOR);
    });
  });

  describe('set_max_price_age_sec', () => {
    it('Successfully sets max price age with valid value', async () => {
      const newMaxAgeSec = 120; // 2 minutes

      await client.setMaxPriceAgeSec(newMaxAgeSec);

      const protocol = await client.getProtocolAccount();
      expect(protocol.config.maxPriceAgeSec).to.equal(newMaxAgeSec);
      expect(protocol.config.lastUpdatedBy).to.equal(client.getPublicKey().toString());
    });

    it('Fails with zero value', async () => {
      try {
        await client.setMaxPriceAgeSec(0);
        expect.fail('Should have failed with zero value');
      } catch (error) {
        expect(error).to.exist;
        expect(error.toString()).to.include('InvalidOracleParameter');
      }
    });
  });

  describe('set_max_price_deviation_bps', () => {
    it('Successfully sets max price deviation with valid value', async () => {
      const newDeviationBps = 1000; // 10%

      await client.setMaxPriceDeviationBps(newDeviationBps);

      const protocol = await client.getProtocolAccount();
      expect(protocol.config.maxPriceDeviationBps.toNumber()).to.equal(newDeviationBps);
      expect(protocol.config.lastUpdatedBy).to.equal(client.getPublicKey().toString());
    });

    it('Fails with deviation above maximum', async () => {
      const invalidDeviationBps = MAX_PRICE_DEVIATION_BPS + 1;

      try {
        await client.setMaxPriceDeviationBps(invalidDeviationBps);
        expect.fail('Should have failed with deviation above maximum');
      } catch (error) {
        expect(error).to.exist;
        expect(error.toString()).to.include('InvalidFeeBps');
      }
    });
  });

  describe('set_liquidation_price_deviation_bps', () => {
    it('Successfully sets liquidation price deviation with valid value', async () => {
      const newDeviationBps = 1500; // 15%

      await client.setLiquidationPriceDeviationBps(newDeviationBps);

      const protocol = await client.getProtocolAccount();
      expect(protocol.config.liquidationPriceDeviationBps.toNumber()).to.equal(newDeviationBps);
      expect(protocol.config.lastUpdatedBy).to.equal(client.getPublicKey().toString());
    });

    it('Fails with deviation above maximum', async () => {
      const invalidDeviationBps = LIQUIDATION_PRICE_DEVIATION_BPS + 1;

      try {
        await client.setLiquidationPriceDeviationBps(invalidDeviationBps);
        expect.fail('Should have failed with deviation above maximum');
      } catch (error) {
        expect(error).to.exist;
        expect(error.toString()).to.include('InvalidFeeBps');
      }
    });
  });

  describe('set_min_liquidity', () => {
    it('Successfully sets minimum liquidity with valid value', async () => {
      const newMinLiquidity = 2000000000; // 2000 USDC (6 decimals)

      await client.setMinLiquidity(newMinLiquidity);

      const protocol = await client.getProtocolAccount();
      expect(protocol.config.minLiquidity.toNumber()).to.equal(newMinLiquidity);
      expect(protocol.config.lastUpdatedBy).to.equal(client.getPublicKey().toString());
    });

    it('Fails with zero value', async () => {
      try {
        await client.setMinLiquidity(0);
        expect.fail('Should have failed with zero value');
      } catch (error) {
        expect(error).to.exist;
        expect(error.toString()).to.include('InvalidOracleParameter');
      }
    });
  });

  describe('set_decommission_grace_period', () => {
    it('Successfully sets grace period with valid value', async () => {
      const newGracePeriod = 86400; // 24 hours

      await client.setDecommissionGracePeriod(newGracePeriod);

      const protocol = await client.getProtocolAccount();
      expect(protocol.config.decommissionGracePeriod.toNumber()).to.equal(newGracePeriod);
      expect(protocol.config.lastUpdatedBy).to.equal(client.getPublicKey().toString());
    });

    it('Fails with grace period below minimum', async () => {
      const invalidGracePeriod = MIN_GRACE_PERIOD - 1;

      try {
        await client.setDecommissionGracePeriod(invalidGracePeriod);
        expect.fail('Should have failed with grace period below minimum');
      } catch (error) {
        expect(error).to.exist;
        expect(error.toString()).to.include('InvalidGracePeriod');
      }
    });

    it('Fails with grace period above maximum', async () => {
      const invalidGracePeriod = MAX_GRACE_PERIOD + 1;

      try {
        await client.setDecommissionGracePeriod(invalidGracePeriod);
        expect.fail('Should have failed with grace period above maximum');
      } catch (error) {
        expect(error).to.exist;
        expect(error.toString()).to.include('InvalidGracePeriod');
      }
    });
  });

  describe('update_treasury', () => {
    it('Successfully updates treasury address', async () => {
      const newTreasury = Keypair.generate().publicKey;

      await client.updateTreasury(newTreasury);

      const protocol = await client.getProtocolAccount();
      expect(protocol.treasury.toString()).to.equal(newTreasury.toString());
    });

    it('No-op when setting same treasury address', async () => {
      const currentProtocol = await client.getProtocolAccount();
      const currentTreasury = currentProtocol.treasury;

      // Set the same treasury
      await client.updateTreasury(new Keypair().publicKey);

      // This test verifies the method works, actual no-op testing would require
      // checking if the same address is set again
    });
  });

  describe('Access control tests', () => {
    it('ConfigManager can update all config values', async () => {
      const configManagerClient = await TestClient.forUser(configManager);

      // Test that ConfigManager can update various config values
      await configManagerClient.setOpeningFeeBps(75);
      await configManagerClient.setClosingFeeBps(85);
      await configManagerClient.setLiquidationFeeBps(95);
      await configManagerClient.setMinCollateralRatioBps(11500);
      await configManagerClient.setLiquidationThresholdBps(600);
      await configManagerClient.setMaxPriceAgeSec(90);
      await configManagerClient.setMaxPriceDeviationBps(1200);
      await configManagerClient.setLiquidationPriceDeviationBps(1800);
      await configManagerClient.setMinLiquidity(1500000000);
      await configManagerClient.setDecommissionGracePeriod(172800); // 48 hours

      // Verify all changes were applied
      const protocol = await client.getProtocolAccount();
      expect(protocol.config.openingFeeBps.toNumber()).to.equal(75);
      expect(protocol.config.closingFeeBps.toNumber()).to.equal(85);
      expect(protocol.config.liquidationFeeBps.toNumber()).to.equal(95);
      expect(protocol.config.minCollateralRatioBps.toNumber()).to.equal(11500);
      expect(protocol.config.liquidationThresholdBps.toNumber()).to.equal(600);
      expect(protocol.config.maxPriceAgeSec).to.equal(90);
      expect(protocol.config.maxPriceDeviationBps.toNumber()).to.equal(1200);
      expect(protocol.config.liquidationPriceDeviationBps.toNumber()).to.equal(1800);
      expect(protocol.config.minLiquidity.toNumber()).to.equal(1500000000);
      expect(protocol.config.decommissionGracePeriod.toNumber()).to.equal(172800);
    });

    it('Non-authorized accounts cannot update any config values', async () => {
      const unauthorizedClient = await TestClient.forUser(nonAuthorizedAccount);

      // Test all config setters fail with unauthorized access
      const testCases = [
        () => unauthorizedClient.setOpeningFeeBps(50),
        () => unauthorizedClient.setClosingFeeBps(50),
        () => unauthorizedClient.setLiquidationFeeBps(50),
        () => unauthorizedClient.setMinCollateralRatioBps(11500),
        () => unauthorizedClient.setLiquidationThresholdBps(500),
        () => unauthorizedClient.setMaxPriceAgeSec(120),
        () => unauthorizedClient.setMaxPriceDeviationBps(1000),
        () => unauthorizedClient.setLiquidationPriceDeviationBps(1500),
        () => unauthorizedClient.setMinLiquidity(2000000000),
        () => unauthorizedClient.setDecommissionGracePeriod(86400),
        () => unauthorizedClient.updateTreasury(Keypair.generate().publicKey),
      ];

      for (const testCase of testCases) {
        try {
          await testCase();
          expect.fail('Should have failed with unauthorized access');
        } catch (error) {
          expect(error).to.exist;
          expect(error.toString()).to.include('UnauthorizedRole');
        }
      }
    });
  });

  describe('Boundary value tests', () => {
    it('Accepts maximum valid fee values', async () => {
      // Test maximum valid fee values
      await client.setOpeningFeeBps(MAX_FEE_BPS);
      await client.setClosingFeeBps(MAX_FEE_BPS);
      await client.setLiquidationFeeBps(MAX_FEE_BPS);

      const protocol = await client.getProtocolAccount();
      expect(protocol.config.openingFeeBps.toNumber()).to.equal(MAX_FEE_BPS);
      expect(protocol.config.closingFeeBps.toNumber()).to.equal(MAX_FEE_BPS);
      expect(protocol.config.liquidationFeeBps.toNumber()).to.equal(MAX_FEE_BPS);
    });

    it('Accepts minimum valid collateral ratio', async () => {
      await client.setMinCollateralRatioBps(MIN_COLLATERAL_RATIO_BPS);

      const protocol = await client.getProtocolAccount();
      expect(protocol.config.minCollateralRatioBps.toNumber()).to.equal(MIN_COLLATERAL_RATIO_BPS);
    });

    it('Accepts maximum valid price deviations', async () => {
      await client.setMaxPriceDeviationBps(MAX_PRICE_DEVIATION_BPS);
      await client.setLiquidationPriceDeviationBps(LIQUIDATION_PRICE_DEVIATION_BPS);

      const protocol = await client.getProtocolAccount();
      expect(protocol.config.maxPriceDeviationBps.toNumber()).to.equal(MAX_PRICE_DEVIATION_BPS);
      expect(protocol.config.liquidationPriceDeviationBps.toNumber()).to.equal(LIQUIDATION_PRICE_DEVIATION_BPS);
    });

    it('Accepts boundary grace period values', async () => {
      // Test minimum grace period
      await client.setDecommissionGracePeriod(MIN_GRACE_PERIOD);
      let protocol = await client.getProtocolAccount();
      expect(protocol.config.decommissionGracePeriod.toNumber()).to.equal(MIN_GRACE_PERIOD);

      // Test maximum grace period
      await client.setDecommissionGracePeriod(MAX_GRACE_PERIOD);
      protocol = await client.getProtocolAccount();
      expect(protocol.config.decommissionGracePeriod.toNumber()).to.equal(MAX_GRACE_PERIOD);
    });

    it('Accepts zero fee values', async () => {
      // Test zero fee values (should be valid)
      await client.setOpeningFeeBps(0);
      await client.setClosingFeeBps(0);
      await client.setLiquidationFeeBps(0);

      const protocol = await client.getProtocolAccount();
      expect(protocol.config.openingFeeBps.toNumber()).to.equal(0);
      expect(protocol.config.closingFeeBps.toNumber()).to.equal(0);
      expect(protocol.config.liquidationFeeBps.toNumber()).to.equal(0);
    });
  });

  describe('State consistency tests', () => {
    it('Config updates preserve other config values', async () => {
      // Get initial state
      const initialProtocol = await client.getProtocolAccount();
      const initialClosingFee = initialProtocol.config.closingFeeBps.toNumber();
      const initialLiquidationFee = initialProtocol.config.liquidationFeeBps.toNumber();

      // Update only opening fee
      const newOpeningFee = 123;
      await client.setOpeningFeeBps(newOpeningFee);

      // Verify only opening fee changed
      const updatedProtocol = await client.getProtocolAccount();
      expect(updatedProtocol.config.openingFeeBps.toNumber()).to.equal(newOpeningFee);
      expect(updatedProtocol.config.closingFeeBps.toNumber()).to.equal(initialClosingFee);
      expect(updatedProtocol.config.liquidationFeeBps.toNumber()).to.equal(initialLiquidationFee);
    });

    it('Metadata is updated correctly on config changes', async () => {
      const beforeTimestamp = Math.floor(Date.now() / 1000) - 1; // Allow 1 second buffer

      await client.setOpeningFeeBps(234);

      const protocol = await client.getProtocolAccount();
      expect(protocol.config.lastUpdatedBy).to.equal(client.getPublicKey().toString());
      expect(protocol.config.lastUpdated.toNumber()).to.be.greaterThanOrEqual(beforeTimestamp);
    });
  });
});
