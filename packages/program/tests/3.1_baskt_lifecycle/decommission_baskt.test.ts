import { expect } from 'chai';
import { describe, before, it } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';
import { BN } from 'bn.js';
import { OnchainAssetConfig } from '@baskt/types';
// Using TestClient static method instead of importing from test-setup
import {
  validateBasktPending,
  validateBasktActive,
  validateBasktDecommissioning,
} from '../utils/baskt-lifecycle-helpers';

type AssetId = {
  assetAddress: PublicKey;
  txSignature: string | null;
};

describe('decommission baskt', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test users
  let basktManager: Keypair;
  let regularUser: Keypair;
  let unauthorizedUser: Keypair;

  // Asset IDs that will be used across tests
  let btcAssetId: AssetId;
  let ethAssetId: AssetId;



  before(async () => {
    // Ensure protocol is initialized and roles are set up
    await TestClient.initializeProtocolAndRoles(client);

    // Create assets that will be used across tests
    btcAssetId = await client.addAsset('BTC');
    ethAssetId = await client.addAsset('ETH');

    // Create test users
    basktManager = client.basktManager; // Use existing oracle manager
    regularUser = Keypair.generate();
    unauthorizedUser = Keypair.generate();


  });

  after(async () => {
    // Reset global protocol configuration to default values
    try {
      // No grace period to reset since we removed it
    } catch (error) {
      // Ignore errors during cleanup
      // Logging disabled to avoid lint warnings
    }
  });

  // Helper function to create a test baskt with pre-created assets
  async function createTestBasktWithAssets(
    name: string,
    state: 'pending' | 'active' | 'decommissioning' = 'pending',
  ) {
    const assets: OnchainAssetConfig[] = [
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
    ];

    const { basktId } = await client.createBaskt(assets, true);

    if (state === 'pending') {
      return { basktId }; 
    }

    // Activate the baskt (required for all non-pending states)
    const prices = [new BN(50000), new BN(3000)]; // BTC and ETH prices
    await client.activateBaskt(basktId, prices);

    if (state === 'active') {
      return { basktId };
    }

    // Decommission the baskt (required for decommissioning state)
    await client.decommissionBaskt(basktId);

    return { basktId };
  }

    it('Successfully decommissions an active baskt by BasktManager', async () => {
      // Create an active baskt
      const { basktId } = await createTestBasktWithAssets('DecommissionTest', 'active');


      // Decommission the baskt as BasktManager (correct role)
      const basktManagerClient = await TestClient.forUser(basktManager);
      await basktManagerClient.decommissionBaskt(basktId);

      // Get baskt after decommissioning
      const basktAfter = await client.getBasktRaw(basktId);
      const decommissioningValidation = validateBasktDecommissioning(basktAfter.status);
      expect(decommissioningValidation.isValid).to.be.true;
      expect(decommissioningValidation.details).to.not.be.undefined;

      
  });

  describe('error conditions', () => {
    it('Fails to decommission a pending baskt', async () => {
      // Create a pending baskt
      const { basktId } = await createTestBasktWithAssets('PendingTest', 'pending');

      // Attempt to decommission pending baskt - should fail
      const basktManagerClient = await TestClient.forUser(basktManager);
      try {
        await basktManagerClient.decommissionBaskt(basktId);
        expect.fail('Should have thrown InvalidBasktState error');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('InvalidBasktState');
      }

      // Verify baskt is still pending
      const basktAfter = await client.getBasktRaw(basktId);
      const pendingValidation = validateBasktPending(basktAfter.status);
      expect(pendingValidation.isValid).to.be.true;
    });

    it('Fails to decommission an already decommissioning baskt', async () => {
      // Create a decommissioning baskt
      const { basktId } = await createTestBasktWithAssets('DecommissioningTest', 'decommissioning');

      // Attempt to decommission again - should fail
      const basktManagerClient = await TestClient.forUser(basktManager);
      try {
        await basktManagerClient.decommissionBaskt(basktId);
        expect.fail('Should have thrown InvalidBasktState error');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('InvalidBasktState');
      }

      // Verify baskt is still decommissioning
      const basktAfter = await client.getBasktRaw(basktId);
      const decommissioningValidation = validateBasktDecommissioning(basktAfter.status);
      expect(decommissioningValidation.isValid).to.be.true;
    });


  });

  describe('authorization tests', () => {
    it('Fails when unauthorized user attempts to decommission', async () => {
      // Create an active baskt
      const { basktId } = await createTestBasktWithAssets('UnauthorizedTest', 'active');

      // Create unauthorized user client
      const unauthorizedClient = await TestClient.forUser(unauthorizedUser);

      // Attempt to decommission as unauthorized user - should fail
      try {
        await unauthorizedClient.decommissionBaskt(basktId);
        expect.fail('Should have thrown Unauthorized error');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Unauthorized');
      }

      // Verify baskt is still active
      const basktAfter = await client.getBasktRaw(basktId);
      const activeValidation = validateBasktActive(basktAfter.status);
      expect(activeValidation.isValid).to.be.true;
    });

    it('Successfully allows baskt creator to decommission their own baskt', async () => {
      // Create a new test user to be the baskt creator
      const creatorUser = Keypair.generate();
      const creatorClient = await TestClient.forUser(creatorUser);

      // Create assets for the new creator
      const creatorBtcAssetId = await client.addAsset('BTC');
      const creatorEthAssetId = await client.addAsset('ETH');

      // Create asset configs for the baskt
      const assets: OnchainAssetConfig[] = [
        {
          assetId: creatorBtcAssetId.assetAddress,
          direction: true,
          weight: new BN(6000), // 60% BTC
          baselinePrice: new BN(0),
        },
        {
          assetId: creatorEthAssetId.assetAddress,
          direction: true,
          weight: new BN(4000), // 40% ETH
          baselinePrice: new BN(0),
        },
      ];

      
      // Create the baskt as the creator
      const { basktId } = await creatorClient.createBaskt(assets, true);

      // Activate the baskt
      const prices = [new BN(50000), new BN(3000)]; // BTC and ETH prices
      await client.activateBaskt(basktId, prices);

      // Decommission the baskt as the creator
      await creatorClient.decommissionBaskt(basktId);

      // Verify baskt is now decommissioning
      const basktAfter = await creatorClient.getBasktRaw(basktId);
      const decommissioningValidation = validateBasktDecommissioning(basktAfter.status);
      expect(decommissioningValidation.isValid).to.be.true;
      expect(decommissioningValidation.details).to.not.be.undefined;
      
    });
  });


});
