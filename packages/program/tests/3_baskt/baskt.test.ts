import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { PublicKey } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';
import { BN } from 'bn.js';
import { OnchainAssetConfig } from '@baskt/types';
// Using TestClient static method instead of importing from test-setup
// Chain helpers are now used internally by TestClient.resetFeatureFlags

// AssetPermissions type is now handled internally by TestClient.setupTestAssets

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

  // Set up test roles and assets before running tests
  before(async () => {
    // Ensure protocol is initialized and roles are set up
    await TestClient.initializeProtocolAndRoles(client);

    // Create assets that will be used across tests using the centralized helper
    const assets = await TestClient.setupTestAssets(client);

    // Assign the returned assets to our test variables
    btcAssetId = assets.btcAssetId;
    ethAssetId = assets.ethAssetId;
    dogeAssetId = assets.dogeAssetId;
    longOnlyAssetId = assets.longOnlyAssetId;
    shortOnlyAssetId = assets.shortOnlyAssetId;
  });

  afterEach(async () => {
    // Reset feature flags to enabled state after each test using the centralized helper
    await TestClient.resetFeatureFlags(client);
  });

  it('Successfully creates a new baskt with valid asset configs', async () => {
    // Set a small baskt creation fee for testing
    const protocol = await client.getProtocolAccount();
    const initialCreationFee = protocol.config.basktCreationFeeLamports.toNumber();
    const testCreationFee = 1000000; // 0.001 SOL
    await client.setBasktCreationFee(testCreationFee);

    // Get initial balances
    const initialCreatorBalance = await client.connection.getBalance(client.getPublicKey());
    const treasuryAddress = new PublicKey(protocol.treasury);
    const initialTreasuryBalance = await client.connection.getBalance(treasuryAddress);

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

    await client.waitForBlocks();

    // Create the baskt
    const { basktId } = await client.createBaskt(
      assets,
      true, // is_public
    );

    // Verify SOL fee was transferred
    const finalCreatorBalance = await client.connection.getBalance(client.getPublicKey());
    const creatorBalanceDifference = initialCreatorBalance - finalCreatorBalance;
    expect(creatorBalanceDifference).to.be.greaterThanOrEqual(testCreationFee);

    const finalTreasuryBalance = await client.connection.getBalance(treasuryAddress);
    const treasuryBalanceIncrease = finalTreasuryBalance - initialTreasuryBalance;
    expect(treasuryBalanceIncrease).to.equal(testCreationFee);

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBasktRaw(basktId);

    // Verify the baskt was initialized with correct values
    expect(basktAccount.isPublic).to.be.true;
    expect(basktAccount.creator.toString()).to.equal(client.getPublicKey().toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(2);

    // Verify asset configs
    const btcConfig = basktAccount.currentAssetConfigs.find(
      (config: any) => config.assetId.toString() === btcAssetId.assetAddress.toString(),
    );
    expect(btcConfig?.weight.toNumber()).to.equal(6000);
    expect(btcConfig?.direction).to.be.true;
    expect(btcConfig?.assetId.toString()).to.equal(btcAssetId.assetAddress.toString());
    expect(btcConfig?.baselinePrice.toNumber()).to.equal(0);

    const ethConfig = basktAccount.currentAssetConfigs.find(
      (config: any) => config.assetId.toString() === ethAssetId.assetAddress.toString(),
    );
    expect(ethConfig?.weight.toNumber()).to.equal(4000);
    expect(ethConfig?.direction).to.be.true;
    expect(ethConfig?.baselinePrice.toNumber()).to.equal(0);
    expect(ethConfig?.assetId.toString()).to.equal(ethAssetId.assetAddress.toString());

    // Restore original creation fee
    await client.setBasktCreationFee(initialCreationFee);
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
      await client.createBaskt(assets, true);
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
      assets,
      false, // is_public
    );

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBasktRaw(basktId);

    // Verify the baskt was initialized with correct values
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
      allowAddCollateral: true,
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
      await client.createBaskt(assets, true);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('BasktOperationsDisabled');
    }

    // Re-enable baskt creation for subsequent tests
    await client.updateFeatureFlags({
      allowAddLiquidity: true,
      allowRemoveLiquidity: true,
      allowOpenPosition: true,
      allowClosePosition: true,
      allowPnlWithdrawal: true,
      allowCollateralWithdrawal: true,
      allowAddCollateral: true,
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
    const { basktId } = await client.createBaskt(assets, true);

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBasktRaw(basktId);

    // Verify the baskt was initialized with correct values
    expect(basktAccount.isPublic).to.be.true;
    expect(basktAccount.creator.toString()).to.equal(client.getPublicKey().toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(3);

    // Verify all asset configs
    const btcConfig = basktAccount.currentAssetConfigs.find(
      (config: any) => config.assetId.toString() === btcAssetId.assetAddress.toString(),
    );
    expect(btcConfig?.weight.toNumber()).to.equal(5000);

    const ethConfig = basktAccount.currentAssetConfigs.find(
      (config: any) => config.assetId.toString() === ethAssetId.assetAddress.toString(),
    );
    expect(ethConfig?.weight.toNumber()).to.equal(3000);

    const dogeConfig = basktAccount.currentAssetConfigs.find(
      (config: any) => config.assetId.toString() === dogeAssetId.assetAddress.toString(),
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
    const { basktId } = await client.createBaskt(assets, true);

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBasktRaw(basktId);

    // Verify the baskt was initialized with correct values
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
    const { basktId } = await client.createBaskt(assets, true);

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBasktRaw(basktId);

    // Verify the baskt was initialized with correct values
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
      await client.createBaskt(assets, true);
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
      await client.createBaskt(assets, true);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('LongPositionsDisabled');
    }
  });


  it('Adding multiple assets to a baskt', async () => {
    const assetConfigs = [];
    const numAssets = 10;
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

    const { basktId } = await client.createBaskt(assetConfigs, true);

    // Verify the baskt has 20 assets
    const basktAccount = await client.getBasktRaw(basktId);
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

    const { basktId } = await client.createBaskt(assets, true);

    // Fetch the baskt account to verify it was initialized correctly
    const baskt = await client.getBasktRaw(basktId);
    expect(baskt.currentAssetConfigs[0].baselinePrice.toNumber()).to.equal(0);
  });

  it('Fails to create a baskt with duplicate assets', async () => {
    // Create asset configs with duplicate asset IDs
    const assets = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(5000), // 50% BTC
        baselinePrice: new BN(0),
      },
      {
        assetId: btcAssetId.assetAddress, // Duplicate BTC asset
        direction: true,
        weight: new BN(5000), // 50% BTC
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    // Attempt to create the baskt - should fail due to duplicate assets
    try {
      await client.createBaskt(assets, true);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('InvalidBasktConfig');
    }
  });
});
