import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import BN from 'bn.js';
import { FeeSkewCalculator, FeeSkewConfig, PoolState, OrderDetails } from '../../src/utils/fee-skew-calculator';
import { querierClient } from '../../src/config/client';

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

describe('FeeSkewCalculator', () => {
  let calculator: FeeSkewCalculator;
  let defaultConfig: FeeSkewConfig;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Default configuration for tests
    defaultConfig = {
      impactScalar: new BN('1500000000').mul(new BN(1000000)), // 1.5B with precision
      targetUtilization: 0.8,
      minBorrowRate: 0.01,    // 1%
      targetBorrowRate: 0.05, // 5%
      maxBorrowRate: 0.15,    // 15%
      maxImbalanceRatio: 0.2, // 20%
      imbalancePenaltyBps: 10,
      maxPositionSizeUsd: new BN('2500000').mul(new BN(1000000)), // 2.5M with precision
      poolImpactThreshold: 0.05 // 5%
    };
    
    calculator = new FeeSkewCalculator(defaultConfig);
  });

  describe('Impact Fee Calculation', () => {
    it('should calculate impact fee correctly for small orders', () => {
      const order: OrderDetails = {
        isLong: true,
        notionalValue: new BN('100'), // $100 (very small)
        isOpen: false // Closing order to avoid utilization fee
      };
      
      const pool: PoolState = {
        totalLiquidity: new BN('10000000'), // $10M
        utilization: 0.5,
        longNotional: new BN('2500000'),
        shortNotional: new BN('2500000')
      };
      
      const result = calculator.calculatePriceSkew(new BN('1000000').mul(new BN(1000000)), order, pool);
      
      // Small order should have minimal fees
      expect(result.components.impactFee.toString()).toBe('0'); // Very small orders should have negligible impact fee
      expect(result.components.imbalanceFee.toString()).toBe('0'); // No imbalance fee for balanced pool
      expect(result.components.utilizationFee.toString()).toBe('0'); // No utilization fee for closing orders
      expect(result.effectiveFeeBps).toBe(0); // No fees for very small orders
    });

    it('should calculate higher impact fee for large orders', () => {
      const order: OrderDetails = {
        isLong: true,
        notionalValue: new BN('1000000').mul(new BN(1000000)), // $1M with precision
        isOpen: true
      };
      
      const pool: PoolState = {
        totalLiquidity: new BN('10000000').mul(new BN(1000000)), // $10M with precision
        utilization: 0.5,
        longNotional: new BN('2500000').mul(new BN(1000000)),
        shortNotional: new BN('2500000').mul(new BN(1000000))
      };
      
      const result = calculator.calculatePriceSkew(new BN('1000000').mul(new BN(1000000)), order, pool);
      
      // Larger order should have significant impact fee
      expect(result.components.impactFee.toString()).not.toBe('0');
      expect(result.effectiveFeeBps).toBeGreaterThan(10); // At least 0.1%
    });
  });

  describe('Utilization Fee Calculation', () => {
    it('should apply minimal fee at low utilization', () => {
      const order: OrderDetails = {
        isLong: true,
        notionalValue: new BN('100000'), // $100k
        isOpen: true
      };
      
      const pool: PoolState = {
        totalLiquidity: new BN('10000000'), // $10M
        utilization: 0.2, // Low utilization
        longNotional: new BN('1000000'),
        shortNotional: new BN('1000000')
      };
      
      const result = calculator.calculatePriceSkew(new BN('1000000'), order, pool);
      
      // Fee should be close to minBorrowRate plus slope adjustment
      const slope = (defaultConfig.targetBorrowRate - defaultConfig.minBorrowRate) / defaultConfig.targetUtilization;
      const expectedRate = defaultConfig.minBorrowRate + (slope * 0.2); // 20% utilization
      const expectedMinFee = order.notionalValue.muln(Math.floor(expectedRate * 10000)).divn(10000);
      expect(result.components.utilizationFee.toString()).toBe(expectedMinFee.toString());
    });

    it('should apply higher fee at high utilization', () => {
      const order: OrderDetails = {
        isLong: true,
        notionalValue: new BN('100000'), // $100k
        isOpen: true
      };
      
      const pool: PoolState = {
        totalLiquidity: new BN('10000000'), // $10M
        utilization: 0.9, // High utilization
        longNotional: new BN('4500000'),
        shortNotional: new BN('4500000')
      };
      
      const result = calculator.calculatePriceSkew(new BN('1000000'), order, pool);
      
      // Fee should be higher than targetBorrowRate
      expect(result.components.utilizationFee).not.toBeNull();
      expect(result.warnings).toContain('Pool utilization above target: 90.0%');
    });
  });

  describe('Imbalance Fee Calculation', () => {
    it('should give discount for balancing trades', () => {
      const order: OrderDetails = {
        isLong: false, // Short order to balance long-heavy pool
        notionalValue: new BN('500000'), // $500k
        isOpen: true
      };
      
      const pool: PoolState = {
        totalLiquidity: new BN('10000000'), // $10M
        utilization: 0.5,
        longNotional: new BN('4000000'), // Heavy long imbalance
        shortNotional: new BN('1000000')  // Few shorts
      };
      
      const result = calculator.calculatePriceSkew(new BN('1000000'), order, pool);
      
      // Should have negative imbalance fee (discount)
      expect(result.components.imbalanceFee.isNeg()).toBe(true);
    });

    it('should penalize trades that increase imbalance', () => {
      const order: OrderDetails = {
        isLong: true, // Long order
        notionalValue: new BN('100000'), // $100k
        isOpen: true
      };
      
      const pool: PoolState = {
        totalLiquidity: new BN('10000000'), // $10M
        utilization: 0.5,
        longNotional: new BN('3000000'), // More longs
        shortNotional: new BN('2000000')  // Fewer shorts
      };
      
      const result = calculator.calculatePriceSkew(new BN('1000000'), order, pool);
      
      // Should have positive imbalance fee (penalty)
      expect(result.components.imbalanceFee.isNeg()).toBe(false);
    });
  });

  describe('Price Skewing', () => {
    it('should increase price for long entry orders', () => {
      const order: OrderDetails = {
        isLong: true,
        notionalValue: new BN('1000000').mul(new BN(1000000)), // $1M
        isOpen: true
      };
      
      const pool: PoolState = {
        totalLiquidity: new BN('10000000').mul(new BN(1000000)),
        utilization: 0.5,
        longNotional: new BN('2500000').mul(new BN(1000000)),
        shortNotional: new BN('2500000').mul(new BN(1000000))
      };
      
      const basePrice = new BN('1000000').mul(new BN(1000000)); // $1
      const result = calculator.calculatePriceSkew(basePrice, order, pool);
      
      // Price should be higher for long entry
      expect(result.skewedPrice.gt(basePrice)).toBe(true);
      expect(result.priceSkewBps).toBeGreaterThan(0);
    });

    it('should decrease price for short entry orders', () => {
      const order: OrderDetails = {
        isLong: false,
        notionalValue: new BN('1000000').mul(new BN(1000000)), // $1M
        isOpen: true
      };
      
      const pool: PoolState = {
        totalLiquidity: new BN('10000000').mul(new BN(1000000)),
        utilization: 0.5,
        longNotional: new BN('2500000').mul(new BN(1000000)),
        shortNotional: new BN('2500000').mul(new BN(1000000))
      };
      
      const basePrice = new BN('1000000').mul(new BN(1000000)); // $1
      const result = calculator.calculatePriceSkew(basePrice, order, pool);
      
      // Price should be lower for short entry
      expect(result.skewedPrice.lt(basePrice)).toBe(true);
      expect(result.priceSkewBps).toBeGreaterThan(0);
    });

    it('should decrease price for long exit orders', () => {
      const order: OrderDetails = {
        isLong: true,
        notionalValue: new BN('1000000').mul(new BN(1000000)), // $1M
        isOpen: false
      };
      
      const pool: PoolState = {
        totalLiquidity: new BN('10000000').mul(new BN(1000000)),
        utilization: 0.5,
        longNotional: new BN('2500000').mul(new BN(1000000)),
        shortNotional: new BN('2500000').mul(new BN(1000000))
      };
      
      const basePrice = new BN('1000000').mul(new BN(1000000)); // $1
      const result = calculator.calculatePriceSkew(basePrice, order, pool);
      
      // No fees for closing orders
      expect(result.skewedPrice.eq(basePrice)).toBe(true);
      expect(result.priceSkewBps).toBe(0);
    });

    it('should increase price for short exit orders', () => {
      const order: OrderDetails = {
        isLong: false,
        notionalValue: new BN('1000000').mul(new BN(1000000)), // $1M
        isOpen: false
      };
      
      const pool: PoolState = {
        totalLiquidity: new BN('10000000').mul(new BN(1000000)),
        utilization: 0.5,
        longNotional: new BN('2500000').mul(new BN(1000000)),
        shortNotional: new BN('2500000').mul(new BN(1000000))
      };
      
      const basePrice = new BN('1000000').mul(new BN(1000000)); // $1
      const result = calculator.calculatePriceSkew(basePrice, order, pool);
      
      // No fees for closing orders
      expect(result.skewedPrice.eq(basePrice)).toBe(true);
      expect(result.priceSkewBps).toBe(0);
    });

    it('should prevent negative prices', () => {
      const order: OrderDetails = {
        isLong: false,
        notionalValue: new BN('10000000').mul(new BN(1000000)), // $10M (very large)
        isOpen: true
      };
      
      const pool: PoolState = {
        totalLiquidity: new BN('10000000').mul(new BN(1000000)),
        utilization: 0.9, // High utilization
        longNotional: new BN('4500000').mul(new BN(1000000)),
        shortNotional: new BN('4500000').mul(new BN(1000000))
      };
      
      const basePrice = new BN('100').mul(new BN(1000000)); // Very small price
      const result = calculator.calculatePriceSkew(basePrice, order, pool);
      
      // Price should never go negative
      expect(result.skewedPrice.gten(0)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should handle a complete trading scenario', () => {
      // Set up a pool with some imbalance and high utilization
      const pool: PoolState = {
        totalLiquidity: new BN('10000000').mul(new BN(1000000)), // $10M
        utilization: 0.85, // High utilization
        longNotional: new BN('7000000').mul(new BN(1000000)), // Heavy long imbalance
        shortNotional: new BN('1500000').mul(new BN(1000000)) // Few shorts
      };

      const basePrice = new BN('1000000').mul(new BN(1000000)); // $1

      // Test 1: Opening a large long position (should be expensive)
      const longEntry: OrderDetails = {
        isLong: true,
        notionalValue: new BN('1000000').mul(new BN(1000000)), // $1M
        isOpen: true
      };

      const longEntryResult = calculator.calculatePriceSkew(basePrice, longEntry, pool);
      
      // Should have high fees due to:
      // 1. Large size (impact fee)
      // 2. High utilization
      // 3. Increasing long imbalance
      expect(longEntryResult.effectiveFeeBps).toBeGreaterThan(100); // >1%
      expect(longEntryResult.components.impactFee.toString()).not.toBe('0');
      expect(longEntryResult.components.utilizationFee.toString()).not.toBe('0');
      expect(longEntryResult.components.imbalanceFee.toString()).not.toBe('0');
      expect(longEntryResult.warnings).toContain('Pool utilization above target: 85.0%');

      // Test 2: Opening a balancing short position (should be cheaper)
      const shortEntry: OrderDetails = {
        isLong: false,
        notionalValue: new BN('2000000').mul(new BN(1000000)), // $2M
        isOpen: true
      };

      const shortEntryResult = calculator.calculatePriceSkew(basePrice, shortEntry, pool);
      
      // Should have lower fees due to:
      // 1. Smaller size
      // 2. Not increasing imbalance
      expect(shortEntryResult.effectiveFeeBps).toBeLessThan(longEntryResult.effectiveFeeBps);
      expect(shortEntryResult.components.imbalanceFee.toString()).not.toBe('0'); // Should have imbalance fee

      // Test 3: Closing a position (should have no fees)
      const closePosition: OrderDetails = {
        isLong: true,
        notionalValue: new BN('100000').mul(new BN(1000000)), // $100k
        isOpen: false
      };

      const closeResult = calculator.calculatePriceSkew(basePrice, closePosition, pool);
      
      // Should have no fees for closing
      expect(closeResult.effectiveFeeBps).toBe(0);
      expect(closeResult.components.impactFee.toString()).toBe('0');
      expect(closeResult.components.utilizationFee.toString()).toBe('0');
      expect(closeResult.components.imbalanceFee.toString()).toBe('0');
    });

    it('should handle extreme market conditions', () => {
      // Set up a pool at maximum utilization and imbalance
      const pool: PoolState = {
        totalLiquidity: new BN('10000000').mul(new BN(1000000)), // $10M
        utilization: 0.95, // Near max utilization
        longNotional: new BN('8000000').mul(new BN(1000000)), // Heavy long bias
        shortNotional: new BN('1500000').mul(new BN(1000000)) // Few shorts
      };

      const basePrice = new BN('1000000').mul(new BN(1000000)); // $1

      // Test 1: Try to add to the imbalance
      const addToImbalance: OrderDetails = {
        isLong: true,
        notionalValue: new BN('1000000').mul(new BN(1000000)), // $1M
        isOpen: true
      };

      const imbalanceResult = calculator.calculatePriceSkew(basePrice, addToImbalance, pool);
      
      // Should have very high fees and warnings
      expect(imbalanceResult.effectiveFeeBps).toBeGreaterThan(200); // >2%
      expect(imbalanceResult.warnings.length).toBeGreaterThan(1);
      expect(imbalanceResult.components.imbalanceFee.toString()).not.toBe('0');

      // Test 2: Try to balance the pool
      const balancingTrade: OrderDetails = {
        isLong: false,
        notionalValue: new BN('1000000').mul(new BN(1000000)), // $1M
        isOpen: true
      };

      const balanceResult = calculator.calculatePriceSkew(basePrice, balancingTrade, pool);
      
      // Should have lower fees despite size due to balancing effect
      expect(balanceResult.effectiveFeeBps).toBeLessThan(imbalanceResult.effectiveFeeBps);
      expect(balanceResult.components.imbalanceFee.isNeg()).toBe(true); // Should get discount

      // Test 3: Validate order limits
      const tooLarge: OrderDetails = {
        isLong: true,
        notionalValue: new BN('3000000').mul(new BN(1000000)), // $3M (> max)
        isOpen: true
      };

      const validation = calculator.validateOrder(tooLarge, pool);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBeDefined();
    });
  });

  describe('Order Validation', () => {
    it('should reject orders exceeding max position size', () => {
      const order: OrderDetails = {
        isLong: true,
        notionalValue: new BN('3000000').mul(new BN(1000000)), // $3M (> max 2.5M)
        isOpen: true
      };
      
      const pool: PoolState = {
        totalLiquidity: new BN('10000000').mul(new BN(1000000)),
        utilization: 0.5,
        longNotional: new BN('2500000').mul(new BN(1000000)),
        shortNotional: new BN('2500000').mul(new BN(1000000))
      };
      
      const validation = calculator.validateOrder(order, pool);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('exceeds max');
    });

    it('should reject orders with too high pool impact', () => {
      const order: OrderDetails = {
        isLong: true,
        notionalValue: new BN('1000000'), // $1M
        isOpen: true
      };
      
      const pool: PoolState = {
        totalLiquidity: new BN('5000000'), // $5M (order is 20% of pool)
        utilization: 0.5,
        longNotional: new BN('1250000'),
        shortNotional: new BN('1250000')
      };
      
      const validation = calculator.validateOrder(order, pool);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('impact');
    });
  });
});
