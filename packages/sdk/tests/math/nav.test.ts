import { expect } from 'chai';
import { describe, it } from 'mocha';
import BN from 'bn.js';
import { calculateNav, NAV_PRECISION, WEIGHT_PRECISION } from '../../src/math/nav';
import { OnchainAssetConfig } from '@baskt/types';
import { PublicKey } from '@solana/web3.js';

// NAV constants for testing
const TEST_BASE_NAV = 100; // Base NAV value for testing ($100)
const TEST_INITIAL_NAV = 10000; // Initial NAV value for random simulations (100 * 100)

interface NavSimulationAsset {
  baselinePrice: number;
  currentPrice: number;
  weight: number; // in BPS (e.g. 5000 = 50%)
  direction: number;
  address?: string;
}

interface NavSimulation {
  assets: NavSimulationAsset[];
  initialNav: number | BN;
  expectedNav: number | BN;
  acceptError?: number;
}

function runNavSimulation(sim: NavSimulation) {
  const totalWeight = sim.assets.reduce((sum, a) => sum + a.weight, 0);
  expect(totalWeight).to.equal(10000);

  const makeAsset = (
    price: number,
    weightBps: number,
    direction: number,
    address = '48HARwoDL7N4SvMJvKGSdTciDnkT5b3RKVijHfGEckC4',
  ): OnchainAssetConfig => ({
    assetId: new PublicKey(address),
    baselinePrice: new BN(price * NAV_PRECISION.toNumber()),
    weight: new BN(Math.round((weightBps * WEIGHT_PRECISION.toNumber()) / 10000)),
    direction: direction > 0,
  });

  const baseline = sim.assets.map((a) =>
    makeAsset(a.baselinePrice, a.weight, a.direction, a.address),
  );
  const current = sim.assets.map((a) =>
    makeAsset(a.currentPrice, a.weight, a.direction, a.address),
  );
  const nav =
    sim.initialNav instanceof BN
      ? sim.initialNav
      : new BN(sim.initialNav * NAV_PRECISION.toNumber());
  const expectedNav =
    sim.expectedNav instanceof BN
      ? sim.expectedNav
      : new BN(sim.expectedNav * NAV_PRECISION.toNumber());
  const result = calculateNav(baseline, current, nav.clone());

  if (sim.acceptError) {
    expect(result.toNumber()).to.be.closeTo(expectedNav.toNumber(), sim.acceptError);
  } else {
    expect(result.toString()).to.equal(expectedNav.toString());
  }
}

function generateRandomSimulation(): NavSimulation {
  const initialNav = TEST_INITIAL_NAV;
  const numAssets = Math.floor(Math.random() * 4) + 2;
  let remainingWeight = 10000;
  const assets: NavSimulationAsset[] = [];

  let fluctuationTotal = 0;

  for (let i = 0; i < numAssets; i++) {
    const weight =
      i === numAssets - 1 ? remainingWeight : Math.floor(Math.random() * (remainingWeight + 1)) + 1;
    remainingWeight -= weight;

    const baselinePrice = Math.random() * 1000;
    const fluctuation = Math.random() * 10 + 0.5;
    const currentPrice = baselinePrice * fluctuation;
    const direction = Math.random() > 0.5 ? 1 : -1;

    const navChange = direction * (fluctuation - 1) * weight;

    fluctuationTotal += navChange;

    assets.push({ baselinePrice, currentPrice, weight, direction });
  }

  const expectedNav = initialNav + (initialNav * fluctuationTotal) / 10_000;

  return {
    assets,
    initialNav,
    expectedNav: expectedNav <= 0 ? 0 : expectedNav,
  };
}

describe('calculateNav', () => {
  it('single asset, price up 10%', () => {
    runNavSimulation({
      assets: [{ baselinePrice: 100, currentPrice: 110, weight: 10000, direction: 1 }],
      initialNav: 1000,
      expectedNav: 1100,
    });
  });

  it('single asset, price down 10%', () => {
    runNavSimulation({
      assets: [{ baselinePrice: 100, currentPrice: 90, weight: 10000, direction: 1 }],
      initialNav: 1000,
      expectedNav: 900,
    });
  });

  it('two assets, equal weight, one up 20% one down 10%', () => {
    runNavSimulation({
      assets: [
        { baselinePrice: 100, currentPrice: 120, weight: 5000, direction: 1 },
        { baselinePrice: 200, currentPrice: 180, weight: 5000, direction: 1 },
      ],
      initialNav: 1000,
      expectedNav: 1050,
    });
  });

  it('three assets, mixed directions, weights sum 10k', () => {
    runNavSimulation({
      assets: [
        { baselinePrice: 100, currentPrice: 110, weight: 4000, direction: 1 }, // +4%
        { baselinePrice: 200, currentPrice: 180, weight: 3000, direction: 1 }, // -3%
        { baselinePrice: 300, currentPrice: 330, weight: 3000, direction: -1 }, // -3%
      ],
      initialNav: 1000,
      expectedNav: 980,
    });
  });

  it('edge: all weights zero except one', () => {
    runNavSimulation({
      assets: [
        { baselinePrice: 100, currentPrice: 200, weight: 10000, direction: 1 },
        { baselinePrice: 100, currentPrice: 100, weight: 0, direction: 1 },
      ],
      initialNav: 1000,
      expectedNav: 2000,
    });
  });

  it('edge: all directions -1', () => {
    runNavSimulation({
      assets: [
        { baselinePrice: 100, currentPrice: 110, weight: 4000, direction: -1 },
        { baselinePrice: 200, currentPrice: 210, weight: 6000, direction: -1 },
      ],
      initialNav: 1000,
      expectedNav: 930,
    });
  });

  it('handles 1% price increase', () => {
    runNavSimulation({
      assets: [{ baselinePrice: 100, currentPrice: 101, weight: 10000, direction: 1 }],
      initialNav: 1000,
      expectedNav: 1010,
    });
  });

  it('handles very large NAV and prices', () => {
    runNavSimulation({
      assets: [{ baselinePrice: 1_000_000, currentPrice: 2_000_000, weight: 10000, direction: 1 }],
      initialNav: new BN(1_000_000_000).mul(NAV_PRECISION),
      expectedNav: new BN(2_000_000_000).mul(NAV_PRECISION),
    });
  });

  it('handles very small NAV and weights of upto 1 basis point', () => {
    runNavSimulation({
      assets: [{ baselinePrice: 10000, currentPrice: 10001, weight: 10000, direction: 1 }],
      initialNav: 1,
      expectedNav: new BN('1000100'),
    });
  });

  it('handles very large numbers', () => {
    runNavSimulation({
      assets: [
        { baselinePrice: 1e6, currentPrice: 1e6 * 3, weight: 5000, direction: 1 },
        { baselinePrice: 1e6, currentPrice: 1e6 * 2, weight: 5000, direction: 1 },
      ],
      initialNav: 10,
      expectedNav: 25,
    });
  });

  it('fuzz testing with 1000 random simulations', () => {
    for (let i = 0; i < 1000; i++) {
      const sim = generateRandomSimulation();
      sim.acceptError = (0.01 / 100) * 1e9; // 0.01%
      try {
        runNavSimulation(sim);
      } catch (e) {
        console.error(`Failed on random test #${i}`);
        console.error(JSON.stringify(sim, null, 2));
        throw e;
      }
    }
  });

  it('all short no price change', () => {
    runNavSimulation({
      assets: [
        { baselinePrice: 100, currentPrice: 100, weight: 4000, direction: -1 },
        { baselinePrice: 200, currentPrice: 200, weight: 6000, direction: -1 },
      ],
      initialNav: 1000,
      expectedNav: 1000,
    });
  });

  it('long asset goes to zero', () => {
    runNavSimulation({
      assets: [
        { baselinePrice: 100, currentPrice: 0, weight: 5000, direction: 1 },
        { baselinePrice: 100, currentPrice: 100, weight: 5000, direction: 1 },
      ],
      initialNav: 1000,
      expectedNav: 500,
    });
  });

  it('same gain different directions cancel out', () => {
    runNavSimulation({
      assets: [
        { baselinePrice: 100, currentPrice: 110, weight: 5000, direction: 1 },
        { baselinePrice: 100, currentPrice: 110, weight: 5000, direction: -1 },
      ],
      initialNav: 1000,
      expectedNav: 1000,
    });
  });

  it('all prices up but direction cancels out', () => {
    runNavSimulation({
      assets: [
        { baselinePrice: 100, currentPrice: 120, weight: 4000, direction: 1 },
        { baselinePrice: 100, currentPrice: 120, weight: 6000, direction: -1 },
      ],
      initialNav: 1000,
      expectedNav: 960,
    });
  });

  it('heavier short outweighs long', () => {
    runNavSimulation({
      assets: [
        { baselinePrice: 100, currentPrice: 110, weight: 2000, direction: 1 },
        { baselinePrice: 200, currentPrice: 240, weight: 8000, direction: -1 },
      ],
      initialNav: 1000,
      expectedNav: 860,
    });
  });

  it('one asset spikes 100x with 1% weight', () => {
    runNavSimulation({
      assets: [
        { baselinePrice: 100, currentPrice: 10000, weight: 100, direction: 1 },
        { baselinePrice: 100, currentPrice: 100, weight: 9900, direction: 1 },
      ],
      initialNav: 1000,
      expectedNav: 1990,
    });
  });

  it('all short all go down', () => {
    runNavSimulation({
      assets: [
        { baselinePrice: 100, currentPrice: 50, weight: 5000, direction: -1 },
        { baselinePrice: 200, currentPrice: 100, weight: 5000, direction: -1 },
      ],
      initialNav: 1000,
      expectedNav: 1500,
    });
  });

  it('short with full weight but price 100x up NAV goes near 0', () => {
    runNavSimulation({
      assets: [{ baselinePrice: 100, currentPrice: 10000, weight: 10000, direction: -1 }],
      initialNav: 1000,
      expectedNav: 0,
    });
  });

  it('mixed small changes across many assets', () => {
    runNavSimulation({
      assets: [
        { baselinePrice: 100, currentPrice: 102, weight: 2500, direction: 1 },
        { baselinePrice: 200, currentPrice: 202, weight: 2500, direction: 1 },
        { baselinePrice: 300, currentPrice: 297, weight: 2500, direction: -1 },
        { baselinePrice: 400, currentPrice: 408, weight: 2500, direction: -1 },
      ],
      initialNav: 1000,
      expectedNav: 1005,
    });
  });
});
