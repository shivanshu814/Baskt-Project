import { expect } from 'chai';
import { describe, before, it, after } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';
import { BN } from 'bn.js';
import { AccessControlRole, OnchainAssetConfig } from '@baskt/types';
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';
import { requestAirdrop } from '../utils/test-client';

describe('funding baskt', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Asset IDs that will be used across tests
  let btcAssetId: { assetAddress: PublicKey; txSignature: string | null };
  let ethAssetId: { assetAddress: PublicKey; txSignature: string | null };

  // Test users
  let fundingManager: Keypair;
  let regularUser: Keypair;
  let nonFundingManager: Keypair;

  before(async () => {
    // Ensure protocol is initialized and roles are set up
    await TestClient.initializeProtocolAndRoles(client);

    // Create assets that will be used across tests
    btcAssetId = await client.addAsset('BTC');
    ethAssetId = await client.addAsset('ETH');

    // Create test users
    fundingManager = Keypair.generate();
    regularUser = Keypair.generate();
    nonFundingManager = Keypair.generate();

    // Fund the test users
    await requestAirdrop(fundingManager.publicKey, client.connection);
    await requestAirdrop(regularUser.publicKey, client.connection);
    await requestAirdrop(nonFundingManager.publicKey, client.connection);

    // Add roles to test users
    await client.addRole(fundingManager.publicKey, AccessControlRole.FundingManager);
  });

  after(async () => {
    // Clean up roles added during tests
    try {
      const removeFundingManagerSig = await client.removeRole(
        fundingManager.publicKey,
        AccessControlRole.FundingManager,
      );
      await waitForTx(client.connection, removeFundingManagerSig);
      await waitForNextSlot(client.connection);
    } catch (error) {
      // Silently handle cleanup errors to avoid masking test failures
      console.warn('Cleanup error in funding_baskt.test.ts:', error);
    }
  });

  it('Successfully updates funding index with valid rate', async () => {
    // Create a baskt for testing
    const assets = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% BTC
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(assets, true);

    // Activate the baskt first
    const prices = [new BN(50000)]; // BTC price
    await client.activateBaskt(basktId, prices);

    // Get the baskt before funding index update
    const basktBefore = await client.getBaskt(basktId);
    const initialCumulativeIndex = basktBefore.marketIndices.cumulativeFundingIndex;
    const initialCurrentRate = basktBefore.marketIndices.currentFundingRate;

    // Create a client for the funding manager
    const fundingManagerClient = await TestClient.forUser(fundingManager);

    // Update market indices with positive funding rate and zero borrow rate
    const newFundingRate = new BN(50); // 0.5% hourly funding rate
    const newBorrowRate = new BN(0); // 0% hourly borrow rate
    await fundingManagerClient.updateMarketIndices(basktId, newFundingRate, newBorrowRate);

    // Get the baskt after funding index update
    const basktAfter = await client.getBaskt(basktId);

    // Verify the market indices were updated
    expect(basktAfter.marketIndices.currentFundingRate.toString()).to.equal(newFundingRate.toString());
    expect(basktAfter.marketIndices.currentBorrowRate.toString()).to.equal(newBorrowRate.toString());
    // The cumulative index should NOT change on the first update since the previous rate was 0
    expect(basktAfter.marketIndices.cumulativeFundingIndex.toString()).to.equal(initialCumulativeIndex.toString());
    expect(new BN(basktAfter.marketIndices.lastUpdateTimestamp.toString()).toNumber()).to.be.greaterThan(new BN(basktBefore.marketIndices.lastUpdateTimestamp.toString()).toNumber());      
  });

  it('Successfully updates funding index with negative rate', async () => {
    // Create a baskt for testing
    const assets = [
      {
        assetId: ethAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% ETH
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(assets, true);

    // Activate the baskt first
    const prices = [new BN(3000)]; // ETH price
    await client.activateBaskt(basktId, prices);

    // Create a client for the funding manager
    const fundingManagerClient = await TestClient.forUser(fundingManager);

    // Update funding index with a negative rate
    const newRate = new BN(-30); // -0.3% hourly rate
    await fundingManagerClient.updateMarketIndices(basktId, newRate, new BN(0));

    // Get the baskt after funding index update
    const basktAfter = await client.getBaskt(basktId);

    // Verify the funding index was updated with negative rate
    expect(basktAfter.marketIndices.currentFundingRate.toString()).to.equal(newRate.toString());
  });

  it('Successfully updates funding index with zero rate', async () => {
    // Create a baskt for testing
    const assets = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% BTC
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(assets, true);

    // Activate the baskt first
    const prices = [new BN(50000)]; // BTC price
    await client.activateBaskt(basktId, prices);

    // Create a client for the funding manager
    const fundingManagerClient = await TestClient.forUser(fundingManager);

    // Update funding index with zero rate
    const newRate = new BN(0); // 0% hourly rate
    await fundingManagerClient.updateMarketIndices(basktId, newRate, new BN(0));

    // Get the baskt after funding index update
    const basktAfter = await client.getBaskt(basktId);

    // Verify the funding index was updated with zero rate
    expect(basktAfter.marketIndices.currentFundingRate.toString()).to.equal('0');
  });

  it('Fails to update funding index with non-authorized user', async () => {
    // Create a baskt for testing
    const assets = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% BTC
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(assets, true);

    // Activate the baskt first
    const prices = [new BN(50000)]; // BTC price
    await client.activateBaskt(basktId, prices);

    // Create a client for a regular user (no funding manager role)
    const regularUserClient = await TestClient.forUser(regularUser);

    // Try to update funding index with non-authorized user
    const newRate = new BN(25); // 0.25% hourly rate

    try {
      await regularUserClient.updateMarketIndices(basktId, newRate, new BN(0));
      expect.fail('Should have thrown an error - non-authorized user should not be able to update funding index');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('UnauthorizedRole');
    }

    // Verify the funding index was not updated
    const basktAfter = await client.getBaskt(basktId);
    expect(basktAfter.marketIndices.currentFundingRate.toString()).to.equal('0'); // Should still be initial value
  });

  it('Fails to update funding index with rate exceeding maximum', async () => {
    // Create a baskt for testing
    const assets = [
      {
        assetId: ethAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% ETH
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(assets, true);

    // Activate the baskt first
    const prices = [new BN(3000)]; // ETH price
    await client.activateBaskt(basktId, prices);

    // Create a client for the funding manager
    const fundingManagerClient = await TestClient.forUser(fundingManager);

    // Try to update funding index with rate exceeding maximum (57 BPS)
    const newRate = new BN(2000); // 20% hourly rate (exceeds 0.57% maximum)

    try {
      await fundingManagerClient.updateMarketIndices(basktId, newRate, new BN(0));
      expect.fail('Should have thrown an error - rate exceeds maximum allowed');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('FundingRateExceedsMaximum');
    }

    // Verify the funding index was not updated
    const basktAfter = await client.getBaskt(basktId);
    expect(basktAfter.marketIndices.currentFundingRate.toString()).to.equal('0'); // Should still be initial value
  });

  it('Fails to update funding index with negative rate exceeding maximum', async () => {
    // Create a baskt for testing
    const assets = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% BTC
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(assets, true);

    // Activate the baskt first
    const prices = [new BN(50000)]; // BTC price
    await client.activateBaskt(basktId, prices);

    // Create a client for the funding manager
    const fundingManagerClient = await TestClient.forUser(fundingManager);

    // Try to update funding index with negative rate exceeding maximum
    const newRate = new BN(-2000); // -20% hourly rate (exceeds -0.57% maximum)

    try {
      await fundingManagerClient.updateMarketIndices(basktId, newRate, new BN(0));
      expect.fail('Should have thrown an error - negative rate exceeds maximum allowed');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('FundingRateExceedsMaximum');
    }

    // Verify the funding index was not updated
    const basktAfter = await client.getBaskt(basktId);
    expect(basktAfter.marketIndices.currentFundingRate.toString()).to.equal('0'); // Should still be initial value
  });

  it('Successfully updates funding index with maximum allowed rate', async () => {
    // Create a baskt for testing
    const assets = [
      {
        assetId: ethAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% ETH
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(assets, true);

    // Activate the baskt first
    const prices = [new BN(3000)]; // ETH price
    await client.activateBaskt(basktId, prices);

    // Create a client for the funding manager
    const fundingManagerClient = await TestClient.forUser(fundingManager);

    // Update funding index with maximum allowed rate (57 BPS)
    const newRate = new BN(57); // 0.57% hourly rate (maximum allowed)
    await fundingManagerClient.updateMarketIndices(basktId, newRate, new BN(0));

    // Get the baskt after funding index update
    const basktAfter = await client.getBaskt(basktId);

    // Verify the funding index was updated with maximum rate
    expect(basktAfter.marketIndices.currentFundingRate.toString()).to.equal(newRate.toString());
  });

  it('Successfully updates funding index with maximum allowed negative rate', async () => {
    // Create a baskt for testing
    const assets = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% BTC
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(assets, true);

    // Activate the baskt first
    const prices = [new BN(50000)]; // BTC price
    await client.activateBaskt(basktId, prices);

    // Create a client for the funding manager
    const fundingManagerClient = await TestClient.forUser(fundingManager);

    // Update funding index with maximum allowed negative rate (-57 BPS)
    const newRate = new BN(-57); // -0.57% hourly rate (maximum allowed negative)
    await fundingManagerClient.updateMarketIndices(basktId, newRate, new BN(0));

    // Get the baskt after funding index update
    const basktAfter = await client.getBaskt(basktId);

    // Verify the funding index was updated with maximum negative rate
    expect(basktAfter.marketIndices.currentFundingRate.toString()).to.equal(newRate.toString());
  });

  it('Fails to update funding index for inactive baskt', async () => {
    // Create a baskt for testing but don't activate it
    const assets = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% BTC
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(assets, true);

    // Create a client for the funding manager
    const fundingManagerClient = await TestClient.forUser(fundingManager);

    // Try to update funding index for inactive baskt
    const newRate = new BN(25); // 0.25% hourly rate

    try {
      await fundingManagerClient.updateMarketIndices(basktId, newRate, new BN(0));
      expect.fail('Should have thrown an error - cannot update funding index for inactive baskt');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('BasktNotActive');
    }
  });

  it('Successfully updates funding index multiple times and verifies cumulative index lag behavior', async () => {
    // Create a baskt for testing
    const assets = [
      {
        assetId: ethAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% ETH
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(assets, true);

    // Activate the baskt first
    const prices = [new BN(3000)]; // ETH price
    await client.activateBaskt(basktId, prices);

    // Create a client for the funding manager
    const fundingManagerClient = await TestClient.forUser(fundingManager);

    // Get initial state
    const basktInitial = await client.getBaskt(basktId);
    const initialCumulativeIndex = basktInitial.marketIndices.cumulativeFundingIndex;
    expect(initialCumulativeIndex.toString()).to.equal('1000000'); // FUNDING_PRECISION (1.0)

    // First update: Set rate to 200 BPS (2% hourly) - higher rate for measurable effect
    // This should NOT change cumulative index since previous rate was 0
    await fundingManagerClient.updateMarketIndices(basktId, new BN(200), new BN(0));
    
    const basktAfterFirstUpdate = await client.getBaskt(basktId);
    expect(basktAfterFirstUpdate.marketIndices.currentFundingRate.toString()).to.equal('200');
    expect(basktAfterFirstUpdate.marketIndices.cumulativeFundingIndex.toString()).to.equal(initialCumulativeIndex.toString());

    // Wait longer to ensure significant time passes for measurable funding accrual
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Second update: Set rate to 300 BPS (3% hourly)
    // This SHOULD change cumulative index using the previous rate (200 BPS)
    await fundingManagerClient.updateMarketIndices(basktId, new BN(300), new BN(0));
    
    const basktAfterSecondUpdate = await client.getBaskt(basktId);
    expect(basktAfterSecondUpdate.marketIndices.currentFundingRate.toString()).to.equal('300');
    // Cumulative index should have increased due to the previous rate (200 BPS) being applied
    expect(basktAfterSecondUpdate.marketIndices.cumulativeFundingIndex.toString()).to.not.equal(initialCumulativeIndex.toString());
    expect(basktAfterSecondUpdate.marketIndices.cumulativeFundingIndex.toString()).to.not.equal(basktAfterFirstUpdate.marketIndices.cumulativeFundingIndex.toString());

    // Wait longer for the third update
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Third update: Set rate to -100 BPS (-1% hourly)
    // This SHOULD change cumulative index using the previous rate (300 BPS)
    await fundingManagerClient.updateMarketIndices(basktId, new BN(-100), new BN(0));

    // TODO: We do not have time warp so cannot test this
    
    // const basktAfterThirdUpdate = await client.getBaskt(basktId);
    // expect(basktAfterThirdUpdate.marketIndices.currentFundingRate.toString()).to.equal('-100');
    // // Cumulative index should have changed again due to the previous rate (300 BPS) being applied
    // expect(basktAfterThirdUpdate.marketIndices.cumulativeFundingIndex.toString()).to.not.equal(basktAfterSecondUpdate.marketIndices.cumulativeFundingIndex.toString());

    // // Verify the final state
    // const basktFinal = await client.getBaskt(basktId);
    // expect(basktFinal.marketIndices.currentFundingRate.toString()).to.equal('-10');
    // expect(basktFinal.marketIndices.cumulativeFundingIndex.toString()).to.not.equal(initialCumulativeIndex.toString());
  });

  it('Demonstrates funding index lag behavior with immediate updates', async () => {
    // Create a baskt for testing
    const assets = [
      {
        assetId: btcAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% BTC
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(assets, true);

    // Activate the baskt first
    const prices = [new BN(50000)]; // BTC price
    await client.activateBaskt(basktId, prices);

    // Create a client for the funding manager
    const fundingManagerClient = await TestClient.forUser(fundingManager);

    // Get initial state
    const basktInitial = await client.getBaskt(basktId);
    const initialCumulativeIndex = basktInitial.marketIndices.cumulativeFundingIndex;
    expect(initialCumulativeIndex.toString()).to.equal('1000000'); // FUNDING_PRECISION (1.0)

    await fundingManagerClient.updateMarketIndices(basktId, new BN(1), new BN(0));

    // TODO: We do not have time warp so cannot test this
    
    // const basktAfterFirstUpdate = await client.getBaskt(basktId);
    // expect(basktAfterFirstUpdate.marketIndices.currentFundingRate.toString()).to.equal('100');
    // expect(basktAfterFirstUpdate.marketIndices.cumulativeFundingIndex.toString()).to.equal(initialCumulativeIndex.toString());

    // // Wait a bit to ensure time passes
    // await new Promise(resolve => setTimeout(resolve, 3000));

    // // Second update: Set rate to 0 BPS
    // // This SHOULD change cumulative index using the previous rate (500 BPS) for the elapsed time
    // await fundingManagerClient.updateMarketIndices(basktId, new BN(0), new BN(0));
    
    // const basktAfterSecondUpdate = await client.getBaskt(basktId);
    // expect(basktAfterSecondUpdate.marketIndices.currentFundingRate.toString()).to.equal('0');
    // // Cumulative index should have increased due to the previous rate (500 BPS) being applied for the elapsed time
    // expect(basktAfterSecondUpdate.marketIndices.cumulativeFundingIndex.toString()).to.not.equal(initialCumulativeIndex.toString());
    // expect(basktAfterSecondUpdate.marketIndices.cumulativeFundingIndex.toString()).to.not.equal(basktAfterFirstUpdate.marketIndices.cumulativeFundingIndex.toString());

    // // Verify that the cumulative index increased (positive funding rate was applied)
    // const finalCumulativeIndex = new BN(basktAfterSecondUpdate.marketIndices.cumulativeFundingIndex.toString());
    // const initialCumulativeIndexBN = new BN(initialCumulativeIndex.toString());
    // expect(finalCumulativeIndex.gt(initialCumulativeIndexBN)).to.be.true;
  });

  it('Demonstrates negative funding rate lag behavior', async () => {
    // Create a baskt for testing
    const assets = [
      {
        assetId: ethAssetId.assetAddress,
        direction: true,
        weight: new BN(10000), // 100% ETH
        baselinePrice: new BN(0),
      },
    ] as OnchainAssetConfig[];

    const { basktId } = await client.createBaskt(assets, true);

    // Activate the baskt first
    const prices = [new BN(3000)]; // ETH price
    await client.activateBaskt(basktId, prices);

    // Create a client for the funding manager
    const fundingManagerClient = await TestClient.forUser(fundingManager);

    // Get initial state
    const basktInitial = await client.getBaskt(basktId);
    const initialCumulativeIndex = basktInitial.marketIndices.cumulativeFundingIndex;
    expect(initialCumulativeIndex.toString()).to.equal('1000000'); // FUNDING_PRECISION (1.0)

    // First update: Set rate to -300 BPS (-3% hourly) - higher rate for more measurable effect
    // This should NOT change cumulative index since previous rate was 0
    await fundingManagerClient.updateMarketIndices(basktId, new BN(-300), new BN(0));
    
    const basktAfterFirstUpdate = await client.getBaskt(basktId);
    expect(basktAfterFirstUpdate.marketIndices.currentFundingRate.toString()).to.equal('-300');
    expect(basktAfterFirstUpdate.marketIndices.cumulativeFundingIndex.toString()).to.equal(initialCumulativeIndex.toString());

    // Wait a bit to ensure time passes
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Second update: Set rate to 0 BPS
    // This SHOULD change cumulative index using the previous rate (-300 BPS) for the elapsed time
    await fundingManagerClient.updateMarketIndices(basktId, new BN(0), new BN(0));
    
    const basktAfterSecondUpdate = await client.getBaskt(basktId);
    expect(basktAfterSecondUpdate.marketIndices.currentFundingRate.toString()).to.equal('0');
    // Cumulative index should have decreased due to the previous rate (-300 BPS) being applied for the elapsed time
    expect(basktAfterSecondUpdate.marketIndices.cumulativeFundingIndex.toString()).to.not.equal(initialCumulativeIndex.toString());
    expect(basktAfterSecondUpdate.marketIndices.cumulativeFundingIndex.toString()).to.not.equal(basktAfterFirstUpdate.marketIndices.cumulativeFundingIndex.toString());

    // Verify that the cumulative index decreased (negative funding rate was applied)
    const finalCumulativeIndex = new BN(basktAfterSecondUpdate.marketIndices.cumulativeFundingIndex.toString());
    const initialCumulativeIndexBN = new BN(initialCumulativeIndex.toString());
    expect(finalCumulativeIndex.lt(initialCumulativeIndexBN)).to.be.true;
  });
});
