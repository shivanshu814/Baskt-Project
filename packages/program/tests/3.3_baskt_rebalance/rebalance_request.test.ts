import { expect } from 'chai';
import { describe, before, it, afterEach } from 'mocha';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { requestAirdrop, TestClient } from '../utils/test-client';
import { BN } from 'bn.js';
import { OnchainAssetConfig } from '@baskt/types';
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';

type AssetId = {
  assetAddress: PublicKey;
  txSignature: string | null;
};

describe('rebalance request', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test users
  let creator: Keypair;
  let nonCreator: Keypair;

  // Asset IDs that will be used across tests
  let btcAssetId: AssetId;
  let ethAssetId: AssetId;

  // Test baskt
  let basktId: PublicKey;
  let basktName: string;

  // Test clients
  let creatorClient: TestClient;
  let nonCreatorClient: TestClient;

  before(async () => {
    // Ensure protocol is initialized and roles are set up
    await TestClient.initializeProtocolAndRoles(client);


    // Create assets that will be used across tests
    btcAssetId = await client.addAsset('BTC');
    ethAssetId = await client.addAsset('ETH');

    // Create test users
    creator = Keypair.generate();
    nonCreator = Keypair.generate();

    // Create test clients for different users
    creatorClient = await TestClient.forUser(creator);
    nonCreatorClient = await TestClient.forUser(nonCreator);

    // Enable feature flags
    await client.updateFeatureFlags({
      allowAddLiquidity: true,
      allowRemoveLiquidity: true,
      allowOpenPosition: true,
      allowClosePosition: true,
      allowPnlWithdrawal: true,
      allowCollateralWithdrawal: true,
      allowAddCollateral: true,
      allowBasktCreation: true,
      allowBasktUpdate: true,
      allowTrading: true,
      allowLiquidations: true,
    });
  });

  afterEach(async () => {
    // Reset feature flags after each test
    try {
      const resetSig = await TestClient.resetFeatureFlags(client);
      await waitForTx(client.connection, resetSig);
      await waitForNextSlot(client.connection);
    } catch (error) {
      console.warn('Error resetting feature flags:', error);
    }
  });

  // Helper function to create and activate a test baskt
  async function createAndActivateBaskt(
    name: string,
    creatorClient: TestClient,
  ): Promise<PublicKey> {
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

    const { basktId } = await creatorClient.createBaskt(assets, true);

    // Activate the baskt (creator can activate their own baskt)
    const btcPrice = new BN(50000_000000); // $50,000
    const ethPrice = new BN(3000_000000); // $3,000
    await client.activateBaskt(basktId, [btcPrice, ethPrice]);

    return basktId;
  }

  describe('successful rebalance request and authorization', () => {
    let initialFeeLamports: number;
    let testFeeLamports: number;
    let testFeeSol: number;

    beforeEach(async () => {
      // Create a fresh baskt for each test
      basktId = await createAndActivateBaskt('RebalReqTest', creatorClient);
      
      // Get initial fee configuration and set test fee
      const protocol = await client.getProtocolAccount();
      initialFeeLamports = protocol.config.rebalanceRequestFeeLamports.toNumber();
      testFeeSol = 0.001;
      testFeeLamports = testFeeSol * LAMPORTS_PER_SOL;
      await client.setRebalanceRequestFee(testFeeLamports);
    });

    afterEach(async () => {
      // Restore original fee
      await client.setRebalanceRequestFee(initialFeeLamports);
    });

    it('Successfully requests rebalance as creator and fails for non-creators', async () => {
      // Get initial balances for fee verification
      const initialCreatorBalance = await client.connection.getBalance(creator.publicKey);
      const protocol = await client.getProtocolAccount();
      const treasuryAddress = new PublicKey(protocol.treasury);
      const initialTreasuryBalance = await client.connection.getBalance(treasuryAddress);

      // Test successful rebalance request as creator
      const txSignature = await creatorClient.rebalanceRequest(basktId);
      expect(txSignature).to.be.a('string');

      // Verify fee was charged and transferred
      const finalCreatorBalance = await client.connection.getBalance(creator.publicKey);
      const creatorBalanceDifference = initialCreatorBalance - finalCreatorBalance;
      expect(creatorBalanceDifference).to.be.greaterThanOrEqual(testFeeLamports);
      
      const finalTreasuryBalance = await client.connection.getBalance(treasuryAddress);
      const treasuryBalanceIncrease = finalTreasuryBalance - initialTreasuryBalance;
      expect(treasuryBalanceIncrease).to.equal(testFeeLamports);

      // Verify the baskt state hasn't changed (request only emits event)
      const basktAfter = await client.getBasktRaw(basktId);
      expect(basktAfter.status).to.deep.equal({ active: {} });

      // Test failure for non-creator (should not charge fee)
      const initialNonCreatorBalance = await client.connection.getBalance(nonCreator.publicKey);
      const initialTreasuryBalance2 = await client.connection.getBalance(treasuryAddress);

      try {
        await nonCreatorClient.rebalanceRequest(basktId);
        expect.fail('Should have thrown Unauthorized error');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Unauthorized');
      }

      // Verify no fee was charged for failed request
      const finalNonCreatorBalance = await client.connection.getBalance(nonCreator.publicKey);
      const nonCreatorBalanceDifference = initialNonCreatorBalance - finalNonCreatorBalance;
      expect(nonCreatorBalanceDifference).to.be.lessThan(10000); // Minimal transaction fees only

      const finalTreasuryBalance2 = await client.connection.getBalance(treasuryAddress);
      const treasuryBalanceChange2 = finalTreasuryBalance2 - initialTreasuryBalance2;
      expect(treasuryBalanceChange2).to.equal(0); // No fee transfer for failed request

      // Test failure for unauthorized user
      const unauthorizedUser = Keypair.generate();
      const unauthorizedClient = await TestClient.forUser(unauthorizedUser);

      try {
        await unauthorizedClient.rebalanceRequest(basktId);
        expect.fail('Should have thrown Unauthorized error');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Unauthorized');
      }

      // Verify baskt state is unchanged
      const basktAfterAuth = await client.getBasktRaw(basktId);
      expect(basktAfterAuth.status).to.deep.equal({ active: {} });
    });

    it('Works with different baskt configurations and fails for pending baskts', async () => {
      // Test different baskt configuration with fee verification
      const assets = [
        {
          assetId: btcAssetId.assetAddress,
          direction: false, // Short BTC
          weight: new BN(3000), // 30% BTC
          baselinePrice: new BN(0),
        },
        {
          assetId: ethAssetId.assetAddress,
          direction: true, // Long ETH
          weight: new BN(7000), // 70% ETH
          baselinePrice: new BN(0),
        },
      ] as OnchainAssetConfig[];

      const { basktId: diffBasktId } = await creatorClient.createBaskt(assets, true);
      await client.activateBaskt(diffBasktId, [new BN(50000_000000), new BN(3000_000000)]);

      // Get initial balances for fee verification
      const initialCreatorBalance = await client.connection.getBalance(creator.publicKey);
      const protocol = await client.getProtocolAccount();
      const treasuryAddress = new PublicKey(protocol.treasury);
      const initialTreasuryBalance = await client.connection.getBalance(treasuryAddress);

      const txSignature = await creatorClient.rebalanceRequest(diffBasktId);
      expect(txSignature).to.be.a('string');

      // Verify fee was charged and transferred
      const finalCreatorBalance = await client.connection.getBalance(creator.publicKey);
      const creatorBalanceDifference = initialCreatorBalance - finalCreatorBalance;
      expect(creatorBalanceDifference).to.be.greaterThanOrEqual(testFeeLamports);
      
      const finalTreasuryBalance = await client.connection.getBalance(treasuryAddress);
      const treasuryBalanceIncrease = finalTreasuryBalance - initialTreasuryBalance;
      expect(treasuryBalanceIncrease).to.equal(testFeeLamports);

      // Test failure for pending baskt (should not charge fee)
      const pendingAssets = [
        {
          assetId: btcAssetId.assetAddress,
          direction: true,
          weight: new BN(10000), // 100% BTC
          baselinePrice: new BN(0),
        },
      ] as OnchainAssetConfig[];

      const { basktId: pendingBasktId } = await creatorClient.createBaskt(pendingAssets, true);

      const initialCreatorBalance2 = await client.connection.getBalance(creator.publicKey);
      const initialTreasuryBalance2 = await client.connection.getBalance(treasuryAddress);

      try {
        await creatorClient.rebalanceRequest(pendingBasktId);
        expect.fail('Should have thrown BasktNotActive error');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('BasktNotActive');
      }

      // Verify no fee was charged for failed request
      const finalCreatorBalance2 = await client.connection.getBalance(creator.publicKey);
      const creatorBalanceDifference2 = initialCreatorBalance2 - finalCreatorBalance2;
      expect(creatorBalanceDifference2).to.be.lessThan(10000); // Minimal transaction fees only

      const finalTreasuryBalance2 = await client.connection.getBalance(treasuryAddress);
      const treasuryBalanceChange2 = finalTreasuryBalance2 - initialTreasuryBalance2;
      expect(treasuryBalanceChange2).to.equal(0); // No fee transfer for failed request

      // Verify pending baskt is still pending
      const basktAfter = await client.getBasktRaw(pendingBasktId);
      expect(basktAfter.status).to.deep.equal({ pending: {} });
    });
  });

  describe('integration scenarios and SOL fee functionality', () => {
    let initialFeeLamports: number;
    let testFeeLamports: number;
    let testFeeSol: number;

    beforeEach(async () => {
      // Create a fresh baskt for each test
      basktId = await createAndActivateBaskt('IntegrationTest', creatorClient);
      
      // Get initial fee configuration
      const protocol = await client.getProtocolAccount();
      initialFeeLamports = protocol.config.rebalanceRequestFeeLamports.toNumber();
      
      // Set a test fee for these tests
      testFeeSol = 0.001;
      testFeeLamports = testFeeSol * LAMPORTS_PER_SOL;
      await client.setRebalanceRequestFee(testFeeLamports);
    });

    afterEach(async () => {
      // Restore original fee
      await client.setRebalanceRequestFee(initialFeeLamports);
    });

    it('Multiple rebalance requests and fee charging with treasury transfer', async () => {
      // Test multiple rebalance requests with fee verification
      const initialCreatorBalance = await client.connection.getBalance(creator.publicKey);
      const protocol = await client.getProtocolAccount();
      const treasuryAddress = new PublicKey(protocol.treasury);
      const initialTreasuryBalance = await client.connection.getBalance(treasuryAddress);

      const txSignature1 = await creatorClient.rebalanceRequest(basktId);
      expect(txSignature1).to.be.a('string');

      // Verify first fee was charged and transferred
      const creatorBalanceAfter1 = await client.connection.getBalance(creator.publicKey);
      const creatorBalanceDifference1 = initialCreatorBalance - creatorBalanceAfter1;
      expect(creatorBalanceDifference1).to.be.greaterThanOrEqual(testFeeLamports);
      
      const treasuryBalanceAfter1 = await client.connection.getBalance(treasuryAddress);
      const treasuryBalanceIncrease1 = treasuryBalanceAfter1 - initialTreasuryBalance;
      expect(treasuryBalanceIncrease1).to.equal(testFeeLamports);

      await client.waitForSeconds(1);

      const txSignature2 = await creatorClient.rebalanceRequest(basktId);
      expect(txSignature2).to.be.a('string');

      // Verify second fee was charged and transferred
      const creatorBalanceAfter2 = await client.connection.getBalance(creator.publicKey);
      const creatorBalanceDifference2 = creatorBalanceAfter1 - creatorBalanceAfter2;
      expect(creatorBalanceDifference2).to.be.greaterThanOrEqual(testFeeLamports);
      
      const treasuryBalanceAfter2 = await client.connection.getBalance(treasuryAddress);
      const treasuryBalanceIncrease2 = treasuryBalanceAfter2 - treasuryBalanceAfter1;
      expect(treasuryBalanceIncrease2).to.equal(testFeeLamports);

      expect(txSignature1).to.not.equal(txSignature2);

      // Verify baskt state is still active
      const basktAfter = await client.getBasktRaw(basktId);
      expect(basktAfter.status).to.deep.equal({ active: {} });
    });

    it('Rebalance request followed by actual rebalance and edge cases', async () => {
      // First, request a rebalance with fee verification
      const initialCreatorBalance = await client.connection.getBalance(creator.publicKey);
      const protocol = await client.getProtocolAccount();
      const treasuryAddress = new PublicKey(protocol.treasury);
      const initialTreasuryBalance = await client.connection.getBalance(treasuryAddress);

      const requestTxSignature = await creatorClient.rebalanceRequest(basktId);
      expect(requestTxSignature).to.be.a('string');

      // Verify fee was charged and transferred
      const creatorBalanceAfterRequest = await client.connection.getBalance(creator.publicKey);
      const creatorBalanceDifference = initialCreatorBalance - creatorBalanceAfterRequest;
      expect(creatorBalanceDifference).to.be.greaterThanOrEqual(testFeeLamports);
      
      const treasuryBalanceAfterRequest = await client.connection.getBalance(treasuryAddress);
      const treasuryBalanceIncrease = treasuryBalanceAfterRequest - initialTreasuryBalance;
      expect(treasuryBalanceIncrease).to.equal(testFeeLamports);

      // Then perform an actual rebalance with new asset configs
      const newAssetConfigs = [
        {
          assetId: btcAssetId.assetAddress,
          direction: true,
          weight: new BN(5000), // 50% BTC (was 60%)
          baselinePrice: new BN(100),
        },
        {
          assetId: ethAssetId.assetAddress,
          direction: true,
          weight: new BN(5000), // 50% ETH (was 40%)
          baselinePrice: new BN(100),
        },
      ] as OnchainAssetConfig[];

      const basktBefore = await client.getBasktRaw(basktId);
      await client.waitForSeconds(1);

      const rebalanceTxSignature = await client.rebalanceBaskt(
        basktId,
        newAssetConfigs,
        new BN(100),
      );
      expect(rebalanceTxSignature).to.be.a('string');

      // Verify the rebalance was successful
      const basktAfter = await client.getBasktRaw(basktId, 'confirmed');
      expect(new BN(basktAfter.lastRebalanceTime).toNumber()).to.be.greaterThan(
        new BN(basktBefore.lastRebalanceTime).toNumber(),
      );


      // Test zero fee scenario
      await client.setRebalanceRequestFee(0);
      const initialBalance = await client.connection.getBalance(creator.publicKey);
      
      const zeroFeeTxSignature = await creatorClient.rebalanceRequest(basktId);
      expect(zeroFeeTxSignature).to.be.a('string');

      const finalBalance = await client.connection.getBalance(creator.publicKey);
      const balanceDifference = initialBalance - finalBalance;
      expect(balanceDifference).to.be.lessThan(10000); // Less than 0.00001 SOL
    });

    it('Dynamic fee updates and ConfigManager access', async () => {
      // Test fee update
      const newFeeLamports = 2000000; // 0.002 SOL
      await client.setRebalanceRequestFee(newFeeLamports);
      
      const initialBalance = await client.connection.getBalance(creator.publicKey);
      
      const txSignature = await creatorClient.rebalanceRequest(basktId);
      expect(txSignature).to.be.a('string');

      const finalBalance = await client.connection.getBalance(creator.publicKey);
      const balanceDifference = initialBalance - finalBalance;
      expect(balanceDifference).to.be.greaterThanOrEqual(newFeeLamports);
    });
  });
});
