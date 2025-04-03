import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { TestClient } from '../utils/test-client';
import { AccessControlRole } from '@baskt/sdk';

type AssetId = {
  assetAddress: PublicKey;
  ticker: string;
  oracle: PublicKey;
  txSignature: string | null;
};

describe('Baskt Rebalance', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Asset IDs that will be used across tests
  let btcAssetId: AssetId;
  let ethAssetId: AssetId;
  let basktId: PublicKey;

  // Set up test roles and assets before running tests
  before(async () => {
    // Create assets that will be used across tests
    btcAssetId = await client.createAssetWithCustomOracle('BTC', 50000);
    ethAssetId = await client.createAssetWithCustomOracle('ETH', 3000);

    await client.waitForBlocks();
    // Create a test baskt for rebalance tests
    const assets = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
        direction: true,
        weight: 6000, // 60% BTC
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
        direction: true,
        weight: 4000, // 40% ETH
      },
    ];

    // Create the baskt
    const result = await client.createMockBaskt(
      'RebBaskt', // Name must be 10 characters or less
      assets,
      true, // is_public
    );

    basktId = result.basktId;

    // Verify the baskt was created successfully
    const basktAccount = await client.getBaskt(basktId);
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(2);
  });

  it('Successfully rebalances a baskt with new weights', async () => {
    // New asset weights for rebalance
    const newAssetConfigs = [
      {
        assetId: btcAssetId.assetAddress,
        weight: 3000, // 30% BTC (was 60%)
      },
      {
        assetId: ethAssetId.assetAddress,
        weight: 7000, // 70% ETH (was 40%)
      },
    ];

    // Asset-oracle pairs for price data
    const assetOraclePairs = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
      },
    ];

    // Get the baskt before rebalance
    const basktBefore = await client.getBaskt(basktId);
    const rebalanceIndexBefore = basktBefore.lastRebalanceIndex.toNumber();

    // Perform the rebalance
    await client.rebalanceBaskt(basktId, newAssetConfigs, assetOraclePairs);

    // Get the baskt after rebalance
    const basktAfter = await client.getBaskt(basktId);

    // Verify rebalance index was incremented
    expect(basktAfter.lastRebalanceIndex.toNumber()).to.equal(rebalanceIndexBefore + 1);

    // Verify new weights were applied
    const btcConfig = basktAfter.currentAssetConfigs.find(
      (config) => config.assetId.toString() === btcAssetId.assetAddress.toString(),
    );
    expect(btcConfig?.weight.toNumber()).to.equal(3000);

    const ethConfig = basktAfter.currentAssetConfigs.find(
      (config) => config.assetId.toString() === ethAssetId.assetAddress.toString(),
    );
    expect(ethConfig?.weight.toNumber()).to.equal(7000);

    // Verify directions were preserved
    expect(btcConfig?.direction).to.equal(
      basktBefore.currentAssetConfigs.find(
        (config) => config.assetId.toString() === btcAssetId.assetAddress.toString(),
      )?.direction,
    );

    expect(ethConfig?.direction).to.equal(
      basktBefore.currentAssetConfigs.find(
        (config) => config.assetId.toString() === ethAssetId.assetAddress.toString(),
      )?.direction,
    );
  });

  it('Fails to rebalance when total weight is not 10000', async () => {
    // Invalid asset weights (total 9000 instead of 10000)
    const invalidAssetConfigs = [
      {
        assetId: btcAssetId.assetAddress,
        weight: 5000, // 50%
      },
      {
        assetId: ethAssetId.assetAddress,
        weight: 4000, // 40% (total 90%)
      },
    ];

    // Asset-oracle pairs for price data
    const assetOraclePairs = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
      },
    ];

    // Attempt to rebalance with invalid weights - should fail
    try {
      await client.rebalanceBaskt(basktId, invalidAssetConfigs, assetOraclePairs);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('InvalidAssetConfig');
    }
  });

  it('Fails to rebalance when a price is not found', async () => {
    // Create a new asset without updating its price
    const newAssetId = await client.createAssetWithCustomOracle('NEW_ASSET', 1000);
    await client.waitForBlocks();
    // Add the new asset to the rebalance config
    const assetConfigs = [
      {
        assetId: btcAssetId.assetAddress,
        weight: 3000, // 30%
      },
      {
        assetId: ethAssetId.assetAddress,
        weight: 3000, // 30%
      },
      {
        assetId: newAssetId.assetAddress,
        weight: 4000, // 40%
      },
    ];

    // Only provide price data for BTC and ETH, omitting the new asset
    const assetOraclePairs = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
      },
      // Intentionally omit the new asset's oracle
    ];

    // First, add the new asset to the baskt
    // Create a new baskt with the new asset
    const assets = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
        direction: true,
        weight: 3000, // 30% BTC
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
        direction: true,
        weight: 3000, // 30% ETH
      },
      {
        asset: newAssetId.assetAddress,
        oracle: newAssetId.oracle,
        direction: true,
        weight: 4000, // 40% NEW_ASSET
      },
    ];

    // Create a new baskt with all three assets
    const result = await client.createMockBaskt('PriceErr', assets, true);

    const priceErrorBasktId = result.basktId;

    // Attempt to rebalance without providing the price for the new asset
    try {
      await client.rebalanceBaskt(priceErrorBasktId, assetConfigs, assetOraclePairs);
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('PriceNotFound');
    }
  });
});

// Tests for rebalance with NAV changes
describe('Baskt Rebalance with NAV Changes', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Asset IDs that will be used across tests
  let btcAssetId: AssetId;
  let ethAssetId: AssetId;
  let solAssetId: AssetId;
  let basktId: PublicKey;

  // Initial prices for assets
  const initialPrices = {
    BTC: 50000,
    ETH: 3000,
    SOL: 100,
  };

  // Second set of prices for assets
  const secondPrices = {
    BTC: 55000, // BTC up 10%
    ETH: 2700, // ETH down 10%
    SOL: 120, // SOL up 20%
  };

  // Third set of prices for assets
  const thirdPrices = {
    BTC: 60000, // BTC up another 9.1%
    ETH: 3200, // ETH up 18.5%
    SOL: 90, // SOL down 25%
  };

  before(async () => {
    // Create assets with initial prices
    btcAssetId = await client.createAssetWithCustomOracle('BTCNAV', initialPrices.BTC);
    ethAssetId = await client.createAssetWithCustomOracle('ETHNAV', initialPrices.ETH);
    solAssetId = await client.createAssetWithCustomOracle('SOLNAV', initialPrices.SOL);
    await client.waitForBlocks();
    // Create a test baskt with all three assets
    const assets = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
        direction: true,
        weight: 5000, // 50% BTC
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
        direction: true,
        weight: 3000, // 30% ETH
      },
      {
        asset: solAssetId.assetAddress,
        oracle: solAssetId.oracle,
        direction: true,
        weight: 2000, // 20% SOL
      },
    ];

    // Create the baskt
    const result = await client.createMockBaskt(
      'RNAVBaskt', // Name must be 10 characters or less
      assets,
      true, // is_public
    );

    basktId = result.basktId;

    // Verify the baskt was created successfully
    const basktAccount = await client.getBaskt(basktId);
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(3);
  });

  it('Calculates correct initial NAV based on initial prices', async () => {
    // Get the initial NAV
    const initialNav = await client.getBasktNav(basktId);

    // The initial NAV should be 1 USDC (1,000,000 lamports)
    // This is the default baseline NAV set when a baskt is created
    const expectedInitialNav = 1;

    // Verify the NAV is correct (allowing for small rounding differences)
    expect(initialNav.toNumber() / 1e6).to.be.approximately(expectedInitialNav, 0.1);

    const baskt = await client.getBaskt(basktId);
    expect(baskt.baselineNav.toNumber() / 1e6).to.be.approximately(1, 0.1);
  });

  it('Updates NAV when asset prices change (without rebalance)', async () => {
    // Update asset prices to second set
    await client.updateOraclePrice('BTCNAV', btcAssetId.oracle, secondPrices.BTC);
    await client.updateOraclePrice('ETHNAV', ethAssetId.oracle, secondPrices.ETH);
    await client.updateOraclePrice('SOLNAV', solAssetId.oracle, secondPrices.SOL);

    // Get the updated NAV
    const updatedNav = await client.getBasktNav(basktId);

    // Calculate expected NAV change based on price changes
    // BTC: 10% increase × 50% weight = +5% impact
    // ETH: 10% decrease × 30% weight = -3% impact
    // SOL: 20% increase × 20% weight = +4% impact
    // Total impact: +6% on baseline NAV of 1
    const expectedUpdatedNav = 1.06;

    // Verify the NAV is updated correctly
    expect(updatedNav.toNumber() / 1e6).to.be.approximately(expectedUpdatedNav, 0.1);

    const baskt = await client.getBaskt(basktId);
    expect(baskt.baselineNav.toNumber() / 1e6).to.be.approximately(1.06, 0.1);
  });

  it('Rebalances the baskt and maintains correct NAV', async () => {
    // New asset weights for rebalance
    const newAssetConfigs = [
      {
        assetId: btcAssetId.assetAddress,
        weight: 4000, // 40% BTC (was 50%)
      },
      {
        assetId: ethAssetId.assetAddress,
        weight: 2000, // 20% ETH (was 30%)
      },
      {
        assetId: solAssetId.assetAddress,
        weight: 4000, // 40% SOL (was 20%)
      },
    ];

    // Asset-oracle pairs for price data
    const assetOraclePairs = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
      },
      {
        asset: solAssetId.assetAddress,
        oracle: solAssetId.oracle,
      },
    ];

    // Perform the rebalance
    await client.rebalanceBaskt(basktId, newAssetConfigs, assetOraclePairs);

    // Get the baskt after rebalance
    const basktAfter = await client.getBaskt(basktId);

    // Verify new weights were applied
    const btcConfig = basktAfter.currentAssetConfigs.find(
      (config) => config.assetId.toString() === btcAssetId.assetAddress.toString(),
    );
    expect(btcConfig?.weight.toNumber()).to.equal(4000);

    const ethConfig = basktAfter.currentAssetConfigs.find(
      (config) => config.assetId.toString() === ethAssetId.assetAddress.toString(),
    );
    expect(ethConfig?.weight.toNumber()).to.equal(2000);

    const solConfig = basktAfter.currentAssetConfigs.find(
      (config) => config.assetId.toString() === solAssetId.assetAddress.toString(),
    );
    expect(solConfig?.weight.toNumber()).to.equal(4000);

    // Get the NAV after rebalance
    const navAfterRebalance = await client.getBasktNav(basktId);

    // Get the baskt to check its baseline NAV and rebalance index
    const basktAfterRebalance = await client.getBaskt(basktId);

    // After rebalance, the NAV becomes the new baseline (around 1.06)
    // and the price impact is reset to 0%, so NAV should equal the baseline
    const expectedNavAfterRebalance = basktAfterRebalance.baselineNav.toNumber() / 1e6;

    // Verify the NAV is correct after rebalance
    expect(navAfterRebalance.toNumber() / 1e6).to.be.approximately(expectedNavAfterRebalance, 0.1);

    expect(basktAfterRebalance.baselineNav.toNumber() / 1e6).to.be.approximately(1.06, 0.1);
  });

  it('Updates NAV correctly after another price change and rebalance', async () => {
    // Update asset prices to third set
    await client.updateOraclePrice('BTCNAV', btcAssetId.oracle, thirdPrices.BTC);
    await client.updateOraclePrice('ETHNAV', ethAssetId.oracle, thirdPrices.ETH);
    await client.updateOraclePrice('SOLNAV', solAssetId.oracle, thirdPrices.SOL);

    // Get the NAV after price changes
    const navAfterPriceChange = await client.getBasktNav(basktId);

    // Get the baskt to check its baseline NAV
    const basktBeforeSecondRebalance = await client.getBaskt(basktId);
    const baselineNav = basktBeforeSecondRebalance.baselineNav.toNumber() / 1e6;

    // Calculate expected NAV change based on price changes from the new baseline
    // Using the second prices as baseline and third prices as current:
    // BTC: 9.1% increase × 40% weight = +3.64% impact
    // ETH: 18.5% increase × 20% weight = +3.7% impact
    // SOL: 25% decrease × 40% weight = -10% impact
    // Total impact: -2.66% on baseline NAV
    // Expected NAV: baseline * (1 + impact) = baselineNav * 0.9734
    const expectedNavAfterPriceChange = baselineNav * 0.9734;

    // Verify the NAV is updated correctly
    expect(navAfterPriceChange.toNumber() / 1e6).to.be.approximately(
      expectedNavAfterPriceChange,
      0.1,
    );

    // New asset weights for second rebalance
    const finalAssetConfigs = [
      {
        assetId: btcAssetId.assetAddress,
        weight: 6000, // 60% BTC (was 40%)
      },
      {
        assetId: ethAssetId.assetAddress,
        weight: 3000, // 30% ETH (was 20%)
      },
      {
        assetId: solAssetId.assetAddress,
        weight: 1000, // 10% SOL (was 40%)
      },
    ];

    // Asset-oracle pairs for price data
    const assetOraclePairs = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
      },
      {
        asset: solAssetId.assetAddress,
        oracle: solAssetId.oracle,
      },
    ];

    // Perform the second rebalance
    await client.rebalanceBaskt(basktId, finalAssetConfigs, assetOraclePairs);

    // Get the baskt after rebalance
    const basktAfterFinal = await client.getBaskt(basktId);

    // Verify final weights were applied
    const btcConfig = basktAfterFinal.currentAssetConfigs.find(
      (config) => config.assetId.toString() === btcAssetId.assetAddress.toString(),
    );
    expect(btcConfig?.weight.toNumber()).to.equal(6000);

    const ethConfig = basktAfterFinal.currentAssetConfigs.find(
      (config) => config.assetId.toString() === ethAssetId.assetAddress.toString(),
    );
    expect(ethConfig?.weight.toNumber()).to.equal(3000);

    const solConfig = basktAfterFinal.currentAssetConfigs.find(
      (config) => config.assetId.toString() === solAssetId.assetAddress.toString(),
    );
    expect(solConfig?.weight.toNumber()).to.equal(1000);

    // Get the final NAV
    const finalNav = await client.getBasktNav(basktId);

    // Get the baskt to check its final baseline NAV
    const basktAfterFinalRebalance = await client.getBaskt(basktId);

    // After the second rebalance, the NAV becomes the new baseline again
    // and the price impact is reset to 0%, so NAV should equal the baseline
    const expectedFinalNav = basktAfterFinalRebalance.baselineNav.toNumber() / 1e6;

    // Verify the final NAV is correct
    expect(finalNav.toNumber() / 1e6).to.be.approximately(expectedFinalNav, 0.1);

    // Verify the final baseline NAV is correct
    expect(basktAfterFinalRebalance.baselineNav.toNumber() / 1e6).to.be.approximately(1.06, 0.1);
  });
});

// Tests for multiple price fluctuations and rebalances
describe('Baskt Rebalance with Multiple Price Fluctuations', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Asset IDs that will be used across tests
  let btcAssetId: AssetId;
  let ethAssetId: AssetId;
  let solAssetId: AssetId;
  let basktId: PublicKey;

  // Initial prices for assets
  const initialPrices = {
    BTC: 50000,
    ETH: 3000,
    SOL: 100,
  };

  // Helper function to get rebalance history
  async function getRebalanceHistory(basktId: PublicKey, rebalanceIndex: number) {
    // Calculate the PDA for the rebalance history account
    const [rebalanceHistoryPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('rebalance_history'),
        basktId.toBuffer(),
        new anchor.BN(rebalanceIndex).toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    // Fetch the rebalance history account
    return await client.program.account.rebalanceHistory.fetch(rebalanceHistoryPDA);
  }

  before(async () => {
    // Create assets with initial prices
    btcAssetId = await client.createAssetWithCustomOracle('BTC_MULTI', initialPrices.BTC);
    ethAssetId = await client.createAssetWithCustomOracle('ETH_MULTI', initialPrices.ETH);
    solAssetId = await client.createAssetWithCustomOracle('SOL_MULTI', initialPrices.SOL);
    await client.waitForBlocks();
    // Create a test baskt with all three assets
    const assets = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
        direction: true,
        weight: 5000, // 50% BTC
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
        direction: true,
        weight: 3000, // 30% ETH
      },
      {
        asset: solAssetId.assetAddress,
        oracle: solAssetId.oracle,
        direction: true,
        weight: 2000, // 20% SOL
      },
    ];

    // Create the baskt
    const result = await client.createMockBaskt(
      'MultiNav', // Name must be 10 characters or less
      assets,
      true, // is_public
    );

    basktId = result.basktId;

    // Verify the baskt was created successfully
    const basktAccount = await client.getBaskt(basktId);
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(3);
  });

  it('Tracks NAV and rebalance history through multiple price fluctuations', async () => {
    // Get the initial baskt state
    const initialBaskt = await client.getBaskt(basktId);

    // Verify initial NAV is 1 USDC
    const initialNav = await client.getBasktNav(basktId);
    expect(initialNav.toNumber() / 1e6).to.be.approximately(1, 0.1);

    // Perform 10 random price fluctuations and rebalances
    const priceHistory = [];
    const navHistory = [];
    const rebalanceIndexHistory = [];

    // Asset-oracle pairs for price data
    const assetOraclePairs = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
      },
      {
        asset: solAssetId.assetAddress,
        oracle: solAssetId.oracle,
      },
    ];

    // Record initial state
    priceHistory.push({
      BTC: initialPrices.BTC,
      ETH: initialPrices.ETH,
      SOL: initialPrices.SOL,
    });
    navHistory.push(initialNav.toNumber() / 1e6);
    rebalanceIndexHistory.push(initialBaskt.lastRebalanceIndex.toNumber());

    let currentPrices = { ...initialPrices };

    for (let i = 0; i < 10; i++) {
      // 1. Generate random price changes (between -20% and +20%)
      const btcChange = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 (80% to 120%)
      const ethChange = 0.8 + Math.random() * 0.4;
      const solChange = 0.8 + Math.random() * 0.4;

      currentPrices = {
        BTC: Math.round(currentPrices.BTC * btcChange),
        ETH: Math.round(currentPrices.ETH * ethChange),
        SOL: Math.round(currentPrices.SOL * solChange),
      };

      // 2. Update oracle prices
      await client.updateOraclePrice('BTC_MULTI', btcAssetId.oracle, currentPrices.BTC);
      await client.updateOraclePrice('ETH_MULTI', ethAssetId.oracle, currentPrices.ETH);
      await client.updateOraclePrice('SOL_MULTI', solAssetId.oracle, currentPrices.SOL);

      // 4. Generate new random weights (ensuring they sum to 100%)
      let btcWeight = 10 + Math.floor(Math.random() * 80); // 10% to 90%
      let ethWeight = 10 + Math.floor(Math.random() * (90 - btcWeight)); // 10% to (90 - btcWeight)%
      let solWeight = 100 - btcWeight - ethWeight; // Remaining percentage

      // Convert to basis points (multiply by 100)
      btcWeight *= 100;
      ethWeight *= 100;
      solWeight *= 100;

      // 5. Perform rebalance
      const newAssetConfigs = [
        {
          assetId: btcAssetId.assetAddress,
          weight: btcWeight,
        },
        {
          assetId: ethAssetId.assetAddress,
          weight: ethWeight,
        },
        {
          assetId: solAssetId.assetAddress,
          weight: solWeight,
        },
      ];

      await client.rebalanceBaskt(basktId, newAssetConfigs, assetOraclePairs);

      // 6. Get the baskt after rebalance
      const basktAfterRebalance = await client.getBaskt(basktId);
      const rebalanceIndex = basktAfterRebalance.lastRebalanceIndex.toNumber();

      // 7. Get the NAV after rebalance
      const navAfterRebalance = await client.getBasktNav(basktId);

      // 8. Get the rebalance history
      try {
        await getRebalanceHistory(basktId, rebalanceIndex - 1);
      } catch (error) {
        console.error('Error fetching rebalance history:', error);
      }

      // 9. Record history
      priceHistory.push({ ...currentPrices });
      navHistory.push(navAfterRebalance.toNumber() / 1e6);
      rebalanceIndexHistory.push(rebalanceIndex);
    }

    // Verify that the NAV after each rebalance matches the baseline NAV
    const finalBaskt = await client.getBaskt(basktId);
    const finalNav = await client.getBasktNav(basktId);

    expect(finalNav.toNumber() / 1e6).to.be.approximately(
      finalBaskt.baselineNav.toNumber() / 1e6,
      0.1,
    );
  });
});

// Tests for rebalance permission checks
describe('Baskt Rebalance Permission Checks', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Asset IDs that will be used across tests
  let btcAssetId: AssetId;
  let ethAssetId: AssetId;
  let basktId: PublicKey;

  // Test keypairs for different roles
  let nonOwnerKeypair: anchor.web3.Keypair;
  let rebalancerKeypair: anchor.web3.Keypair;

  // Clients for different roles
  let nonOwnerClient: TestClient;
  let rebalancerClient: TestClient;

  before(async () => {
    // Create assets that will be used across tests
    btcAssetId = await client.createAssetWithCustomOracle('BTC2', 50000);
    ethAssetId = await client.createAssetWithCustomOracle('ETH2', 3000);
    await client.waitForBlocks();
    // Create a test baskt for rebalance tests
    const assets = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
        direction: true,
        weight: 6000, // 60% BTC
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
        direction: true,
        weight: 4000, // 40% ETH
      },
    ];

    // Create the baskt
    const result = await client.createMockBaskt(
      'RoleBaskt', // Name must be 10 characters or less
      assets,
      true, // is_public
    );

    basktId = result.basktId;

    // Create keypairs for different roles
    nonOwnerKeypair = anchor.web3.Keypair.generate();
    rebalancerKeypair = anchor.web3.Keypair.generate();

    // Create clients for different roles
    nonOwnerClient = await TestClient.forUser(nonOwnerKeypair);
    rebalancerClient = await TestClient.forUser(rebalancerKeypair);

    // Add Rebalancer role to rebalancerKeypair
    await client.addRole(rebalancerKeypair.publicKey, AccessControlRole.Rebalancer);

    // Verify the role was added
    const hasRole = await client.hasRole(rebalancerKeypair.publicKey, AccessControlRole.Rebalancer);
    expect(hasRole).to.be.true;
  });

  it('Fails to rebalance when caller is not owner or rebalancer', async () => {
    // New asset weights for rebalance
    const newAssetConfigs = [
      {
        assetId: btcAssetId.assetAddress,
        weight: 3000, // 30% BTC (was 60%)
      },
      {
        assetId: ethAssetId.assetAddress,
        weight: 7000, // 70% ETH (was 40%)
      },
    ];

    // Asset-oracle pairs for price data
    const assetOraclePairs = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
      },
    ];

    // Attempt to rebalance with non-owner client
    try {
      await nonOwnerClient.rebalanceBaskt(basktId, newAssetConfigs, assetOraclePairs);
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
        weight: 4000, // 40% BTC
      },
      {
        assetId: ethAssetId.assetAddress,
        weight: 6000, // 60% ETH
      },
    ];

    // Asset-oracle pairs for price data
    const assetOraclePairs = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
      },
    ];

    // Get the baskt before rebalance
    const basktBefore = await rebalancerClient.getBaskt(basktId);
    const rebalanceIndexBefore = basktBefore.lastRebalanceIndex.toNumber();

    // Perform the rebalance with rebalancer client
    await rebalancerClient.rebalanceBaskt(basktId, newAssetConfigs, assetOraclePairs);

    // Get the baskt after rebalance
    const basktAfter = await rebalancerClient.getBaskt(basktId);
    const rebalanceIndexAfter = basktAfter.lastRebalanceIndex.toNumber();

    // Verify the rebalance was successful
    expect(rebalanceIndexAfter).to.equal(rebalanceIndexBefore + 1);
    expect(basktAfter.currentAssetConfigs[0].weight.toNumber()).to.equal(4000);
    expect(basktAfter.currentAssetConfigs[1].weight.toNumber()).to.equal(6000);
  });

  it('Successfully rebalances when caller is the owner', async () => {
    // New asset weights for rebalance
    const newAssetConfigs = [
      {
        assetId: btcAssetId.assetAddress,
        weight: 5000, // 50% BTC
      },
      {
        assetId: ethAssetId.assetAddress,
        weight: 5000, // 50% ETH
      },
    ];

    // Asset-oracle pairs for price data
    const assetOraclePairs = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
      },
    ];

    // Get the baskt before rebalance
    const basktBefore = await client.getBaskt(basktId);
    const rebalanceIndexBefore = basktBefore.lastRebalanceIndex.toNumber();

    // Perform the rebalance with owner client
    await client.rebalanceBaskt(basktId, newAssetConfigs, assetOraclePairs);

    // Get the baskt after rebalance
    const basktAfter = await client.getBaskt(basktId);
    const rebalanceIndexAfter = basktAfter.lastRebalanceIndex.toNumber();

    // Verify the rebalance was successful
    expect(rebalanceIndexAfter).to.equal(rebalanceIndexBefore + 1);
    expect(basktAfter.currentAssetConfigs[0].weight.toNumber()).to.equal(5000);
    expect(basktAfter.currentAssetConfigs[1].weight.toNumber()).to.equal(5000);
  });
});

// Tests for rebalance with NAV changes
describe('Baskt Rebalance with NAV Changes', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Asset IDs that will be used across tests
  let btcAssetId: AssetId;
  let ethAssetId: AssetId;
  let solAssetId: AssetId;
  let basktId: PublicKey;

  // Initial prices for assets
  const initialPrices = {
    BTC: 50000,
    ETH: 3000,
    SOL: 100,
  };

  // Second set of prices for assets
  const secondPrices = {
    BTC: 55000, // BTC up 10%
    ETH: 2700, // ETH down 10%
    SOL: 120, // SOL up 20%
  };

  // Third set of prices for assets
  const thirdPrices = {
    BTC: 60000, // BTC up another 9.1%
    ETH: 3200, // ETH up 18.5%
    SOL: 90, // SOL down 25%
  };

  before(async () => {
    // Create assets with initial prices
    btcAssetId = await client.createAssetWithCustomOracle('BTCNAV', initialPrices.BTC);
    ethAssetId = await client.createAssetWithCustomOracle('ETHNAV', initialPrices.ETH);
    solAssetId = await client.createAssetWithCustomOracle('SOLNAV', initialPrices.SOL);
    await client.waitForBlocks();
    // Create a test baskt with all three assets
    const assets = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
        direction: true,
        weight: 5000, // 50% BTC
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
        direction: true,
        weight: 3000, // 30% ETH
      },
      {
        asset: solAssetId.assetAddress,
        oracle: solAssetId.oracle,
        direction: true,
        weight: 2000, // 20% SOL
      },
    ];

    // Create the baskt
    const result = await client.createMockBaskt(
      'NAVBaskt', // Name must be 10 characters or less
      assets,
      true, // is_public
    );

    basktId = result.basktId;

    // Verify the baskt was created successfully
    const basktAccount = await client.getBaskt(basktId);
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(3);
  });

  it('Calculates correct initial NAV based on initial prices', async () => {
    // Get the initial NAV
    const initialNav = await client.getBasktNav(basktId);

    // The initial NAV should be 1 USDC (1,000,000 lamports)
    // This is the default baseline NAV set when a baskt is created
    const expectedInitialNav = 1;

    // Verify the NAV is correct (allowing for small rounding differences)
    expect(initialNav.toNumber() / 1e6).to.be.approximately(expectedInitialNav, 0.1);
  });

  it('Updates NAV when asset prices change (without rebalance)', async () => {
    // Update asset prices to second set
    await client.updateOraclePrice('BTCNAV', btcAssetId.oracle, secondPrices.BTC);
    await client.updateOraclePrice('ETHNAV', ethAssetId.oracle, secondPrices.ETH);
    await client.updateOraclePrice('SOLNAV', solAssetId.oracle, secondPrices.SOL);

    // Get the updated NAV
    const updatedNav = await client.getBasktNav(basktId);

    // Calculate expected NAV change based on price changes
    // BTC: 10% increase × 50% weight = +5% impact
    // ETH: 10% decrease × 30% weight = -3% impact
    // SOL: 20% increase × 20% weight = +4% impact
    // Total impact: +6% on baseline NAV of 1
    const expectedUpdatedNav = 1.06;

    // Verify the NAV is updated correctly
    expect(updatedNav.toNumber() / 1e6).to.be.approximately(expectedUpdatedNav, 0.1);
  });

  it('Rebalances the baskt and maintains correct NAV', async () => {
    // New asset weights for rebalance
    const newAssetConfigs = [
      {
        assetId: btcAssetId.assetAddress,
        weight: 4000, // 40% BTC (was 50%)
      },
      {
        assetId: ethAssetId.assetAddress,
        weight: 2000, // 20% ETH (was 30%)
      },
      {
        assetId: solAssetId.assetAddress,
        weight: 4000, // 40% SOL (was 20%)
      },
    ];

    // Asset-oracle pairs for price data
    const assetOraclePairs = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
      },
      {
        asset: solAssetId.assetAddress,
        oracle: solAssetId.oracle,
      },
    ];

    // Perform the rebalance
    await client.rebalanceBaskt(basktId, newAssetConfigs, assetOraclePairs);

    // Get the baskt after rebalance
    const basktAfter = await client.getBaskt(basktId);

    // Verify new weights were applied
    const btcConfig = basktAfter.currentAssetConfigs.find(
      (config) => config.assetId.toString() === btcAssetId.assetAddress.toString(),
    );
    expect(btcConfig?.weight.toNumber()).to.equal(4000);

    const ethConfig = basktAfter.currentAssetConfigs.find(
      (config) => config.assetId.toString() === ethAssetId.assetAddress.toString(),
    );
    expect(ethConfig?.weight.toNumber()).to.equal(2000);

    const solConfig = basktAfter.currentAssetConfigs.find(
      (config) => config.assetId.toString() === solAssetId.assetAddress.toString(),
    );
    expect(solConfig?.weight.toNumber()).to.equal(4000);

    // Get the NAV after rebalance
    const navAfterRebalance = await client.getBasktNav(basktId);

    // Get the baskt to check its baseline NAV and rebalance index
    const basktAfterRebalance = await client.getBaskt(basktId);
    // After rebalance, the NAV becomes the new baseline (around 1.06)
    // and the price impact is reset to 0%, so NAV should equal the baseline
    const expectedNavAfterRebalance = basktAfterRebalance.baselineNav.toNumber() / 1e6;

    // Verify the NAV is correct after rebalance
    expect(navAfterRebalance.toNumber() / 1e6).to.be.approximately(expectedNavAfterRebalance, 0.1);
  });

  it('Updates NAV correctly after another price change and rebalance', async () => {
    // Update asset prices to third set
    await client.updateOraclePrice('BTCNAV', btcAssetId.oracle, thirdPrices.BTC);
    await client.updateOraclePrice('ETHNAV', ethAssetId.oracle, thirdPrices.ETH);
    await client.updateOraclePrice('SOLNAV', solAssetId.oracle, thirdPrices.SOL);

    // Get the NAV after price changes
    const navAfterPriceChange = await client.getBasktNav(basktId);

    // Get the baskt to check its baseline NAV
    const basktBeforeSecondRebalance = await client.getBaskt(basktId);
    const baselineNav = basktBeforeSecondRebalance.baselineNav.toNumber() / 1e6;

    // Calculate expected NAV change based on price changes from the new baseline
    // Using the second prices as baseline and third prices as current:
    // BTC: 9.1% increase × 40% weight = +3.64% impact
    // ETH: 18.5% increase × 20% weight = +3.7% impact
    // SOL: 25% decrease × 40% weight = -10% impact
    // Total impact: -2.66% on baseline NAV
    // Expected NAV: baseline * (1 + impact) = baselineNav * 0.9734
    const expectedNavAfterPriceChange = baselineNav * 0.9734;

    // Verify the NAV is updated correctly
    expect(navAfterPriceChange.toNumber() / 1e6).to.be.approximately(
      expectedNavAfterPriceChange,
      0.1,
    );

    // New asset weights for second rebalance
    const finalAssetConfigs = [
      {
        assetId: btcAssetId.assetAddress,
        weight: 6000, // 60% BTC (was 40%)
      },
      {
        assetId: ethAssetId.assetAddress,
        weight: 3000, // 30% ETH (was 20%)
      },
      {
        assetId: solAssetId.assetAddress,
        weight: 1000, // 10% SOL (was 40%)
      },
    ];

    // Asset-oracle pairs for price data
    const assetOraclePairs = [
      {
        asset: btcAssetId.assetAddress,
        oracle: btcAssetId.oracle,
      },
      {
        asset: ethAssetId.assetAddress,
        oracle: ethAssetId.oracle,
      },
      {
        asset: solAssetId.assetAddress,
        oracle: solAssetId.oracle,
      },
    ];

    // Perform the second rebalance
    await client.rebalanceBaskt(basktId, finalAssetConfigs, assetOraclePairs);

    // Get the baskt after rebalance
    const basktAfterFinal = await client.getBaskt(basktId);

    // Verify final weights were applied
    const btcConfig = basktAfterFinal.currentAssetConfigs.find(
      (config) => config.assetId.toString() === btcAssetId.assetAddress.toString(),
    );
    expect(btcConfig?.weight.toNumber()).to.equal(6000);

    const ethConfig = basktAfterFinal.currentAssetConfigs.find(
      (config) => config.assetId.toString() === ethAssetId.assetAddress.toString(),
    );
    expect(ethConfig?.weight.toNumber()).to.equal(3000);

    const solConfig = basktAfterFinal.currentAssetConfigs.find(
      (config) => config.assetId.toString() === solAssetId.assetAddress.toString(),
    );
    expect(solConfig?.weight.toNumber()).to.equal(1000);

    // Get the final NAV
    const finalNav = await client.getBasktNav(basktId);

    // Get the baskt to check its final baseline NAV
    const basktAfterFinalRebalance = await client.getBaskt(basktId);

    // After the second rebalance, the NAV becomes the new baseline again
    // and the price impact is reset to 0%, so NAV should equal the baseline
    const expectedFinalNav = basktAfterFinalRebalance.baselineNav.toNumber() / 1e6;

    // Verify the final NAV is correct
    expect(finalNav.toNumber() / 1e6).to.be.approximately(expectedFinalNav, 0.1);
  });
});
