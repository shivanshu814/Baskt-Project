import BN from 'bn.js';
import { BaseRiskCheck } from './base.check';
import { RiskCheckContext, RiskCheckResult } from '../types';
import { GuardianCache } from '../utils/cache';
import { querierClient } from '../config/client';
import { CombinedPosition } from '@baskt/querier';
import { 
  calculateNotional, 
  calculateExposureImbalance, 
  calculateImbalanceRatio
} from '../utils/risk-calculations';
import { OnchainOrder, OrderAction } from '@baskt/types';

export class ExposureCheck extends BaseRiskCheck {
  name = 'exposure-concentration';

  constructor(
    private cache: GuardianCache,
    private maxImbalanceRatio: number, // Keep as ratio for readability
    private maxUserExposure: BN,
    private bootstrapThresholdRatio: number = 0.1 // Default to 10% of BLP
  ) {
    super();
  }

  async performCheck(context: RiskCheckContext): Promise<RiskCheckResult> {
    const { orderRequest } = context;

    if(orderRequest.order.action === OrderAction.Close) {
      return {
        passed: true,
        checkName: this.name,
        details: {
          skip: true,
          reason: 'Exposure check not applicable for close orders'
        }
      };
    }
    
    // Calculate order's notional exposure
    const orderNotional = orderRequest.order.openParams!.notionalValue;

    // Check user total exposure
    const userExposureResult = await this.checkUserExposure(orderRequest.order, orderNotional);
    if (!userExposureResult.passed) {
      return userExposureResult;
    }

    // Check basket skew/imbalance
    const skewResult = await this.checkBasketSkew(orderRequest.order, orderNotional);
    if (!skewResult.passed) {
      return skewResult;
    }

    return {
      passed: true,
      checkName: this.name,
      details: {
        userExposure: userExposureResult.details?.totalExposure,
        basketBalance: skewResult.details?.balance
      }
    };
  }

  private async checkUserExposure(
    order: OnchainOrder, 
    orderExposure: BN
  ): Promise<RiskCheckResult> {
    const userCacheKey = `user-exposure:${order.owner}`;
    let userPositions = this.cache.get<CombinedPosition[]>(userCacheKey);

    if (!userPositions) {
      const result = await querierClient.position.getPositions({
        userId: order.owner.toString(),
        isActive: true
      });

      if (!result.success) {
        return {
          passed: false,
          checkName: this.name,
          reason: 'Failed to fetch user positions',
          severity: 'critical'
        };
      }

      userPositions = result.data || [];
      this.cache.set(userCacheKey, userPositions);
    }

    // Calculate total user exposure (notional * leverage)
    let totalExposure = orderExposure;
    for (const position of userPositions) {
      const posSize = new BN(position.size || '0');
      //TODO: Move this to current price
      const posPrice = new BN(position.entryPrice || '0');
      
      const posNotional = calculateNotional(posSize, posPrice);
      totalExposure = totalExposure.add(posNotional);
    }

    if (totalExposure.gt(this.maxUserExposure)) {
      return {
        passed: false,
        checkName: this.name,
        reason: `User exposure ${totalExposure.toString()} exceeds limit ${this.maxUserExposure.toString()}`,
        severity: 'high',
        details: {
          currentExposure: totalExposure.toString(),
          orderExposure: orderExposure.toString(),
          maxAllowed: this.maxUserExposure.toString()
        }
      };
    }

    return {
      passed: true,
      checkName: this.name,
      details: { totalExposure: totalExposure.toString() }
    };
  }

  private async checkBasketSkew(
    order: any,
    orderNotional: BN
  ): Promise<RiskCheckResult> {
    const basketPositions = await querierClient.position.getPositions({
      basktId: order.basktId,
      isActive: true
    });

    if (!basketPositions.success || !basketPositions.data) {
      return {
        passed: false,
        checkName: this.name,
        reason: 'Failed to fetch basket positions',
        severity: 'critical'
      };
    }

    // Calculate notional exposure for longs and shorts (existing positions only)
    let longNotional = new BN(0);
    let shortNotional = new BN(0);

    for (const position of basketPositions.data) {
      const posSize = new BN(position.size || '0');
      const posPrice = new BN(position.entryPrice || '0');
      const notional = calculateNotional(posSize, posPrice);
      
      if (position.isLong) {
        longNotional = longNotional.add(notional);
      } else {
        shortNotional = shortNotional.add(notional);
      }
    }

    // Calculate total notional INCLUDING the new order
    const projectedLongNotional = order.isLong ? longNotional.add(orderNotional) : longNotional;
    const projectedShortNotional = !order.isLong ? shortNotional.add(orderNotional) : shortNotional;
    const totalNotional = projectedLongNotional.add(projectedShortNotional);

    // Bootstrap Phase Check: If total notional is below threshold of BLP, skip skew check
    try {
      const poolResult = await querierClient.pool.getLiquidityPool();
      
      if (poolResult.success && poolResult.data) {
        const totalLiquidity = new BN(poolResult.data.totalLiquidity || '0');
        
        // Only apply bootstrap logic if pool has liquidity
        if (!totalLiquidity.isZero()) {
          const bootstrapThreshold = totalLiquidity.muln(this.bootstrapThresholdRatio * 10000).divn(10000);
          
          if (totalNotional.lte(bootstrapThreshold)) {
            // Bootstrap phase - allow any skew
            return {
              passed: true,
              checkName: this.name,
              details: {
                bootstrapMode: true,
                totalNotional: totalNotional.toString(),
                bootstrapThreshold: bootstrapThreshold.toString(),
                balance: {
                  long: projectedLongNotional.toString(),
                  short: projectedShortNotional.toString()
                }
              }
            };
          }
        }
      }
    } catch (error) {
      // If pool fetch fails, continue with normal skew check
      // This ensures we fail-safe to existing behavior
    }

    // Rebalancing Check: Allow orders that reduce imbalance
    const currentImbalance = longNotional.sub(shortNotional);
    const orderReducesImbalance = (
      (currentImbalance.gt(new BN(0)) && !order.isLong) || // Long-heavy, new short reduces
      (currentImbalance.lt(new BN(0)) && order.isLong)      // Short-heavy, new long reduces
    );

    if (orderReducesImbalance && !currentImbalance.isZero()) {
      // Order helps rebalance the basket
      return {
        passed: true,
        checkName: this.name,
        details: {
          rebalancingOrder: true,
          balance: {
            long: projectedLongNotional.toString(),
            short: projectedShortNotional.toString()
          }
        }
      };
    }

    // Standard Skew Check
    if (!totalNotional.isZero()) {
      const imbalance = calculateExposureImbalance(projectedLongNotional, projectedShortNotional);
      const imbalanceRatio = calculateImbalanceRatio(imbalance, totalNotional);

      if (imbalanceRatio > this.maxImbalanceRatio) {
        return {
          passed: false,
          checkName: this.name,
          reason: `Basket skew ${(imbalanceRatio * 100).toFixed(2)}% exceeds limit ${(this.maxImbalanceRatio * 100).toFixed(2)}%`,
          severity: 'medium',
          details: {
            longNotional: projectedLongNotional.toString(),
            shortNotional: projectedShortNotional.toString(),
            imbalanceRatio: imbalanceRatio.toFixed(4)
          }
        };
      }
    }

    return {
      passed: true,
      checkName: this.name,
      details: {
        balance: {
          long: projectedLongNotional.toString(),
          short: projectedShortNotional.toString()
        }
      }
    };
  }
}
