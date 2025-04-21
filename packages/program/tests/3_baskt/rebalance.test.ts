import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { TestClient } from '../utils/test-client';
import { AccessControlRole, OnchainAssetConfig, OnchainOracleParams } from '@baskt/types';

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

  let commonOracleParams: OnchainOracleParams;

  let assetPrices: anchor.BN[];

  let nonOwnerClient: TestClient;
  let rebalancerClient: TestClient;

  // Set up test roles and assets before running tests
  before(async () => {
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

    commonOracleParams = client.createOracleParams(
      (await client.createOracle('c', new anchor.BN(1000000), -6, new anchor.BN(1000000))).address,
    );
    await client.waitForBlocks();
    await client.waitForBlocks();

    // Create the baskt
    ({ basktId } = await client.createBaskt(
      'RebBaskt', // Name must be 10 characters or less
      assets,
      true, // is_public
      commonOracleParams,
    ));
    assetPrices = [new anchor.BN(4000), new anchor.BN(3000)];
    await client.activateBaskt(basktId, assetPrices);

    nonOwnerClient = await TestClient.forUser(Keypair.generate());
    rebalancerClient = await TestClient.forUser(Keypair.generate());

    await client.addRole(rebalancerClient.publicKey, AccessControlRole.Rebalancer);
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

    await client.updateOraclePrice(commonOracleParams.oracleAccount, new anchor.BN(140));

    // Perform the rebalance
    await client.rebalanceBaskt(basktId, newAssetConfigs, commonOracleParams.oracleAccount);

    // Get the baskt after rebalance
    const basktAfter = await client.getBaskt(basktId);

    // Verify rebalance index was incremented
    expect(basktAfter.lastRebalanceIndex.toNumber()).to.equal(rebalanceIndexBefore + 1);

    // Verify new weights were applied
    const btcConfig = basktAfter.currentAssetConfigs[0];
    expect(btcConfig?.baselinePrice.toNumber()).to.equal(100);
    expect(btcConfig?.direction).to.not.equal(false);
    expect(btcConfig?.weight.toNumber()).to.not.equal(3000);

    const ethConfig = basktAfter.currentAssetConfigs[1];
    expect(ethConfig?.baselinePrice.toNumber()).to.equal(100);
    expect(ethConfig?.direction).to.not.equal(false);
    expect(ethConfig?.weight.toNumber()).to.not.equal(7000);

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
      // Ensure weight and direction are not equal
      expect(rebalanceHistory.assetConfigs[i].direction).to.not.equal(newAssetConfigs[i].direction);
      expect(rebalanceHistory.assetConfigs[i].weight.toNumber()).to.not.equal(
        newAssetConfigs[i].weight.toNumber(),
      );
    }

    expect(rebalanceHistory.baselineNav.toNumber()).to.equal(1000000);
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
      await client.rebalanceBaskt(basktId, invalidAssetConfigs, commonOracleParams.oracleAccount);
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
      await client.rebalanceBaskt(basktId, assetConfigs, commonOracleParams.oracleAccount);
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
      await client.rebalanceBaskt(basktId, assetConfigs, commonOracleParams.oracleAccount);
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
      await nonOwnerClient.rebalanceBaskt(
        basktId,
        newAssetConfigs,
        commonOracleParams.oracleAccount,
      );
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
    await rebalancerClient.rebalanceBaskt(
      basktId,
      newAssetConfigs,
      commonOracleParams.oracleAccount,
    );

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
    await client.rebalanceBaskt(basktId, newAssetConfigs, commonOracleParams.oracleAccount);

    // Get the baskt after rebalance
    const basktAfter = await client.getBaskt(basktId);
    const rebalanceIndexAfter = basktAfter.lastRebalanceIndex.toNumber();

    // Verify the rebalance was successful
    expect(rebalanceIndexAfter).to.equal(rebalanceIndexBefore + 1);
  });
});
