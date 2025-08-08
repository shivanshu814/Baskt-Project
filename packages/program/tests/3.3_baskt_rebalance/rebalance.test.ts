import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { TestClient } from '../utils/test-client';
import { AccessControlRole, OnchainAssetConfig } from '@baskt/types';
import { BN } from 'bn.js';

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
  let creatorClient: TestClient;

  // Set up test roles and assets before running tests
  before(async () => {
    // Ensure protocol is initialized and roles are set up
    await TestClient.initializeProtocolAndRoles(client);

    creatorClient = await TestClient.forUser(Keypair.generate());

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

    // Create the baskt   
    ({ basktId } = await creatorClient.createBaskt(
      assets, 
      true, // is_public
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


    // Perform the rebalance
    await client.rebalanceBaskt(basktId, newAssetConfigs, new anchor.BN(140));

    // Get the baskt after rebalance
    const basktAfter = await client.getBasktRaw(basktId);

    // Verify new weights were applied
    const btcConfig = basktAfter.currentAssetConfigs[0];
    expect(btcConfig?.baselinePrice.toNumber()).to.equal(100);
    // direction and weight should remain unchanged (true / 6000)
    expect(btcConfig?.direction).to.equal(true);
    expect(btcConfig?.weight.toNumber()).to.equal(3000);

    const ethConfig = basktAfter.currentAssetConfigs[1];
    expect(ethConfig?.baselinePrice.toNumber()).to.equal(100);
    expect(ethConfig?.direction).to.equal(true);
    expect(ethConfig?.weight.toNumber()).to.equal(7000);

    expect(new BN(basktAfter.baselineNav).toNumber()).to.equal(140);
    expect(new BN(basktAfter.lastRebalanceTime).toNumber()).to.be.greaterThan(0);
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
      await client.rebalanceBaskt(basktId, invalidAssetConfigs, new anchor.BN(140));
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      console.log(error);
      expect((error as Error).message).to.include('InvalidAssetWeights');
    }
  });

  it('Fails to rebalance when asset ids are wrong', async () => {
    // Add the new asset to the rebalance config
    const reverseOrderAssetConfigs = [
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

    try {
      await client.rebalanceBaskt(basktId, reverseOrderAssetConfigs, new anchor.BN(140));
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      console.log(error);
      expect((error as Error).message).to.include('InvalidBasktConfig.');
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

    try {
      await client.rebalanceBaskt(basktId, assetConfigs, new anchor.BN(140));
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      console.log(error);
      expect((error as Error).message).to.include('InvalidBasktConfig');
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
      await creatorClient.rebalanceBaskt(basktId, newAssetConfigs, new anchor.BN(140));
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('Unauthorized');
    }

    try {
      await nonOwnerClient.rebalanceBaskt(basktId, newAssetConfigs, new anchor.BN(140)  );
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
    const basktBefore = await rebalancerClient.getBasktRaw(basktId);

    await client.waitForSeconds(1);

    // Perform the rebalance with rebalancer client
    await rebalancerClient.rebalanceBaskt(basktId, newAssetConfigs, new anchor.BN(140));

    // Get the baskt after rebalance
    const basktAfter = await rebalancerClient.getBasktRaw(basktId);

    expect(new BN(basktAfter.lastRebalanceTime).toNumber()).to.be.greaterThan(new BN(basktBefore.lastRebalanceTime).toNumber());
    expect(new BN(basktAfter.baselineNav).toNumber()).to.equal(140);
  });
  it('Fails to rebalance when no assets are provided', async () => {
    try {
      await client.rebalanceBaskt(basktId, [], new anchor.BN(140));
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('InvalidAssetConfig');
    }
  });
    it('Fails to rebalance when asset has 0 weight', async () => {
      const assetConfigs = [
        {
          assetId: btcAssetId.assetAddress,
          direction: true,
          weight: new anchor.BN(0), // 0% BTC 
          baselinePrice: new anchor.BN(100),
        },
        {
          assetId: ethAssetId.assetAddress,
          direction: true,
          weight: new anchor.BN(10000), // 100% ETH
          baselinePrice: new anchor.BN(100),
        },
      ];

      try {
        await client.rebalanceBaskt(basktId, assetConfigs, new anchor.BN(140));
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        console.log(error);
        expect((error as Error).message).to.include('InvalidAssetWeights.');
      }
    });
    // Add a test where asset has its weight changed
    it('Successfully rebalances when asset has its weight changed', async () => {
      const assetConfigs = [
        {
          assetId: btcAssetId.assetAddress,
          direction: true,
          weight: new anchor.BN(3000), // 30% BTC
          baselinePrice: new anchor.BN(100),  
        },
        {
          assetId: ethAssetId.assetAddress,
          direction: true,
          weight: new anchor.BN(7000), // 70% ETH
          baselinePrice: new anchor.BN(100),
        },
      ];  

      await client.rebalanceBaskt(basktId, assetConfigs, new anchor.BN(140));

      const basktAfter = await client.getBasktRaw(basktId);
      expect(basktAfter.currentAssetConfigs[0].weight.toNumber()).to.equal(3000);
      expect(basktAfter.currentAssetConfigs[1].weight.toNumber()).to.equal(7000);
    });

    it('Successfully rebalances with rebalance fee per unit', async () => {
      const assetConfigs = [
        {
          assetId: btcAssetId.assetAddress,
          direction: true,
          weight: new anchor.BN(5000), // 50% BTC
          baselinePrice: new anchor.BN(120),
        },
        {
          assetId: ethAssetId.assetAddress,
          direction: true,
          weight: new anchor.BN(5000), // 50% ETH
          baselinePrice: new anchor.BN(120),
        },
      ];

      const rebalanceFeePerUnit = new anchor.BN(1000); // 1000 units fee per position size unit

      // Get baskt before rebalance to check rebalance fee index
      const basktBefore = await client.getBasktRaw(basktId);
      const rebalanceFeeIndexBefore = basktBefore.rebalanceFeeIndex.cumulativeIndex;

      // Perform rebalance with fee
      await client.rebalanceBaskt(basktId, assetConfigs, new anchor.BN(150), rebalanceFeePerUnit);

      // Check baskt after rebalance
      const basktAfter = await client.getBasktRaw(basktId);
      
      // Verify the rebalance fee index was updated
      const rebalanceFeeIndexAfter = basktAfter.rebalanceFeeIndex.cumulativeIndex;
      expect(rebalanceFeeIndexAfter.sub(rebalanceFeeIndexBefore).toNumber()).to.equal(1000);
      
      // Verify other baskt properties were updated correctly
      expect(basktAfter.currentAssetConfigs[0].weight.toNumber()).to.equal(5000);
      expect(basktAfter.currentAssetConfigs[1].weight.toNumber()).to.equal(5000);
      expect(new BN(basktAfter.baselineNav).toNumber()).to.equal(150);
    });

    it('Successfully rebalances without rebalance fee (fee index unchanged)', async () => {
      const assetConfigs = [
        {
          assetId: btcAssetId.assetAddress,
          direction: true,
          weight: new anchor.BN(6000), // 60% BTC
          baselinePrice: new anchor.BN(130),
        },
        {
          assetId: ethAssetId.assetAddress,
          direction: true,
          weight: new anchor.BN(4000), // 40% ETH
          baselinePrice: new anchor.BN(130),
        },
      ];

      // Get baskt before rebalance to check rebalance fee index
      const basktBefore = await client.getBasktRaw(basktId);
      const rebalanceFeeIndexBefore = basktBefore.rebalanceFeeIndex.cumulativeIndex;

      // Perform rebalance without fee (not passing the parameter)
      await client.rebalanceBaskt(basktId, assetConfigs, new anchor.BN(160));

      // Check baskt after rebalance
      const basktAfter = await client.getBasktRaw(basktId);
      
      // Verify the rebalance fee index was NOT updated
      const rebalanceFeeIndexAfter = basktAfter.rebalanceFeeIndex.cumulativeIndex;
      expect(rebalanceFeeIndexAfter.toNumber()).to.equal(rebalanceFeeIndexBefore.toNumber());
      
      // Verify other baskt properties were updated correctly
      expect(basktAfter.currentAssetConfigs[0].weight.toNumber()).to.equal(6000);
      expect(basktAfter.currentAssetConfigs[1].weight.toNumber()).to.equal(4000);
      expect(new BN(basktAfter.baselineNav).toNumber()).to.equal(160);
    });

    it('Successfully rebalances with zero rebalance fee (fee index unchanged)', async () => {
      const assetConfigs = [
        {
          assetId: btcAssetId.assetAddress,
          direction: true,
          weight: new anchor.BN(7000), // 70% BTC
          baselinePrice: new anchor.BN(140),
        },
        {
          assetId: ethAssetId.assetAddress,
          direction: true,
          weight: new anchor.BN(3000), // 30% ETH
          baselinePrice: new anchor.BN(140),
        },
      ];

      const rebalanceFeePerUnit = new anchor.BN(0); // Zero fee

      // Get baskt before rebalance to check rebalance fee index
      const basktBefore = await client.getBasktRaw(basktId);
      const rebalanceFeeIndexBefore = basktBefore.rebalanceFeeIndex.cumulativeIndex;

      // Perform rebalance with zero fee
      await client.rebalanceBaskt(basktId, assetConfigs, new anchor.BN(170), rebalanceFeePerUnit);

      // Check baskt after rebalance
      const basktAfter = await client.getBasktRaw(basktId);
      
      // Verify the rebalance fee index was NOT updated (zero fee)
      const rebalanceFeeIndexAfter = basktAfter.rebalanceFeeIndex.cumulativeIndex;
      expect(rebalanceFeeIndexAfter.toNumber()).to.equal(rebalanceFeeIndexBefore.toNumber());
      
      // Verify other baskt properties were updated correctly
      expect(basktAfter.currentAssetConfigs[0].weight.toNumber()).to.equal(7000);
      expect(basktAfter.currentAssetConfigs[1].weight.toNumber()).to.equal(3000);
      expect(new BN(basktAfter.baselineNav).toNumber()).to.equal(170);
    });

    it('Rebalance fee index accumulates correctly over multiple rebalances', async () => {
      const assetConfigs = [
        {
          assetId: btcAssetId.assetAddress,
          direction: true,
          weight: new anchor.BN(8000), // 80% BTC
          baselinePrice: new anchor.BN(150),
        },
        {
          assetId: ethAssetId.assetAddress,
          direction: true,
          weight: new anchor.BN(2000), // 20% ETH
          baselinePrice: new anchor.BN(150),
        },
      ];

      // Get initial rebalance fee index
      const basktInitial = await client.getBasktRaw(basktId);
      const initialIndex = basktInitial.rebalanceFeeIndex.cumulativeIndex;

      // First rebalance with fee
      const firstFee = new anchor.BN(500);
      await client.rebalanceBaskt(basktId, assetConfigs, new anchor.BN(180), firstFee);

      const basktAfterFirst = await client.getBasktRaw(basktId);
      const indexAfterFirst = basktAfterFirst.rebalanceFeeIndex.cumulativeIndex;
      expect(indexAfterFirst.sub(initialIndex).toNumber()).to.equal(500);

      // Second rebalance with different fee
      const secondFee = new anchor.BN(300);
      await client.rebalanceBaskt(basktId, assetConfigs, new anchor.BN(190), secondFee);

      const basktAfterSecond = await client.getBasktRaw(basktId);
      const indexAfterSecond = basktAfterSecond.rebalanceFeeIndex.cumulativeIndex;
      
      // Total accumulated fee should be 500 + 300 = 800
      expect(indexAfterSecond.sub(initialIndex).toNumber()).to.equal(800);
    });
});
