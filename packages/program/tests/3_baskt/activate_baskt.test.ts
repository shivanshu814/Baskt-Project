import { expect } from 'chai';
import { describe, before, it } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';
import { BN } from 'bn.js';
import { AccessControlRole, OnchainAssetConfig } from '@baskt/types';

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

  let commonOracle: PublicKey;

  // Test users
  let rebalancer: Keypair;
  let regularUser: Keypair;

  // Helper function to create a baskt for testing
  async function createTestBaskt(name: string, assets: OnchainAssetConfig[], isPublic = true) {
    const { basktId } = await client.createBaskt(
      name,
      assets,
      isPublic,
      client.createOracleParams(commonOracle),
    );
    return basktId;
  }

  // Set up test roles and assets before running tests
  before(async () => {
    // Create assets that will be used across tests
    btcAssetId = await client.addAsset('BTC');
    ethAssetId = await client.addAsset('ETH');
    dogeAssetId = await client.addAsset('DOGE');

    commonOracle = (
      await client.createOracle('common1', new BN(50000), -6, new BN(100), new BN(60))
    ).address;

    // Create test users
    rebalancer = Keypair.generate();
    regularUser = Keypair.generate();

    // Add roles to test users
    await client.addRole(rebalancer.publicKey, AccessControlRole.Rebalancer);

    // Create 20 assets for the multi-asset baskt test
    for (let i = 0; i < 20; i++) {
      const assetId = await client.addAsset(`ASSET${i}`);
      multiAssetIds.push(assetId);
    }

    // Set oracle prices for all assets
    await client.updateOraclePrice(commonOracle, new BN(50000));
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

    const basktId = await createTestBaskt('OB', simpleAssets);

    // Get the baskt before activation
    const basktBefore = await client.getBaskt(basktId);
    expect(basktBefore.isActive).to.be.false;

    // Set prices for each asset in the baskt
    const prices = [
      new BN(50000), // BTC price
      new BN(3000), // ETH price
    ];

    // Activate the baskt as the owner (using default client)
    await client.activateBaskt(basktId, prices);

    // Get the baskt after activation
    const basktAfter = await client.getBaskt(basktId);

    // Verify the baskt is now active
    expect(basktAfter.isActive).to.be.true;

    // Verify baseline prices were set correctly
    expect(basktAfter.currentAssetConfigs[0].baselinePrice.toString()).to.equal(
      prices[0].toString(),
    );
    expect(basktAfter.currentAssetConfigs[1].baselinePrice.toString()).to.equal(
      prices[1].toString(),
    );

    // Verify baseline NAV was set
    expect(basktAfter.baselineNav.toString()).to.equal('50000');

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

    const basktId = await createTestBaskt('MB', assets);

    // Get the baskt before activation
    const basktBefore = await client.getBaskt(basktId);
    expect(basktBefore.isActive).to.be.false;

    // Set prices for each asset in the baskt
    const prices = [new BN(1)]; // DOGE price

    // Activate the baskt as the oracle manager
    const oracleManagerClient = await TestClient.forUser(client.oracleManager);
    await oracleManagerClient.activateBaskt(basktId, prices);

    // Get the baskt after activation
    const basktAfter = await client.getBaskt(basktId);

    // Verify the baskt is now active
    expect(basktAfter.isActive).to.be.true;

    // Verify baseline prices were set correctly
    expect(basktAfter.currentAssetConfigs[0].baselinePrice.toString()).to.equal(
      prices[0].toString(),
    );

    // Verify baseline NAV was set
    expect(basktAfter.baselineNav.toString()).to.equal('50000');
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

    const basktId = await createTestBaskt('UB', assets);

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
    const basktAfter = await client.getBaskt(basktId);
    expect(basktAfter.isActive).to.be.false;
  });

  it('Fails to activate a baskt from a rebalancer', async () => {
    // Create a new baskt for this test
    const assets = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% BTC
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const basktId = await createTestBaskt('RB', assets);

    // Create a client for the rebalancer
    const rebalancerClient = await TestClient.forUser(rebalancer);

    // Set prices for each asset in the baskt
    const prices = [new BN(50000)]; // BTC price

    // Attempt to activate the baskt as a rebalancer - should fail
    try {
      await rebalancerClient.activateBaskt(basktId, prices);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('Unauthorized');
    }

    // Verify the baskt is still inactive
    const basktAfter = await client.getBaskt(basktId);
    expect(basktAfter.isActive).to.be.false;
  });

  it('Successfully activates a baskt with 20 assets', async () => {
    // Create a baskt with 20 assets
    const multiAssets = multiAssetIds.map((asset) => ({
      assetId: asset.assetAddress,
      direction: true,
      weight: new BN(500), // Each asset has 5% weight (total 100%)
      baselinePrice: new BN(0),
    })) as OnchainAssetConfig[];

    const basktId = await createTestBaskt('MAB', multiAssets);

    // Get the baskt before activation
    const basktBefore = await client.getBaskt(basktId);
    expect(basktBefore.isActive).to.be.false;

    // Set prices for each asset in the baskt (20 assets)
    const prices = Array(20)
      .fill(0)
      .map((_, i) => new BN(1000 + i * 100)); // Different price for each asset

    // Activate the baskt as the owner (using default client)
    await client.activateBaskt(basktId, prices);

    // Get the baskt after activation
    const basktAfter = await client.getBaskt(basktId);

    // Verify the baskt is now active
    expect(basktAfter.isActive).to.be.true;

    // Verify baseline prices were set correctly for all 20 assets
    for (let i = 0; i < 20; i++) {
      expect(basktAfter.currentAssetConfigs[i].baselinePrice.toString()).to.equal(
        prices[i].toString(),
      );
    }

    // Verify baseline NAV was set
    expect(basktAfter.baselineNav.toString()).to.equal('50000');
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

    const basktId = await createTestBaskt('MIB', assets);

    // Set prices with wrong count (only 1 price for 2 assets)
    const prices = [new BN(50000)];

    // Attempt to activate the baskt with mismatched price count - should fail
    try {
      // Use the oracle manager client to ensure we don't fail due to permissions
      const oracleManagerClient = await TestClient.forUser(client.oracleManager);
      await oracleManagerClient.activateBaskt(basktId, prices);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('InvalidBasktConfig');
    }

    // Verify the baskt is still inactive
    const basktAfter = await client.getBaskt(basktId);
    expect(basktAfter.isActive).to.be.false;
  });
});
