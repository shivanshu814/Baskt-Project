import { expect } from 'chai';
import { describe, it, before, beforeEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';
import { BN } from '@coral-xyz/anchor';
import { AccessControlRole } from '@baskt/sdk';

// Define AssetPermissions type locally since it's not exported from SDK
type AssetPermissions = {
  allowLongs: boolean;
  allowShorts: boolean;
};

type AssetId = {
  assetAddress: PublicKey;
  ticker: string;
  oracle: PublicKey;
  txSignature: string | null;
};

describe('baskt', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Asset IDs that will be used across tests
  let btcAssetId: AssetId;
  let ethAssetId: AssetId;
  let dogeAssetId: AssetId;
  let longOnlyAssetId: AssetId;
  let shortOnlyAssetId: AssetId;

  // Set up test roles and assets before running tests
  before(async () => {
    // Create assets that will be used across tests
    btcAssetId = await client.createAssetWithCustomOracle('BTC', 50000);
    ethAssetId = await client.createAssetWithCustomOracle('ETH', 3000);
    dogeAssetId = await client.createAssetWithCustomOracle('DOGE', 100);

    // Create assets with specific permissions
    const longOnlyPermissions: AssetPermissions = {
      allowLongs: true,
      allowShorts: false,
    };
    longOnlyAssetId = await client.createAssetWithCustomOracle(
      'LONG_ONLY',
      200,
      -6,
      longOnlyPermissions,
    );

    const shortOnlyPermissions: AssetPermissions = {
      allowLongs: false,
      allowShorts: true,
    };
    shortOnlyAssetId = await client.createAssetWithCustomOracle(
      'SHORT_ONLY',
      300,
      -6,
      shortOnlyPermissions,
    );
  });

  it('Successfully creates a new baskt with valid asset configs', async () => {
    // Create asset configs for the baskt
    const assets = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
        direction: true,
        weight: 6000, // 60% BTC
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
        direction: true,
        weight: 4000, // 40% ETH
      },
    ];

    // Create the baskt
    const { basktId, txSignature } = await client.createBaskt(
      'TestBaskt',
      assets,
      true, // is_public
    );

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBaskt(basktId);

    const oracleAccount = await client.getOracleAccount(ethAssetId.oracle);

    // Verify the baskt was initialized with correct values
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.isPublic).to.be.true;
    expect(basktAccount.creator.toString()).to.equal(client.wallet.publicKey.toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(2);

    // Verify asset configs
    const btcConfig = basktAccount.currentAssetConfigs.find(
      (config) => config.assetId.toString() === btcAssetId.assetAddress.toString(),
    );
    expect(btcConfig?.weight.toNumber()).to.equal(6000);
    expect(btcConfig?.direction).to.be.true;
    expect(btcConfig?.baselinePrice.toNumber()).to.equal(50000 * 1e6);
    expect(btcConfig?.assetId.toString()).to.equal(btcAssetId.assetAddress.toString());

    const ethConfig = basktAccount.currentAssetConfigs.find(
      (config) => config.assetId.toString() === ethAssetId.assetAddress.toString(),
    );
    expect(ethConfig?.weight.toNumber()).to.equal(4000);
    expect(ethConfig?.direction).to.be.true;
    expect(ethConfig?.baselinePrice.toNumber()).to.equal(3000 * 1e6);
    expect(ethConfig?.assetId.toString()).to.equal(ethAssetId.assetAddress.toString());
  });

  it('Fails to create a baskt with invalid total weight', async () => {
    // Create asset configs with invalid total weight (not 100%)
    const assets = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
        direction: true,
        weight: 6000, // 60% BTC
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
        direction: true,
        weight: 5000, // 50% ETH (total 110%)
      },
    ];

    // Attempt to create the baskt - should fail
    try {
      await client.createBaskt('BadBaskt', assets, true);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('InvalidBasktConfig');
    }
  });

  it('Successfully creates a private baskt', async () => {
    // Create asset config for the baskt
    const assets = [
      {
        asset: dogeAssetId.assetAddress,
        oracle: dogeAssetId.oracle,
        direction: true,
        weight: 10000, // 100% DOGE
      },
    ];

    // Create the private baskt
    const { basktId } = await client.createBaskt(
      'PrivBaskt',
      assets,
      false, // is_public
    );

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBaskt(basktId);

    // Verify the baskt was initialized with correct values
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.isPublic).to.be.false;
    expect(basktAccount.creator.toString()).to.equal(client.wallet.publicKey.toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(1);

    // Verify asset config
    const dogeConfig = basktAccount.currentAssetConfigs[0];
    expect(dogeConfig.assetId.toString()).to.equal(dogeAssetId.assetAddress.toString());
    expect(dogeConfig.weight.toNumber()).to.equal(10000);
  });

  it('Fails to create a baskt when baskt creation is disabled', async () => {
    // Disable baskt creation feature
    await client.updateFeatureFlags({
      allowAddLiquidity: true,
      allowRemoveLiquidity: true,
      allowOpenPosition: true,
      allowClosePosition: true,
      allowPnlWithdrawal: true,
      allowCollateralWithdrawal: true,
      allowBasktCreation: false, // Disable baskt creation
      allowBasktUpdate: true,
      allowTrading: true,
      allowLiquidations: true,
    });

    // Create asset configs for the baskt
    const assets = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
        direction: true,
        weight: 10000, // 100% BTC
      },
    ];

    // Attempt to create the baskt - should fail
    try {
      await client.createBaskt('DisabledBaskt', assets, true);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('FeatureDisabled');
    }

    // Re-enable baskt creation for subsequent tests
    await client.updateFeatureFlags({
      allowAddLiquidity: true,
      allowRemoveLiquidity: true,
      allowOpenPosition: true,
      allowClosePosition: true,
      allowPnlWithdrawal: true,
      allowCollateralWithdrawal: true,
      allowBasktCreation: true, // Re-enable baskt creation
      allowBasktUpdate: true,
      allowTrading: true,
      allowLiquidations: true,
    });
  });

  it('Successfully creates a baskt with multiple assets', async () => {
    // Create asset configs for the baskt
    const assets = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
        direction: true,
        weight: 5000, // 50% BTC
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
        direction: true,
        weight: 3000, // 30% ETH
      },
      {
        asset: dogeAssetId.assetAddress,
        oracle: dogeAssetId.oracle,
        direction: true,
        weight: 2000, // 20% DOGE
      },
    ];

    // Create the baskt
    const { basktId } = await client.createBaskt(
      'MultiBaskt',
      assets,
      true, // is_public
    );

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBaskt(basktId);

    // Verify the baskt was initialized with correct values
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.isPublic).to.be.true;
    expect(basktAccount.creator.toString()).to.equal(client.wallet.publicKey.toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(3);

    // Verify all asset configs
    const btcConfig = basktAccount.currentAssetConfigs.find(
      (config) => config.assetId.toString() === btcAssetId.assetAddress.toString(),
    );
    expect(btcConfig?.weight.toNumber()).to.equal(5000);

    const ethConfig = basktAccount.currentAssetConfigs.find(
      (config) => config.assetId.toString() === ethAssetId.assetAddress.toString(),
    );
    expect(ethConfig?.weight.toNumber()).to.equal(3000);

    const dogeConfig = basktAccount.currentAssetConfigs.find(
      (config) => config.assetId.toString() === dogeAssetId.assetAddress.toString(),
    );
    expect(dogeConfig?.weight.toNumber()).to.equal(2000);
  });

  it('Successfully creates a baskt with long-only assets with long direction', async () => {
    // Create asset configs for the baskt with long-only asset in long direction
    const assets = [
      {
        asset: longOnlyAssetId.assetAddress,
        oracle: longOnlyAssetId.oracle,
        direction: true, // Long direction (allowed)
        weight: 10000, // 100%
      },
    ];

    // Create the baskt - should succeed
    const { basktId } = await client.createBaskt(
      'LongBaskt',
      assets,
      true, // is_public
    );

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBaskt(basktId);

    // Verify the baskt was initialized with correct values
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(1);

    // Verify asset config
    const assetConfig = basktAccount.currentAssetConfigs[0];
    expect(assetConfig.assetId.toString()).to.equal(longOnlyAssetId.assetAddress.toString());
    expect(assetConfig.direction).to.be.true; // Long direction
  });

  it('Successfully creates a baskt with short-only assets with short direction', async () => {
    // Create asset configs for the baskt with short-only asset in short direction
    const assets = [
      {
        asset: shortOnlyAssetId.assetAddress,
        oracle: shortOnlyAssetId.oracle,
        direction: false, // Short direction (allowed)
        weight: 10000, // 100%
      },
    ];

    // Create the baskt - should succeed
    const { basktId } = await client.createBaskt(
      'ShortBaskt',
      assets,
      true, // is_public
    );

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBaskt(basktId);

    // Verify the baskt was initialized with correct values
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(1);

    // Verify asset config
    const assetConfig = basktAccount.currentAssetConfigs[0];
    expect(assetConfig.assetId.toString()).to.equal(shortOnlyAssetId.assetAddress.toString());
    expect(assetConfig.direction).to.be.false; // Short direction
  });

  it('Fails to create a baskt with long-only assets in short direction', async () => {
    // Create asset configs for the baskt with long-only asset in short direction
    const assets = [
      {
        asset: longOnlyAssetId.assetAddress,
        oracle: longOnlyAssetId.oracle,
        direction: false, // Short direction (not allowed)
        weight: 10000, // 100%
      },
    ];

    // Attempt to create the baskt - should fail
    try {
      await client.createBaskt('InvalidBaskt1', assets, true);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('ShortPositionsDisabled');
    }
  });

  it('Fails to create a baskt with short-only assets in long direction', async () => {
    // Create asset configs for the baskt with short-only asset in long direction
    const assets = [
      {
        asset: shortOnlyAssetId.assetAddress,
        oracle: shortOnlyAssetId.oracle,
        direction: true, // Long direction (not allowed)
        weight: 10000, // 100%
      },
    ];

    // Attempt to create the baskt - should fail
    try {
      await client.createBaskt('InvalidBaskt2', assets, true);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('LongPositionsDisabled');
    }
  });

  it('Fails to create a baskt with mixed direction assets when permissions do not allow', async () => {
    // Create asset configs for the baskt with mixed permissions and directions
    const assets = [
      {
        asset: longOnlyAssetId.assetAddress,
        oracle: longOnlyAssetId.oracle,
        direction: true, // Long direction (allowed)
        weight: 5000, // 50%
      },
      {
        asset: shortOnlyAssetId.assetAddress,
        oracle: shortOnlyAssetId.oracle,
        direction: true, // Long direction (not allowed)
        weight: 5000, // 50%
      },
    ];

    // Attempt to create the baskt - should fail
    try {
      await client.createBaskt('InvalidBaskt3', assets, true);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('LongPositionsDisabled');
    }
  });
});

// Test the view functions separately
describe('baskt view functions', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Asset IDs and accounts that will be used across tests
  let btcAssetId: AssetId;
  let ethAssetId: AssetId;
  let dogeAssetId: AssetId;
  let basktId: PublicKey;

  // Set up test assets and baskt before running tests
  before(async () => {
    // Create assets that will be used across tests
    btcAssetId = await client.createAssetWithCustomOracle('BTC_VIEW', 50_000);
    ethAssetId = await client.createAssetWithCustomOracle('ETH_VIEW', 3_000);
    dogeAssetId = await client.createAssetWithCustomOracle('DOGE_VIEW', 100);

    // Create assets with weights and directions
    const assets = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
        direction: true,
        weight: 5000, // 50% BTC
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
        direction: true,
        weight: 3000, // 30% ETH
      },
      {
        asset: dogeAssetId.assetAddress,
        oracle: dogeAssetId.oracle,
        direction: true,
        weight: 2000, // 20% DOGE
      },
    ];

    // Create the baskt
    const result = await client.createBaskt(
      'ViewBaskt',
      assets,
      true, // is_public
    );

    basktId = result.basktId;
  });

  it('Successfully gets baskt NAV', async () => {
    // Prepare asset/oracle pairs
    const assetOraclePairs = [
      { asset: btcAssetId.assetAddress, oracle: btcAssetId.oracle },
      { asset: ethAssetId.assetAddress, oracle: ethAssetId.oracle },
      { asset: dogeAssetId.assetAddress, oracle: dogeAssetId.oracle },
    ];

    // Get the baskt NAV
    const nav = await client.getBasktNav(basktId, assetOraclePairs);

    const btcPrice = await client.getAssetPrice(btcAssetId.assetAddress, btcAssetId.oracle);
    const ethPrice = await client.getAssetPrice(ethAssetId.assetAddress, ethAssetId.oracle);
    const dogePrice = await client.getAssetPrice(dogeAssetId.assetAddress, dogeAssetId.oracle);

    // The NAV should be around 1.0 (or 1_000_000 in the system's precision)
    // with some potential variation due to price changes since creation
    expect(nav.toString()).to.be.eql('1000000');

    // Update BTC price (50% of the baskt) and check how it affects NAV
    const newBtcPrice = 60000; // 20% increase, properly scaled
    await client.updateOraclePrice(btcAssetId.oracle, newBtcPrice);

    const btcPrice1 = await client.getAssetPrice(btcAssetId.assetAddress, btcAssetId.oracle);
    const ethPrice1 = await client.getAssetPrice(ethAssetId.assetAddress, ethAssetId.oracle);
    const dogePrice1 = await client.getAssetPrice(dogeAssetId.assetAddress, dogeAssetId.oracle);

    // Get updated NAV
    const updatedNav = await client.getBasktNav(basktId, assetOraclePairs);

    // NAV should increase by approximately 10% (50% weight * 20% price increase)
    expect(updatedNav.toNumber()).to.be.approximately(1100000, 100000);
  });
});
