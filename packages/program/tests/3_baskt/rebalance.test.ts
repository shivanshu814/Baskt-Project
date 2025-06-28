import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { TestClient } from '../utils/test-client';
import { AccessControlRole, OnchainAssetConfig } from '@baskt/types';
// Using TestClient static method instead of importing from test-setup
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';
import { BN } from 'bn.js';
import { BASE_NAV_BN } from '../utils/test-constants';

type AssetId = {
  assetAddress: PublicKey;
  txSignature: string | null;
};

describe('Baskt Rebalance', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Asset IDs that will be used across tests
  let btcAssetId: AssetId;
  let ethAssetId: AssetId;
  let basktId: PublicKey;

  let assetPrices: anchor.BN[];

  let nonOwnerClient: TestClient;
  let rebalancerClient: TestClient;

  // Set up test roles and assets before running tests
  before(async () => {
    // Ensure protocol is initialized and roles are set up
    await TestClient.initializeProtocolAndRoles(client);

    // Create assets that will be used across tests
    btcAssetId = await client.addAsset('BTC');
    ethAssetId = await client.addAsset('ETH');

    // Create a test baskt for rebalance tests
    const assets = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new anchor.BN(6000), // 60% BTC
        baselinePrice: new anchor.BN(0),
      },
      {
        assetId: ethAssetId.assetAddress,
        direction: true,
        weight: new anchor.BN(4000), // 40% ETH
        baselinePrice: new anchor.BN(0),
      },
    ] as OnchainAssetConfig[];

    await client.waitForBlocks();
    await client.waitForBlocks();

    // Create the baskt
    ({ basktId } = await client.createBaskt(
      'RebBaskt', // Name must be 10 characters or less
      assets,
      true, // is_public
    ));
    assetPrices = [new anchor.BN(4000), new anchor.BN(3000)];
    await client.activateBaskt(basktId, assetPrices);

    nonOwnerClient = await TestClient.forUser(Keypair.generate());
    rebalancerClient = await TestClient.forUser(Keypair.generate());

    await client.addRole(rebalancerClient.publicKey, AccessControlRole.Rebalancer);
  });

  after(async () => {
    // Clean up Rebalancer role added during tests
    try {
      const removeRebalancerSig = await client.removeRole(
        rebalancerClient.publicKey,
        AccessControlRole.Rebalancer
      );
      await waitForTx(client.connection, removeRebalancerSig);
      await waitForNextSlot(client.connection);
    } catch (error) {
      // Silently handle cleanup errors to avoid masking test failures
      console.warn('Cleanup error in rebalance.test.ts:', error);
    }
  });

  it('Successfully rebalances a baskt with new prices', async () => {
    // New asset weights for rebalance
    const newAssetConfigs = [
      {
        assetId: btcAssetId.assetAddress,
        // So we can see the directions do not change
        direction: false,
        // So we can see the weights do not change
        weight: new anchor.BN(3000), // 30% BTC (was 60%)
        baselinePrice: new anchor.BN(100),
      },
      {
        assetId: ethAssetId.assetAddress,
        // So we can see the directions do not change
        direction: false,
        // So we can see the weights do not change
        weight: new anchor.BN(7000), // 70% ETH (was 40%)
        baselinePrice: new anchor.BN(100),
      },
    ] as OnchainAssetConfig[];

    // Get the baskt before rebalance
    const basktBefore = await client.getBaskt(basktId);
    const rebalanceIndexBefore = basktBefore.lastRebalanceIndex.toNumber();

    await client.updateOraclePrice(basktId, new anchor.BN(140));

    // Perform the rebalance
    await client.rebalanceBaskt(basktId, newAssetConfigs);

    // Get the baskt after rebalance
    const basktAfter = await client.getBaskt(basktId);

    // Verify rebalance index was incremented
    expect(basktAfter.lastRebalanceIndex.toNumber()).to.equal(rebalanceIndexBefore + 1);

    // Verify new weights were applied
    const btcConfig = basktAfter.currentAssetConfigs[0];
    expect(btcConfig?.baselinePrice.toNumber()).to.equal(100);
    // direction and weight should remain unchanged (true / 6000)
    expect(btcConfig?.direction).to.equal(true);
    expect(btcConfig?.weight.toNumber()).to.equal(6000);

    const ethConfig = basktAfter.currentAssetConfigs[1];
    expect(ethConfig?.baselinePrice.toNumber()).to.equal(100);
    expect(ethConfig?.direction).to.equal(true);
    expect(ethConfig?.weight.toNumber()).to.equal(4000);

    expect(basktAfter.baselineNav.toNumber()).to.equal(140);
    expect(basktAfter.lastRebalanceTime.toNumber()).to.be.greaterThan(0);

    // Check the new rebalance history
    const rebalanceHistory = await client.getRebalanceHistory(basktId, 0);
    expect(rebalanceHistory.basktId.toString()).to.equal(basktId.toString());
    expect(rebalanceHistory.rebalanceIndex.toNumber()).to.equal(rebalanceIndexBefore);

    for (let i = 0; i < newAssetConfigs.length; i++) {
      expect(rebalanceHistory.assetConfigs[i].assetId.toString()).to.equal(
        newAssetConfigs[i].assetId.toString(),
      );
      expect(rebalanceHistory.assetConfigs[i].baselinePrice.toNumber()).to.equal(
        assetPrices[i].toNumber(),
      );
      // Stored history should still reflect original values (true & 6000/4000)
      const originalConfig = i === 0 ? { dir: true, weight: 6000 } : { dir: true, weight: 4000 };
      expect(rebalanceHistory.assetConfigs[i].direction).to.equal(originalConfig.dir);
      expect(rebalanceHistory.assetConfigs[i].weight.toNumber()).to.equal(originalConfig.weight);
    }

    expect(rebalanceHistory.baselineNav.toNumber()).to.equal(BASE_NAV_BN.toNumber());
    expect(parseInt(rebalanceHistory.timestamp)).to.be.greaterThan(0);
  });

  it('Fails to rebalance when total weight is not 10000', async () => {
    // Invalid asset weights (total 9000 instead of 10000)
    const invalidAssetConfigs = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new anchor.BN(5000), // 50%
        baselinePrice: new anchor.BN(100),
      },
      {
        assetId: ethAssetId.assetAddress,
        direction: true,
        weight: new anchor.BN(4000), // 40% (total 90%)
        baselinePrice: new anchor.BN(100),
      },
    ] as OnchainAssetConfig[];

    // Use the same oracle params as the successful test
    try {
      await client.rebalanceBaskt(basktId, invalidAssetConfigs);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('InvalidAssetConfig');
    }
  });

  it('Fails to rebalance when asset ids are wrong', async () => {
    // Add the new asset to the rebalance config
    const assetConfigs = [
      {
        assetId: ethAssetId.assetAddress,
        direction: true,
        weight: new anchor.BN(3000), // 30%
        baselinePrice: new anchor.BN(100),
      },
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new anchor.BN(3000), // 30%
        baselinePrice: new anchor.BN(100),
      },
    ];

    // Only provide price data for BTC and ETH, omitting the new asset
    try {
      await client.rebalanceBaskt(basktId, assetConfigs);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('InvalidAssetConfig');
    }
  });

  it('Fails to rebalance when one less price is added', async () => {
    // Add the new asset to the rebalance config
    const assetConfigs = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new anchor.BN(3000), // 30%
        baselinePrice: new anchor.BN(100),
      },
    ];

    // Only provide price data for BTC and ETH, omitting the new asset
    try {
      await client.rebalanceBaskt(basktId, assetConfigs);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('InvalidAssetConfig');
    }
  });

  it('Fails to rebalance when caller is not owner or rebalancer', async () => {
    // New asset weights for rebalance
    const newAssetConfigs = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new anchor.BN(3000), // 30% BTC (was 60%)
        baselinePrice: new anchor.BN(100),
      },
      {
        assetId: ethAssetId.assetAddress,
        direction: true,
        weight: new anchor.BN(7000), // 70% ETH (was 40%)
        baselinePrice: new anchor.BN(100),
      },
    ];

    // Attempt to rebalance with non-owner client
    try {
      await nonOwnerClient.rebalanceBaskt(basktId, newAssetConfigs);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('Unauthorized');
    }
  });

  it('Successfully rebalances when caller has Rebalancer role', async () => {
    // New asset weights for rebalance
    const newAssetConfigs = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new anchor.BN(4000), // 40% BTC
        baselinePrice: new anchor.BN(100),
      },
      {
        assetId: ethAssetId.assetAddress,
        direction: true,
        weight: new anchor.BN(6000), // 60% ETH
        baselinePrice: new anchor.BN(100),
      },
    ];

    // Get the baskt before rebalance
    const basktBefore = await rebalancerClient.getBaskt(basktId);
    const rebalanceIndexBefore = basktBefore.lastRebalanceIndex.toNumber();

    // Perform the rebalance with rebalancer client
    await rebalancerClient.rebalanceBaskt(basktId, newAssetConfigs);

    // Get the baskt after rebalance
    const basktAfter = await rebalancerClient.getBaskt(basktId);
    const rebalanceIndexAfter = basktAfter.lastRebalanceIndex.toNumber();

    // Verify the rebalance was successful
    expect(rebalanceIndexAfter).to.equal(rebalanceIndexBefore + 1);
  });

  it('Successfully rebalances when caller is the owner', async () => {
    // New asset weights for rebalance
    const newAssetConfigs = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new anchor.BN(5000), // 50% BTC
        baselinePrice: new anchor.BN(100),
      },
      {
        assetId: ethAssetId.assetAddress,
        direction: true,
        weight: new anchor.BN(5000), // 50% ETH
        baselinePrice: new anchor.BN(100),
      },
    ];

    // Get the baskt before rebalance
    const basktBefore = await client.getBaskt(basktId);
    const rebalanceIndexBefore = basktBefore.lastRebalanceIndex.toNumber();

    // Perform the rebalance with owner client
    await client.rebalanceBaskt(basktId, newAssetConfigs);

    // Get the baskt after rebalance
    const basktAfter = await client.getBaskt(basktId);
    const rebalanceIndexAfter = basktAfter.lastRebalanceIndex.toNumber();

    // Verify the rebalance was successful
    expect(rebalanceIndexAfter).to.equal(rebalanceIndexBefore + 1);
  });
});
