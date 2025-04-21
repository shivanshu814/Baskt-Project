import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { PublicKey } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';
import { BN } from 'bn.js';
import { OnchainAssetConfig } from '@baskt/types';

// Define AssetPermissions type locally since it's not exported from SDK
type AssetPermissions = {
  allowLongs: boolean;
  allowShorts: boolean;
};

type AssetId = {
  assetAddress: PublicKey;
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

  let commonOracle: PublicKey;

  // Set up test roles and assets before running tests
  before(async () => {
    // Create assets that will be used across tests
    btcAssetId = await client.addAsset('BTC');
    ethAssetId = await client.addAsset('ETH');
    dogeAssetId = await client.addAsset('DOGE');

    // Create assets with specific permissions
    const longOnlyPermissions: AssetPermissions = {
      allowLongs: true,
      allowShorts: false,
    };
    longOnlyAssetId = await client.addAsset('LONG_ONLY', longOnlyPermissions);

    const shortOnlyPermissions: AssetPermissions = {
      allowLongs: false,
      allowShorts: true,
    };
    shortOnlyAssetId = await client.addAsset('SHORT_ONLY', shortOnlyPermissions);

    commonOracle = (await client.createOracle('common', new BN(50000), -6, new BN(100), new BN(60)))
      .address;
  });

  it('Successfully creates a new baskt with valid asset configs', async () => {
    // Create asset configs for the baskt
    const assets = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(6000), // 60% BTC
        baselinePrice: new BN(0),
      },
      {
        assetId: ethAssetId.assetAddress,
        direction: true,
        weight: new BN(4000), // 40% ETH
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const basktName = 'TestBaskt';

    await client.waitForBlocks();

    // Create the baskt
    const { basktId } = await client.createBaskt(
      basktName,
      assets,
      true, // is_public
      client.createOracleParams(commonOracle),
    );

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBaskt(basktId);

    // Verify the baskt was initialized with correct values
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.isPublic).to.be.true;
    expect(basktAccount.creator.toString()).to.equal(client.getPublicKey().toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(2);

    // Verify asset configs
    const btcConfig = basktAccount.currentAssetConfigs.find(
      (config) => config.assetId.toString() === btcAssetId.assetAddress.toString(),
    );
    expect(btcConfig?.weight.toNumber()).to.equal(6000);
    expect(btcConfig?.direction).to.be.true;
    expect(btcConfig?.assetId.toString()).to.equal(btcAssetId.assetAddress.toString());
    expect(btcConfig?.baselinePrice.toNumber()).to.equal(0);

    const ethConfig = basktAccount.currentAssetConfigs.find(
      (config) => config.assetId.toString() === ethAssetId.assetAddress.toString(),
    );
    expect(ethConfig?.weight.toNumber()).to.equal(4000);
    expect(ethConfig?.direction).to.be.true;
    expect(ethConfig?.baselinePrice.toNumber()).to.equal(0);
    expect(ethConfig?.assetId.toString()).to.equal(ethAssetId.assetAddress.toString());
  });

  it('Fails to create a baskt with invalid total weight', async () => {
    // Create asset configs with invalid total weight (not 100%)
    const assets = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(6000), // 60% BTC
        baselinePrice: new BN(0),
      },
      {
        assetId: ethAssetId.assetAddress,
        direction: true,
        weight: new BN(5000), // 50% ETH (total 110%)
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    // Attempt to create the baskt - should fail
    try {
      await client.createBaskt('BadBaskt', assets, true, client.createOracleParams(commonOracle));
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('InvalidBasktConfig');
    }
  });

  it('Successfully creates a private baskt', async () => {
    // Create asset config for the baskt
    const assets = [
      {
        assetId: dogeAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% DOGE
        baselinePrice: new BN(0),
      },
    ];

    // Create the private baskt
    const { basktId } = await client.createBaskt(
      'PrivBaskt',
      assets,
      false, // is_public
      client.createOracleParams(commonOracle),
    );

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBaskt(basktId);

    // Verify the baskt was initialized with correct values
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.isPublic).to.be.false;
    expect(basktAccount.creator.toString()).to.equal(client.getPublicKey().toString());
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
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% BTC
        baselinePrice: new BN(0),
      },
    ];

    // Attempt to create the baskt - should fail
    try {
      await client.createBaskt(
        'DisabledBaskt',
        assets,
        true,
        client.createOracleParams(commonOracle),
      );
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
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(5000), // 50% BTC
        baselinePrice: new BN(0),
      },
      {
        assetId: ethAssetId.assetAddress,
        direction: true,
        weight: new BN(3000), // 30% ETH
        baselinePrice: new BN(0),
      },
      {
        assetId: dogeAssetId.assetAddress,
        direction: true,
        weight: new BN(2000), // 20% DOGE
        baselinePrice: new BN(0),
      },
    ];

    // Create the baskt
    const { basktId } = await client.createBaskt(
      'MultiBaskt',
      assets,
      true, // is_public
      client.createOracleParams(commonOracle),
    );

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBaskt(basktId);

    // Verify the baskt was initialized with correct values
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.isPublic).to.be.true;
    expect(basktAccount.creator.toString()).to.equal(client.getPublicKey().toString());
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
        assetId: longOnlyAssetId.assetAddress,
        direction: true, // Long direction (allowed)
        weight: new BN(10000), // 100%
        baselinePrice: new BN(0),
      },
    ];

    // Create the baskt - should succeed
    const { basktId } = await client.createBaskt(
      'LongBaskt',
      assets,
      true, // is_public
      client.createOracleParams(commonOracle),
    );

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBaskt(basktId);

    // Verify the baskt was initialized with correct values
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(1);

    // Verify asset config
    const OnchainAssetConfig = basktAccount.currentAssetConfigs[0];
    expect(OnchainAssetConfig.assetId.toString()).to.equal(longOnlyAssetId.assetAddress.toString());
    expect(OnchainAssetConfig.direction).to.be.true; // Long direction
  });

  it('Successfully creates a baskt with short-only assets with short direction', async () => {
    // Create asset configs for the baskt with short-only asset in short direction
    const assets = [
      {
        assetId: shortOnlyAssetId.assetAddress,
        direction: false, // Short direction (allowed)
        weight: new BN(10000), // 100%
        baselinePrice: new BN(0),
      },
    ];

    // Create the baskt - should succeed
    const { basktId } = await client.createBaskt(
      'ShortBaskt',
      assets,
      true, // is_public
      client.createOracleParams(commonOracle),
    );

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBaskt(basktId);

    // Verify the baskt was initialized with correct values
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(1);

    // Verify asset config
    const OnchainAssetConfig = basktAccount.currentAssetConfigs[0];
    expect(OnchainAssetConfig.assetId.toString()).to.equal(
      shortOnlyAssetId.assetAddress.toString(),
    );
    expect(OnchainAssetConfig.direction).to.be.false; // Short direction
  });

  it('Fails to create a baskt with long-only assets in short direction', async () => {
    // Create asset configs for the baskt with long-only asset in short direction
    const assets = [
      {
        assetId: longOnlyAssetId.assetAddress,
        direction: false, // Short direction (not allowed)
        weight: new BN(10000), // 100%
        baselinePrice: new BN(0),
      },
    ];

    // Attempt to create the baskt - should fail
    try {
      await client.createBaskt(
        'InvalidBaskt1',
        assets,
        true,
        client.createOracleParams(commonOracle),
      );
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('ShortPositionsDisabled');
    }
  });

  it('Fails to create a baskt with short-only assets in long direction', async () => {
    // Create asset configs for the baskt with short-only asset in long direction
    const assets = [
      {
        assetId: shortOnlyAssetId.assetAddress,
        direction: true, // Long direction (not allowed)
        weight: new BN(10000), // 100%
        baselinePrice: new BN(0),
      },
    ];

    // Attempt to create the baskt - should fail
    try {
      await client.createBaskt(
        'InvalidBaskt2',
        assets,
        true,
        client.createOracleParams(commonOracle),
      );
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('LongPositionsDisabled');
    }
  });

  it('Fails to create a baskt with mixed direction assets when permissions do not allow', async () => {
    // Create asset configs for the baskt with mixed permissions and directions
    const assets = [
      {
        assetId: longOnlyAssetId.assetAddress,
        direction: true, // Long direction (allowed)
        weight: new BN(5000), // 50%
        baselinePrice: new BN(0),
      },
      {
        assetId: shortOnlyAssetId.assetAddress,
        direction: true, // Long direction (not allowed)
        weight: new BN(5000), // 50%
        baselinePrice: new BN(0),
      },
    ];

    // Attempt to create the baskt - should fail
    try {
      await client.createBaskt(
        'InvalidBaskt3',
        assets,
        true,
        client.createOracleParams(commonOracle),
      );
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('LongPositionsDisabled');
    }
  });

  it('Adding multiple assets to a baskt', async () => {
    const assetConfigs = [];
    const numAssets = 20;
    for (let i = 0; i < numAssets; i++) {
      const { assetAddress } = await client.addAsset(`Asset${i}`);
      assetConfigs.push({
        assetId: assetAddress,
        direction: true,
        weight: new BN(10_000 / numAssets),
        baselinePrice: new BN(0),
      });
    }

    // Wait for a block
    await client.waitForBlocks();

    const { basktId } = await client.createBaskt(
      '20Baskt',
      assetConfigs,
      true,
      client.createOracleParams(commonOracle),
    );

    // Verify the baskt has 20 assets
    const basktAccount = await client.getBaskt(basktId);
    expect(basktAccount.currentAssetConfigs.length).to.equal(numAssets);
  });

  it('Baseline prices cannot be altered during creation', async () => {
    const assets = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(10000),
        baselinePrice: new BN(10),
      },
    ];

    const { basktId } = await client.createBaskt(
      'Invali6',
      assets,
      true,
      client.createOracleParams(commonOracle),
    );

    // Fetch the baskt account to verify it was initialized correctly
    const baskt = await client.getBaskt(basktId);
    expect(baskt.currentAssetConfigs[0].baselinePrice.toNumber()).to.equal(0);
  });
});
