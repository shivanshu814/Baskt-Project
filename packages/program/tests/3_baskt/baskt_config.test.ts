import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';
// Using TestClient static method instead of importing from test-setup
import { AccessControlRole } from '@baskt/types';
import { BN } from 'bn.js';
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';
import { MIN_COLLATERAL_RATIO_BPS } from '../utils/test-constants';

describe('baskt config setters', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Create test accounts
  const configManager = Keypair.generate();
  const basktCreator = Keypair.generate();
  const nonAuthorizedAccount = Keypair.generate();

  // Create client instances for each user
  let configManagerClient: TestClient;
  let basktCreatorClient: TestClient;
  let nonAuthorizedClient: TestClient;

  // Constants for testing (from constants.rs)
  const MAX_FEE_BPS = 500; // 5% maximum fee
  const BPS_DIVISOR = 10000; // 100% in basis points

  // Test baskts
  let publicBasktPDA: PublicKey;
  let privateBasktPDA: PublicKey;
  let publicBasktName = 'test-public-baskt';
  let privateBasktName = 'test-private-baskt';

  before(async () => {
    // Initialize protocol and roles
    await TestClient.initializeProtocolAndRoles(client);

    // Add ConfigManager role
    await client.addRole(configManager.publicKey, AccessControlRole.ConfigManager);

    // Fund test accounts
    await client.connection.requestAirdrop(configManager.publicKey, 2e9);
    await client.connection.requestAirdrop(basktCreator.publicKey, 2e9);
    await client.connection.requestAirdrop(nonAuthorizedAccount.publicKey, 2e9);
    await client.waitForBlocks(2);

    // Create assets for baskts
    const btcAsset = await client.addAsset('BTC', { allowLongs: true, allowShorts: true });
    const ethAsset = await client.addAsset('ETH', { allowLongs: true, allowShorts: true });

    // Create asset configs for public baskt
    const publicBasktAssets = [
      {
        assetId: btcAsset.assetAddress,
        direction: true,
        weight: new BN(6000), // 60% BTC
        baselinePrice: new BN(0),
      },
      {
        assetId: ethAsset.assetAddress,
        direction: true,
        weight: new BN(4000), // 40% ETH
        baselinePrice: new BN(0),
      },
    ];

    // Create asset configs for private baskt
    const privateBasktAssets = [
      {
        assetId: btcAsset.assetAddress,
        direction: true,
        weight: new BN(5000), // 50% BTC
        baselinePrice: new BN(0),
      },
      {
        assetId: ethAsset.assetAddress,
        direction: false,
        weight: new BN(5000), // 50% ETH short
        baselinePrice: new BN(0),
      },
    ];

    // Create client instances for each user
    configManagerClient = await TestClient.forUser(configManager);
    basktCreatorClient = await TestClient.forUser(basktCreator);
    nonAuthorizedClient = await TestClient.forUser(nonAuthorizedAccount);

    // Create public baskt using baskt creator client
    const { basktId: publicBasktId } = await basktCreatorClient.createBaskt(
      publicBasktName,
      publicBasktAssets,
      true, // is_public
    );
    publicBasktPDA = publicBasktId;

    // Create private baskt using baskt creator client
    const { basktId: privateBasktId } = await basktCreatorClient.createBaskt(
      privateBasktName,
      privateBasktAssets,
      false, // is_public
    );
    privateBasktPDA = privateBasktId;
  });

  after(async () => {
    // Clean up ConfigManager role added during tests
    try {
      const removeConfigManagerSig = await client.removeRole(
        configManager.publicKey,
        AccessControlRole.ConfigManager
      );
      await waitForTx(client.connection, removeConfigManagerSig);
      await waitForNextSlot(client.connection);
    } catch (error) {
      // Silently handle cleanup errors to avoid masking test failures
      console.warn('Cleanup error in baskt_config.test.ts:', error);
    }
  });

  describe('set_baskt_opening_fee_bps', () => {
    it('Successfully sets opening fee with valid value by ConfigManager', async () => {
      const newFeeBps = 100; // 1%

      // Set as ConfigManager
      await configManagerClient.setBasktOpeningFeeBps(publicBasktPDA, newFeeBps);

      // Verify the change
      const baskt = await client.getBaskt(publicBasktName);
      expect(baskt.config.openingFeeBps?.toNumber()).to.equal(newFeeBps);
    });

    it('Successfully sets opening fee by baskt creator for private baskt', async () => {
      const newFeeBps = 150; // 1.5%

      // Set as baskt creator
      await basktCreatorClient.setBasktOpeningFeeBps(privateBasktPDA, newFeeBps);

      // Verify the change
      const baskt = await client.getBaskt(privateBasktName);
      expect(baskt.config.openingFeeBps?.toNumber()).to.equal(newFeeBps);
    });

    it('Successfully clears opening fee with null value', async () => {
      // Set as ConfigManager
      await configManagerClient.setBasktOpeningFeeBps(publicBasktPDA, null);

      // Verify the change
      const baskt = await client.getBaskt(publicBasktName);
      expect(baskt.config.openingFeeBps).to.be.null;
    });

    it('Fails with fee above maximum', async () => {
      const invalidFeeBps = MAX_FEE_BPS + 1; // Above 5%

      try {
        await configManagerClient.setBasktOpeningFeeBps(publicBasktPDA, invalidFeeBps);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.toString()).to.include('InvalidFeeBps');
      }
    });

    it('Fails when called by non-authorized account', async () => {
      const newFeeBps = 100;

      try {
        await nonAuthorizedClient.setBasktOpeningFeeBps(publicBasktPDA, newFeeBps);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.toString()).to.include('Unauthorized');
      }
    });

    it('Fails when baskt creator tries to modify public baskt', async () => {
      const newFeeBps = 100;

      try {
        await basktCreatorClient.setBasktOpeningFeeBps(publicBasktPDA, newFeeBps);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.toString()).to.include('Unauthorized');
      }
    });
  });

  describe('set_baskt_closing_fee_bps', () => {
    it('Successfully sets closing fee with valid value', async () => {
      const newFeeBps = 80; // 0.8%

      await configManagerClient.setBasktClosingFeeBps(publicBasktPDA, newFeeBps);

      const baskt = await client.getBaskt(publicBasktName);
      expect(baskt.config.closingFeeBps?.toNumber()).to.equal(newFeeBps);
    });

    it('Fails with fee above maximum', async () => {
      const invalidFeeBps = MAX_FEE_BPS + 1;

      try {
        await configManagerClient.setBasktClosingFeeBps(publicBasktPDA, invalidFeeBps);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.toString()).to.include('InvalidFeeBps');
      }
    });
  });

  describe('set_baskt_liquidation_fee_bps', () => {
    it('Successfully sets liquidation fee with valid value', async () => {
      const newFeeBps = 200; // 2%

      await configManagerClient.setBasktLiquidationFeeBps(publicBasktPDA, newFeeBps);

      const baskt = await client.getBaskt(publicBasktName);
      expect(baskt.config.liquidationFeeBps?.toNumber()).to.equal(newFeeBps);
    });

    it('Fails with fee above maximum', async () => {
      const invalidFeeBps = MAX_FEE_BPS + 1;

      try {
        await configManagerClient.setBasktLiquidationFeeBps(publicBasktPDA, invalidFeeBps);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.toString()).to.include('InvalidFeeBps');
      }
    });
  });

  describe('set_baskt_min_collateral_ratio_bps', () => {
    it('Successfully sets minimum collateral ratio with valid value', async () => {
      const newRatioBps = 12000; // 120%

      await configManagerClient.setBasktMinCollateralRatioBps(publicBasktPDA, newRatioBps);

      const baskt = await client.getBaskt(publicBasktName);
      expect(baskt.config.minCollateralRatioBps?.toNumber()).to.equal(newRatioBps);
    });

    it('Fails with ratio below minimum', async () => {
      const invalidRatioBps = MIN_COLLATERAL_RATIO_BPS - 1;

      try {
        await configManagerClient.setBasktMinCollateralRatioBps(publicBasktPDA, invalidRatioBps);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.toString()).to.include('InvalidCollateralRatio');
      }
    });
  });

  describe('set_baskt_liquidation_threshold_bps', () => {
    it('Successfully sets liquidation threshold with valid value', async () => {
      const newThresholdBps = 9000; // 90%

      await configManagerClient.setBasktLiquidationThresholdBps(publicBasktPDA, newThresholdBps);

      const baskt = await client.getBaskt(publicBasktName);
      expect(baskt.config.liquidationThresholdBps?.toNumber()).to.equal(newThresholdBps);
    });

    it('Fails with zero threshold', async () => {
      try {
        await configManagerClient.setBasktLiquidationThresholdBps(publicBasktPDA, 0);
        expect.fail('Should have thrown error');
      } catch (error) {
        console.log('Actual error:', error.toString());
        expect(error.toString()).to.include('InvalidCollateralRatio');
      }
    });

    it('Fails with threshold above 100%', async () => {
      const invalidThresholdBps = BPS_DIVISOR + 1; // Above 100%

      try {
        await configManagerClient.setBasktLiquidationThresholdBps(publicBasktPDA, invalidThresholdBps);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.toString()).to.include('InvalidCollateralRatio');
      }
    });
  });

  describe('update_baskt_config - bulk update', () => {
    it('Successfully updates multiple config values at once', async () => {
      const newConfig = {
        openingFeeBps: 120,
        closingFeeBps: 90,
        liquidationFeeBps: 250,
        minCollateralRatioBps: 11500,
        liquidationThresholdBps: 8500,
      };

      await configManagerClient.updateBasktConfig(publicBasktPDA, newConfig);

      const baskt = await client.getBaskt(publicBasktName);
      expect(baskt.config.openingFeeBps?.toNumber()).to.equal(newConfig.openingFeeBps);
      expect(baskt.config.closingFeeBps?.toNumber()).to.equal(newConfig.closingFeeBps);
      expect(baskt.config.liquidationFeeBps?.toNumber()).to.equal(newConfig.liquidationFeeBps);
      expect(baskt.config.minCollateralRatioBps?.toNumber()).to.equal(newConfig.minCollateralRatioBps);
      expect(baskt.config.liquidationThresholdBps?.toNumber()).to.equal(newConfig.liquidationThresholdBps);
    });

    it('Successfully updates partial config values', async () => {
      // First set initial values to ensure test isolation
      await configManagerClient.updateBasktConfig(publicBasktPDA, {
        openingFeeBps: 120,
        closingFeeBps: 90,
        liquidationFeeBps: 250,
      });

      const partialConfig = {
        openingFeeBps: 140,
        liquidationFeeBps: 300,
      };

      await configManagerClient.updateBasktConfig(publicBasktPDA, partialConfig);

      const baskt = await client.getBaskt(publicBasktName);
      expect(baskt.config.openingFeeBps?.toNumber()).to.equal(partialConfig.openingFeeBps);
      expect(baskt.config.liquidationFeeBps?.toNumber()).to.equal(partialConfig.liquidationFeeBps);
      // Other values should remain unchanged from initial setup
      expect(baskt.config.closingFeeBps?.toNumber()).to.equal(90);
    });

    it('Fails with invalid config combination', async () => {
      const invalidConfig = {
        minCollateralRatioBps: 8000, // 80%
        liquidationThresholdBps: 9000, // 90% - should be less than min collateral ratio
      };

      try {
        await configManagerClient.updateBasktConfig(publicBasktPDA, invalidConfig);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.toString()).to.include('InvalidCollateralRatio');
      }
    });
  });

  describe('Access control comprehensive tests', () => {
    it('ConfigManager can modify any baskt config', async () => {
      // Test on public baskt
      await configManagerClient.setBasktOpeningFeeBps(publicBasktPDA, 110);
      let baskt = await client.getBaskt(publicBasktName);
      expect(baskt.config.openingFeeBps?.toNumber()).to.equal(110);

      // Test on private baskt
      await configManagerClient.setBasktOpeningFeeBps(privateBasktPDA, 130);
      baskt = await client.getBaskt(privateBasktName);
      expect(baskt.config.openingFeeBps?.toNumber()).to.equal(130);
    });

    it('Baskt creator can only modify their own private baskt', async () => {
      // Should succeed on own private baskt
      await basktCreatorClient.setBasktClosingFeeBps(privateBasktPDA, 95);
      let baskt = await client.getBaskt(privateBasktName);
      expect(baskt.config.closingFeeBps?.toNumber()).to.equal(95);

      // Should fail on public baskt (even if created by them)
      try {
        await basktCreatorClient.setBasktClosingFeeBps(publicBasktPDA, 95);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.toString()).to.include('Unauthorized');
      }
    });

    it('Random user cannot modify any baskt config', async () => {
      // Should fail on public baskt
      try {
        await nonAuthorizedClient.setBasktOpeningFeeBps(publicBasktPDA, 100);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.toString()).to.include('Unauthorized');
      }

      // Should fail on private baskt
      try {
        await nonAuthorizedClient.setBasktOpeningFeeBps(privateBasktPDA, 100);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.toString()).to.include('Unauthorized');
      }
    });
  });

  describe('Configuration validation tests', () => {
    it('Accepts maximum valid fee values', async () => {
      await configManagerClient.updateBasktConfig(publicBasktPDA, {
        openingFeeBps: MAX_FEE_BPS,
        closingFeeBps: MAX_FEE_BPS,
        liquidationFeeBps: MAX_FEE_BPS,
      });

      const baskt = await client.getBaskt(publicBasktName);
      expect(baskt.config.openingFeeBps?.toNumber()).to.equal(MAX_FEE_BPS);
      expect(baskt.config.closingFeeBps?.toNumber()).to.equal(MAX_FEE_BPS);
      expect(baskt.config.liquidationFeeBps?.toNumber()).to.equal(MAX_FEE_BPS);
    });

    it('Accepts minimum valid collateral ratio', async () => {
      await configManagerClient.setBasktMinCollateralRatioBps(publicBasktPDA, MIN_COLLATERAL_RATIO_BPS);

      const baskt = await client.getBaskt(publicBasktName);
      expect(baskt.config.minCollateralRatioBps?.toNumber()).to.equal(MIN_COLLATERAL_RATIO_BPS);
    });

    it('Accepts zero fee values (clears override)', async () => {
      await configManagerClient.updateBasktConfig(publicBasktPDA, {
        openingFeeBps: null,
        closingFeeBps: null,
        liquidationFeeBps: null,
      });

      const baskt = await client.getBaskt(publicBasktName);
      expect(baskt.config.openingFeeBps).to.be.null;
      expect(baskt.config.closingFeeBps).to.be.null;
      expect(baskt.config.liquidationFeeBps).to.be.null;
    });
  });

  describe('No-op and state consistency tests', () => {
    it('No-op when setting same value', async () => {
      // Set a value first
      await configManagerClient.setBasktOpeningFeeBps(publicBasktPDA, 160);
      const basktBefore = await client.getBaskt(publicBasktName);

      // Set the same value again
      await configManagerClient.setBasktOpeningFeeBps(publicBasktPDA, 160);
      const basktAfter = await client.getBaskt(publicBasktName);

      // Should be exactly the same
      expect(basktAfter.config.openingFeeBps?.toNumber()).to.equal(basktBefore.config.openingFeeBps?.toNumber());
    });

    it('Config updates preserve other config values', async () => {
      // Set initial values
      await configManagerClient.updateBasktConfig(publicBasktPDA, {
        openingFeeBps: 100,
        closingFeeBps: 80,
        liquidationFeeBps: 200,
      });

      // Update only one value
      await configManagerClient.setBasktMinCollateralRatioBps(publicBasktPDA, 12000);

      // Verify others are preserved
      const baskt = await client.getBaskt(publicBasktName);
      expect(baskt.config.openingFeeBps?.toNumber()).to.equal(100);
      expect(baskt.config.closingFeeBps?.toNumber()).to.equal(80);
      expect(baskt.config.liquidationFeeBps?.toNumber()).to.equal(200);
      expect(baskt.config.minCollateralRatioBps?.toNumber()).to.equal(12000);
    });
  });
});
