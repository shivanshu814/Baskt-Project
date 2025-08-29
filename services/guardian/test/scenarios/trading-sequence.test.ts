import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import BN from 'bn.js';
import { FeeSkewCalculator, FeeSkewConfig, PoolState, OrderDetails } from '../../src/utils/fee-skew-calculator';
import { NAV_PRECISION } from '@baskt/sdk';

// Mock the querier client
jest.mock('../../src/config/client', () => ({
  querierClient: {
    metrics: {
      getOpenInterestForBaskt: jest.fn()
    },
    pool: {
      getLiquidityPool: jest.fn()
    }
  }
}));

// Helper to format BN values for display
function formatBN(value: BN): string {
  return (Number(value.toString()) / 1_000_000).toFixed(2);
}

// Helper to print pool state
function printPoolState(pool: PoolState, message: string = '') {
	const string = `
		=== Pool State ${message ? `(${message})` : ''} ===
		Total Liquidity: $${formatBN(pool.totalLiquidity)}
		Utilization: ${(pool.utilization * 100).toFixed(2)}%
		Long Notional: $${formatBN(pool.longNotional)}
		Short Notional: $${formatBN(pool.shortNotional)}
		Imbalance: ${(Math.abs(Number(pool.longNotional.sub(pool.shortNotional))) / Number(pool.totalLiquidity) * 100).toFixed(2)}%
	`;
	console.log(string);
	return string;
}

// Helper to execute a trade and update pool state
function executeTrade(
  calculator: FeeSkewCalculator,
  pool: PoolState,
  order: OrderDetails,
  basePrice: BN
): { updatedPool: PoolState; tradeSummary: string } {
  const result = calculator.calculatePriceSkew(basePrice, order, pool);
  const validation = calculator.validateOrder(order, pool);
  
  if (!validation.valid) {
    throw new Error(`Trade rejected: ${validation.reason}`);
  }

  // Update pool state
  const updatedPool = { ...pool };
  if (order.isOpen) {
    if (order.isLong) {
      updatedPool.longNotional = updatedPool.longNotional.add(order.notionalValue);
    } else {
      updatedPool.shortNotional = updatedPool.shortNotional.add(order.notionalValue);
    }
  } else {
    if (order.isLong) {
      updatedPool.longNotional = updatedPool.longNotional.sub(order.notionalValue);
    } else {
      updatedPool.shortNotional = updatedPool.shortNotional.sub(order.notionalValue);
    }
  }

  // Recalculate utilization
  const totalExposure = updatedPool.longNotional.add(updatedPool.shortNotional);
  const utilizationRatio = totalExposure.mul(new BN(10000)).div(updatedPool.totalLiquidity);
  updatedPool.utilization = Math.min(1, Number(utilizationRatio) / 10000);

  // Generate trade summary
  const action = `${order.isOpen ? 'Opening' : 'Closing'} ${order.isLong ? 'Long' : 'Short'}`;
  const size = formatBN(order.notionalValue);
  const effectiveFee = (result.effectiveFeeBps / 100).toFixed(2);
  const priceImpact = (result.priceSkewBps / 100).toFixed(2);
  const executionPrice = formatBN(result.skewedPrice);
  
  const tradeSummary = `${action} $${size} @ $${executionPrice} (${priceImpact}% price impact) ${effectiveFee}% fee`;
  if (result.warnings.length > 0) {
    tradeSummary + `\nWarnings: ${result.warnings.join(', ')}`;
  }

  return { updatedPool, tradeSummary };
}

describe('Trading Scenarios', () => {
  let calculator: FeeSkewCalculator;
  let defaultConfig: FeeSkewConfig;
  let basePrice: BN;
  
  beforeEach(() => {
    defaultConfig = {
      impactScalar: new BN('1500000000').mul(new BN(1000000)), // 1.5B
      targetUtilization: 0.8,
      minBorrowRate: 0.01,    // 1%
      targetBorrowRate: 0.05, // 5%
      maxBorrowRate: 0.15,    // 15%
      maxImbalanceRatio: 0.2, // 20%
      imbalancePenaltyBps: 10,
      maxPositionSizeUsd: new BN('2500000').mul(new BN(1000000)), // 2.5M
      poolImpactThreshold: 0.05 // 5%
    };
    
    calculator = new FeeSkewCalculator(defaultConfig);
    basePrice = NAV_PRECISION; // $1
  });

  it('should simulate market making scenario', () => {
    // Initial pool state
    let pool: PoolState = {
      totalLiquidity: new BN('10000000').mul(new BN(1000000)), // $10M
      utilization: 0,
      longNotional: new BN(0),
      shortNotional: new BN(0)
    };

    printPoolState(pool, 'Initial');

    // Scenario 1: Market maker opens balanced positions
    const trade1 = executeTrade(calculator, pool, {
      isLong: true,
      notionalValue: new BN('500000').mul(new BN(1000000)), // $500k long
      isOpen: true
    }, basePrice);

    pool = trade1.updatedPool;
    console.log('\nTrade 1:', trade1.tradeSummary);
    printPoolState(pool, 'After Long');

    const trade2 = executeTrade(calculator, pool, {
      isLong: false,
      notionalValue: new BN('500000').mul(new BN(1000000)), // $500k short
      isOpen: true
    }, basePrice);

    pool = trade2.updatedPool;
    console.log('\nTrade 2:', trade2.tradeSummary);
    printPoolState(pool, 'After Short');

    // Verify balanced state
    expect(pool.longNotional.eq(pool.shortNotional)).toBe(true);
    expect(pool.utilization).toBeLessThan(0.5);
  });

  it('should simulate aggressive directional trading', () => {
    // Initial pool state
    let pool: PoolState = {
      totalLiquidity: new BN('10000000').mul(new BN(1000000)), // $10M
      utilization: 0,
      longNotional: new BN(0),
      shortNotional: new BN(0)
    };

    printPoolState(pool, 'Initial');

    // Series of increasing long positions
    const positions = [0.3, 0.4, 0.5].map(size => new BN(Math.floor(size * 1000000)).mul(new BN(1000000)));
    
    for (const size of positions) {
      try {
        const trade = executeTrade(calculator, pool, {
          isLong: true,
          notionalValue: size,
          isOpen: true
        }, basePrice);

        pool = trade.updatedPool;
        console.log('\nTrade:', trade.tradeSummary);
        printPoolState(pool, `After ${formatBN(size)} Long`);

      } catch (error) {
        console.log('\nTrade rejected:', (error as Error).message);
        break;
      }
    }

    // Verify final state
    expect(pool.longNotional.gt(pool.shortNotional)).toBe(true);
    expect(pool.utilization).toBeGreaterThan(0.1);
  });

  it('should simulate liquidation scenario', () => {
    // Initial pool state with existing positions
    let pool: PoolState = {
      totalLiquidity: new BN('10000000').mul(new BN(1000000)), // $10M
      utilization: 0.3, // 30% utilization
      longNotional: new BN('2500000').mul(new BN(1000000)), // $2.5M longs
      shortNotional: new BN('500000').mul(new BN(1000000))  // $500k shorts
    };

    printPoolState(pool, 'Initial');

    // Simulate rapid unwinding of long positions
    const closeSizes = [0.4, 0.4].map(size => new BN(Math.floor(size * 1000000)).mul(new BN(1000000)));
    
    for (const size of closeSizes) {
      try {
        const trade = executeTrade(calculator, pool, {
          isLong: true,
          notionalValue: size,
          isOpen: false
        }, basePrice);

        pool = trade.updatedPool;
        console.log('\nClosing:', trade.tradeSummary);
        printPoolState(pool, `After ${formatBN(size)} Close`);

      } catch (error) {
        console.log('\nTrade rejected:', (error as Error).message);
        break;
      }
    }

    // Verify final state
    expect(pool.utilization).toBeLessThan(0.4);
    expect(pool.longNotional.lt(new BN('2000000').mul(new BN(1000000)))).toBe(true);
  });
});
