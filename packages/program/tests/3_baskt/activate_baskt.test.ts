import { expect } from 'chai';
import { describe, before, it, after } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';
import { BN } from 'bn.js';
import { AccessControlRole, OnchainAssetConfig } from '@baskt/types';
// Using TestClient static method instead of importing from test-setup
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';
import { BASE_NAV_BN } from '../utils/test-constants';

type AssetId = {
  assetAddress: PublicKey;
  txSignature: string | null;
};

describe('activate baskt', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Asset IDs that will be used across tests
  let btcAssetId: AssetId;
  let ethAssetId: AssetId;
  let dogeAssetId: AssetId;
  const multiAssetIds: AssetId[] = [];

  // Test users
  let rebalancer: Keypair;
  let regularUser: Keypair;

  before(async () => {
    // Ensure protocol is initialized and roles are set up
    await TestClient.initializeProtocolAndRoles(client);

    // Create assets that will be used across tests
    btcAssetId = await client.addAsset('BTC');
    ethAssetId = await client.addAsset('ETH');
    dogeAssetId = await client.addAsset('DOGE');

    // Create test users
    rebalancer = Keypair.generate();
    regularUser = Keypair.generate();

    // Add roles to test users
    await client.addRole(rebalancer.publicKey, AccessControlRole.Rebalancer);

    // Create 10 assets for the multi-asset baskt test
    for (let i = 0; i < 10; i++) {
      const assetId = await client.addAsset(`ASSET${i}`);
      multiAssetIds.push(assetId);
    }
  });

  after(async () => {
    // Clean up roles added during tests
    try {
      const removeRebalancerSig = await client.removeRole(
        rebalancer.publicKey,
        AccessControlRole.Rebalancer,
      );
      await waitForTx(client.connection, removeRebalancerSig);
      await waitForNextSlot(client.connection);
    } catch (error) {
      // Silently handle cleanup errors to avoid masking test failures
      console.warn('Cleanup error in activate_baskt.test.ts:', error);
    }
  });

  it('Successfully activates a baskt from the owner and fails when trying to activate again', async () => {
    // Create a new baskt for this test
    const simpleAssets = [
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

    const { basktId } = await client.createBaskt(simpleAssets, true);

    // Get the baskt before activation
    const basktBefore = await client.getBasktRaw(basktId);
    expect(basktBefore.status).to.deep.equal({ pending: {} });

    // Set prices for each asset in the baskt
    const prices = [
      new BN(50000), // BTC price
      new BN(3000), // ETH price
    ];

    // Activate the baskt as the owner (using default client)
    await client.activateBaskt(basktId, prices);

    // Get the baskt after activation
    const basktAfter = await client.getBasktRaw(basktId);

    // Verify the baskt is now active
    expect(basktAfter.status).to.deep.equal({ active: {} });

    // Verify baseline prices were set correctly
    expect(basktAfter.currentAssetConfigs[0].baselinePrice.toString()).to.equal(
      prices[0].toString(),
    );
    expect(basktAfter.currentAssetConfigs[1].baselinePrice.toString()).to.equal(
      prices[1].toString(),
    );

    // Verify baseline NAV was set
    expect(basktAfter.baselineNav.toString()).to.equal(BASE_NAV_BN.toString());

    expect(basktAfter.fundingIndex.cumulativeIndex.toString()).to.equal('1000000');
    expect(basktAfter.fundingIndex.currentRate.toString()).to.equal('0');
    expect(basktAfter.fundingIndex.lastUpdateTimestamp.toString()).to.not.equal('0');

    // Try to activate again - should fail with BasktAlreadyActive
    try {
      await client.activateBaskt(basktId, prices);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('BasktAlreadyActive');
    }
  });

  it('Successfully activates a baskt from an oracle manager', async () => {
    // Create a new baskt for this test
    const assets = [
      {
        assetId: dogeAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% DOGE
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(assets, true);

    // Get the baskt before activation
    const basktBefore = await client.getBasktRaw(basktId);
    expect(basktBefore.status).to.deep.equal({ pending: {} });

    // Set prices for each asset in the baskt
    const prices = [new BN(1)]; // DOGE price

    // Activate the baskt as the oracle manager
    const basktManagerClient = await TestClient.forUser(client.basktManager);
    await basktManagerClient.activateBaskt(basktId, prices);

    // Get the baskt after activation
    const basktAfter = await client.getBasktRaw(basktId);

    // Verify the baskt is now active
    expect(basktAfter.status).to.deep.equal({ active: {} });

    // Verify baseline prices were set correctly
    expect(basktAfter.currentAssetConfigs[0].baselinePrice.toString()).to.equal(
      prices[0].toString(),
    );

    // Verify baseline NAV was set
    expect(basktAfter.baselineNav.toString()).to.equal(BASE_NAV_BN.toString());
  });

  it('Fails to activate a baskt from a regular user', async () => {
    // Create a new baskt for this test
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
        weight: new BN(5000), // 50% ETH
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(assets, true);

    // Create a client for the regular user
    const userClient = await TestClient.forUser(regularUser);

    // Set prices for each asset in the baskt
    const prices = [
      new BN(50000), // BTC price
      new BN(3000), // ETH price
    ];

    // Attempt to activate the baskt as a regular user - should fail
    try {
      await userClient.activateBaskt(basktId, prices);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('Unauthorized');
    }

    // Verify the baskt is still inactive
    const basktAfter = await client.getBasktRaw(basktId);
    expect(basktAfter.status).to.deep.equal({ pending: {} });
  });


  it('Successfully activates a baskt with 10 assets', async () => {
    // Create a baskt with 10 assets
    const multiAssets = multiAssetIds.map((asset) => ({
      assetId: asset.assetAddress,
      direction: true,
      weight: new BN(1000),
      baselinePrice: new BN(0),
    })) as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(multiAssets, true);

    // Get the baskt before activation
    const basktBefore = await client.getBasktRaw(basktId);
    expect(basktBefore.status).to.deep.equal({ pending: {} });

    // Set prices for each asset in the baskt (10 assets)
    const prices = Array(10)
      .fill(0)
      .map((_, i) => new BN(1000 + i * 100)); // Different price for each asset

    // Activate the baskt as the owner (using default client)
    await client.activateBaskt(basktId, prices);

    // Get the baskt after activation
    const basktAfter = await client.getBasktRaw(basktId);

    // Verify the baskt is now active
    expect(basktAfter.status).to.deep.equal({ active: {} });

    // Verify baseline prices were set correctly for all 10 assets
    for (let i = 0; i < 10; i++) {
      expect(basktAfter.currentAssetConfigs[i].baselinePrice.toString()).to.equal(
        prices[i].toString(),
      );
    }

    // Verify baseline NAV was set
    expect(basktAfter.baselineNav.toString()).to.equal(BASE_NAV_BN.toString());
  });

  it('Fails to activate a baskt with mismatched price count', async () => {
    // Create a new baskt for this test
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
        weight: new BN(5000), // 50% ETH
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(assets, true);

    // Set prices with wrong count (only 1 price for 2 assets)
    const prices = [new BN(50000)];

    // Attempt to activate the baskt with mismatched price count - should fail
    try {
      // Use the oracle manager client to ensure we don't fail due to permissions
      const basktManagerClient = await TestClient.forUser(client.basktManager);
      await basktManagerClient.activateBaskt(basktId, prices);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('InvalidBasktConfig');
    }

    // Verify the baskt is still inactive
    const basktAfter = await client.getBasktRaw(basktId);
    expect(basktAfter.status).to.deep.equal({ pending: {} });
  });
  it('Fails to activate a baskt with empty price array', async () => {
    const assets = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(10000),
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];
  
    const { basktId } = await client.createBaskt(assets, true);
    
    // Attempt to activate with empty prices array
    try {
      await client.activateBaskt(basktId, []);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('InvalidBasktConfig');
    }
  });
  it('Fails to activate a baskt with zero prices', async () => {
    const assets = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(10000),
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];
  
    const { basktId } = await client.createBaskt(assets, true);
    
    const prices = [new BN(0)]; // Zero price
   
    try {
      await client.activateBaskt(basktId, prices);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('InvalidBasktConfig');
    }
  
    
  });
});
