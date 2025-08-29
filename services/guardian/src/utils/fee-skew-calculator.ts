import BN from 'bn.js';
import { logger } from './logger';
import { querierClient } from '../config/client';
import { GuardianCache } from './cache';
import { OpenInterestData } from '@baskt/querier';

export interface FeeSkewConfig {
  // Impact scalars (larger = less impact)
  impactScalar: BN;          // Default impact scalar (e.g., 1.5B)
  
  // Pool utilization parameters (dual slope model)
  targetUtilization: number;  // Target utilization (e.g., 0.8 = 80%)
  minBorrowRate: number;      // Min borrow rate at 0% utilization
  targetBorrowRate: number;   // Borrow rate at target utilization
  maxBorrowRate: number;      // Max borrow rate at 100% utilization
  
  // Pool imbalance parameters
  maxImbalanceRatio: number;  // Max allowed long/short imbalance
  imbalancePenaltyBps: number; // Additional fee per % of imbalance
  
  // Size limits
  maxPositionSizeUsd: BN;     // Max position size (e.g., $2.5M)
  poolImpactThreshold: number; // Max % of pool per trade (e.g., 5%)
}

export interface PoolState {
  totalLiquidity: BN;
  utilization: number;        // Current pool utilization (0-1)
  longNotional: BN;           // Total long exposure
  shortNotional: BN;          // Total short exposure
}

export interface OrderDetails {
  isLong: boolean;
  notionalValue: BN;
  isOpen: boolean;           // true for open, false for close
  leverage?: number;         // Leverage for the position
  basktId?: string;          // Baskt ID for fetching OI data
}

export interface FeeCalculationResult {
  skewedPrice: BN;           // Price after skewing
  effectiveFeeUsd: BN;       // Effective fee in USD
  effectiveFeeBps: number;   // Effective fee in basis points
  priceSkewBps: number;      // Price skew applied in basis points
  components: {
    baseFee: BN;
    impactFee: BN;
    utilizationFee: BN;
    imbalanceFee: BN;
  };
  warnings: string[];
}

export class FeeSkewCalculator {
  private readonly BPS_DIVISOR = 10000;
  private readonly PRICE_PRECISION = new BN(1000000); // 1e6
  
  constructor(
    private config: FeeSkewConfig,
    private cache?: GuardianCache
  ) {}

  /**
   * Calculate price skew to embed fees for position opening/closing
   * This is the main entry point that guardian will use
   */
  calculatePriceSkew(
    basePrice: BN,
    order: OrderDetails,
    pool: PoolState
  ): FeeCalculationResult {
    const warnings: string[] = [];
    
    // 1. Calculate price impact fee (size-based, only for opening orders)
    const impactFeeUsd = order.isOpen ? this.calculateImpactFee(order.notionalValue) : new BN(0);
    
    // 2. Calculate utilization-based fee adjustment
    const utilizationFeeUsd = order.isOpen ? this.calculateUtilizationFee(
      order.notionalValue,
      pool.utilization,
    ) : new BN(0);
    
    // 3. Calculate imbalance fee (skew penalty/reward)
    const imbalanceFeeUsd = order.isOpen ? this.calculateImbalanceFee(
      order,
      pool,
      warnings
    ) : new BN(0);
    
    // 4. Sum all fee components
    const totalFeeUsd = impactFeeUsd
      .add(utilizationFeeUsd)
      .add(imbalanceFeeUsd);
    
    // 6. Convert fee to price skew
    const skewedPrice = this.applyPriceSkew(
      basePrice,
      totalFeeUsd,
      order
    );
    
    // 7. Calculate effective fee in basis points
    const effectiveFeeBps = totalFeeUsd
      .mul(new BN(this.BPS_DIVISOR))
      .div(order.notionalValue)
      .toNumber();
    
    // 8. Calculate price skew in basis points
    const priceSkewBps = skewedPrice
      .sub(basePrice)
      .abs()
      .mul(new BN(this.BPS_DIVISOR))
      .div(basePrice)
      .toNumber();
    
    // Add warnings for extreme conditions
    if (effectiveFeeBps > 100) {
      warnings.push(`High effective fee: ${(effectiveFeeBps / 100).toFixed(2)}%`);
    }
    
    if (pool.utilization > this.config.targetUtilization) {
      warnings.push(`Pool utilization above target: ${(pool.utilization * 100).toFixed(1)}%`);
    }
    
    logger.debug('Fee calculation breakdown', {
      basePrice: basePrice.toString(),
      skewedPrice: skewedPrice.toString(),
      totalFeeUsd: totalFeeUsd.toString(),
      effectiveFeeBps,
      components: {
        impactFee: impactFeeUsd.toString(),
        utilizationFee: utilizationFeeUsd.toString(),
        imbalanceFee: imbalanceFeeUsd.toString()
      }
    });
    
    return {
      skewedPrice,
      effectiveFeeUsd: totalFeeUsd,
      effectiveFeeBps,
      priceSkewBps,
      components: {
        impactFee: impactFeeUsd,
        utilizationFee: utilizationFeeUsd,
        imbalanceFee: imbalanceFeeUsd
      },
      warnings
    };
  }
  
  /**
   * Calculate impact fee based on order size (Jupiter-style)
   * Formula: impactFee = notionalValue^2 / impactScalar
   */
  private calculateImpactFee(notionalValue: BN): BN {
    // Prevent division by zero
    if (this.config.impactScalar.isZero()) {
      return new BN(0);
    }
    
    // Use linear impact for simplicity (can be quadratic for stronger impact)
    // impactFee = notionalValue / impactScalar * notionalValue
    return notionalValue
      .mul(notionalValue)
      .div(this.config.impactScalar)
      .div(new BN(this.PRICE_PRECISION)); // Adjust for precision
  }
  
  /**
   * Calculate utilization-based fee using dual slope model
   */
  private calculateUtilizationFee(
    notionalValue: BN,
    utilization: number,
  ): BN {

    
    let borrowRate: number;
    
    if (utilization <= this.config.targetUtilization) {
      // Below target: gentle slope
      const slope = (this.config.targetBorrowRate - this.config.minBorrowRate) 
        / this.config.targetUtilization;
      borrowRate = this.config.minBorrowRate + (slope * utilization);
    } else {
      // Above target: aggressive slope
      const slope = (this.config.maxBorrowRate - this.config.targetBorrowRate) 
        / (1 - this.config.targetUtilization);
      borrowRate = this.config.targetBorrowRate + 
        (slope * (utilization - this.config.targetUtilization));
    }
    
    // Convert to basis points and apply to notional
    const borrowRateBps = Math.floor(borrowRate * this.BPS_DIVISOR);
    return notionalValue
      .mul(new BN(borrowRateBps))
      .div(new BN(this.BPS_DIVISOR));
  }
  
  /**
   * Calculate imbalance fee/reward based on pool skew
   */
  private calculateImbalanceFee(
    order: OrderDetails,
    pool: PoolState,
    warnings: string[]
  ): BN {
    const totalNotional = pool.longNotional.add(pool.shortNotional);
    
    if (totalNotional.isZero()) {
      return new BN(0);
    }
    
    // Calculate current imbalance
    const currentImbalance = pool.longNotional.sub(pool.shortNotional).abs();
    const currentImbalanceRatio = currentImbalance
      .mul(new BN(this.BPS_DIVISOR))
      .div(totalNotional)
      .toNumber() / this.BPS_DIVISOR;
    
    // Calculate projected imbalance after order
    const projectedLongNotional = order.isLong 
      ? pool.longNotional.add(order.notionalValue)
      : pool.longNotional;
    const projectedShortNotional = !order.isLong
      ? pool.shortNotional.add(order.notionalValue)
      : pool.shortNotional;
    
    const projectedImbalance = projectedLongNotional.sub(projectedShortNotional).abs();
    const projectedTotalNotional = projectedLongNotional.add(projectedShortNotional);
    const projectedImbalanceRatio = projectedImbalance
      .mul(new BN(this.BPS_DIVISOR))
      .div(projectedTotalNotional)
      .toNumber() / this.BPS_DIVISOR;
    
    // Order reduces imbalance: apply discount
    if (projectedImbalanceRatio < currentImbalanceRatio) {
      // Reward for rebalancing (negative fee = discount)
      const rewardBps = Math.floor(
        (currentImbalanceRatio - projectedImbalanceRatio) * this.config.imbalancePenaltyBps
      );
      return order.notionalValue
        .mul(new BN(rewardBps))
        .div(new BN(this.BPS_DIVISOR))
        .neg(); // Negative for discount
    }
    
    // Order increases imbalance: apply penalty
    if (projectedImbalanceRatio > this.config.maxImbalanceRatio) {
      warnings.push(
        `Order would exceed max imbalance ratio: ${(projectedImbalanceRatio * 100).toFixed(1)}%`
      );
      
      // Apply progressive penalty
      const excessRatio = projectedImbalanceRatio - this.config.maxImbalanceRatio;
      const penaltyBps = Math.floor(excessRatio * this.config.imbalancePenaltyBps * 2); // 2x penalty
      
      return order.notionalValue
        .mul(new BN(penaltyBps))
        .div(new BN(this.BPS_DIVISOR));
    }
    
    // Normal imbalance fee
    const imbalanceBps = Math.floor(
      (projectedImbalanceRatio - currentImbalanceRatio) * this.config.imbalancePenaltyBps
    );
    
    return order.notionalValue
      .mul(new BN(Math.max(0, imbalanceBps)))
      .div(new BN(this.BPS_DIVISOR));
  }
  
  /**
   * Apply fee to price through skewing
   * For longs: increase entry price (pay more), decrease exit price (receive less)
   * For shorts: decrease entry price (receive less collateral), increase exit price (pay more)
   */
  private applyPriceSkew(
    basePrice: BN,
    feeUsd: BN,
    order: OrderDetails
  ): BN {
    // Calculate fee as percentage of notional
    const feeRatio = feeUsd
      .mul(this.PRICE_PRECISION)
      .div(order.notionalValue);
    
    let skewedPrice: BN;
    
    if (order.isOpen) {
      // Opening position: skew against trader
      if (order.isLong) {
        // Long entry: increase price (trader pays more)
        skewedPrice = basePrice
          .mul(this.PRICE_PRECISION.add(feeRatio))
          .div(this.PRICE_PRECISION);
      } else {
        // Short entry: decrease price (trader receives less collateral for same size)
        skewedPrice = basePrice
          .mul(this.PRICE_PRECISION.sub(feeRatio))
          .div(this.PRICE_PRECISION);
      }
    } else {
      // Closing position: skew against trader
      if (order.isLong) {
        // Long exit: decrease price (trader receives less)
        skewedPrice = basePrice
          .mul(this.PRICE_PRECISION.sub(feeRatio))
          .div(this.PRICE_PRECISION);
      } else {
        // Short exit: increase price (trader pays more to close)
        skewedPrice = basePrice
          .mul(this.PRICE_PRECISION.add(feeRatio))
          .div(this.PRICE_PRECISION);
      }
    }
    
    // Ensure price doesn't go negative
    if (skewedPrice.lte(new BN(0))) {
      logger.error('Price skew resulted in non-positive price', {
        basePrice: basePrice.toString(),
        feeUsd: feeUsd.toString(),
        feeRatio: feeRatio.toString()
      });
      return basePrice; // Fallback to base price
    }
    
    return skewedPrice;
  }
  
  /**
   * Validate order against pool constraints
   */
  validateOrder(
    order: OrderDetails,
    pool: PoolState
  ): { valid: boolean; reason?: string } {
    // Check max position size
    if (order.notionalValue.gt(this.config.maxPositionSizeUsd)) {
      return {
        valid: false,
        reason: `Position size ${order.notionalValue.toString()} exceeds max ${this.config.maxPositionSizeUsd.toString()}`
      };
    }
    
    // Check pool impact threshold
    const poolImpact = order.notionalValue
      .mul(new BN(this.BPS_DIVISOR))
      .div(pool.totalLiquidity)
      .toNumber() / this.BPS_DIVISOR;
    
    if (poolImpact > this.config.poolImpactThreshold) {
      return {
        valid: false,
        reason: `Order impact ${(poolImpact * 100).toFixed(1)}% exceeds threshold ${(this.config.poolImpactThreshold * 100).toFixed(1)}%`
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Helper to fetch pool state using existing querier utilities
   */
  static async fetchPoolState(
    basktId: string,
    cache?: GuardianCache
  ): Promise<PoolState | null> {
    try {
      // Try cache first for OI data
      const cacheKey = `oi-data:${basktId}`;
      let oiData = cache?.get<OpenInterestData>(cacheKey);
      
      if (!oiData) {
        // Fetch open interest data using existing utility
        const oiResult = await querierClient.metrics.getOpenInterestForBaskt({
          basktId
        });
        
        if (!oiResult.success || !oiResult.data) {
          logger.error('Failed to fetch open interest data', { basktId });
          return null;
        }
        
        oiData = oiResult.data;
        cache?.set(cacheKey, oiData);
      }
      
      // Fetch pool liquidity
      const poolResult = await querierClient.pool.getLiquidityPool();
      if (!poolResult.success || !poolResult.data) {
        logger.error('Failed to fetch pool data');
        return null;
      }
      
      const totalLiquidity = new BN(poolResult.data.totalLiquidity || '0');
      const longNotional = new BN(oiData.longOpenInterest || 0).mul(new BN(1000000)); // Convert to proper precision
      const shortNotional = new BN(oiData.shortOpenInterest || 0).mul(new BN(1000000));
      const totalExposure = longNotional.add(shortNotional);
      
      const utilization = totalLiquidity.isZero() 
        ? 0 
        : totalExposure.mul(new BN(10000)).div(totalLiquidity).toNumber() / 10000;
      
      return {
        totalLiquidity,
        utilization: Math.min(1, utilization),
        longNotional,
        shortNotional
      };
      
    } catch (error) {
      logger.error('Error fetching pool state', {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
}