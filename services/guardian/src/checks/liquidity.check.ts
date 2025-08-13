import BN from 'bn.js';
import { BaseRiskCheck } from './base.check';
import { RiskCheckContext, RiskCheckResult } from '../types';
import { querierClient } from '../config/client';
import { calculateWorstCaseNotional } from '../utils/risk-calculations';
import { OnchainOrder, OrderAction } from '@baskt/types';

export class LiquidityCheck extends BaseRiskCheck {
  name = 'liquidity';

  constructor(
    private minLiquidityBufferRatio: number = 0.1 // 10% buffer default
  ) {
    super();
  }

  async performCheck(context: RiskCheckContext): Promise<RiskCheckResult> {
    const { orderRequest } = context;

    
    // Calculate the liquidity impact of this order
    const liquidityRequired = this.calculateLiquidityRequired(orderRequest.order);

    try {
      const poolResult = await querierClient.pool.getLiquidityPool();

      if (!poolResult.success || !poolResult.data) {
        return {
          passed: false,
          checkName: this.name,
          reason: 'Failed to fetch liquidity pool data',
          severity: 'critical'
        };
      }

      const pool = poolResult.data;
      
      // Use totalLiquidity for now (effective liquidity calculation can be added when available)
      const effectiveLiquidity = new BN(pool.totalLiquidity || '0');
      
      // Apply buffer to required liquidity
      const requiredWithBuffer = liquidityRequired
        .muln(Math.floor((1 + this.minLiquidityBufferRatio) * 10000))
        .divn(10000);

      if (effectiveLiquidity.lt(requiredWithBuffer)) {
        return {
          passed: false,
          checkName: this.name,
          reason: 'Insufficient liquidity in pool',
          severity: 'high',
          details: {
            effectiveLiquidity: effectiveLiquidity.toString(),
            required: liquidityRequired.toString(),
            requiredWithBuffer: requiredWithBuffer.toString(),
            totalLiquidity: pool.totalLiquidity || '0'
          }
        };
      }

      // Rate limiting check can be added when pool interface supports it

      return {
        passed: true,
        checkName: this.name,
        details: {
          effectiveLiquidity: effectiveLiquidity.toString(),
          required: liquidityRequired.toString(),
          utilizationAfter: liquidityRequired
            .muln(10000)
            .div(effectiveLiquidity)
            .toString() // basis points
        }
      };
    } catch (error) {
      return {
        passed: false,
        checkName: this.name,
        reason: 'Failed to verify liquidity pool status',
        severity: 'critical',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private calculateLiquidityRequired(order: OnchainOrder): BN {

    if(order.action === OrderAction.Open) {
      return order.openParams!.notionalValue;
    }

    const size = new BN(order.closeParams!.sizeAsContracts);
    const limitPrice = new BN(order.limitParams!.limitPrice);
    const maxSlippageBps = new BN(order.limitParams!.maxSlippageBps);
    
    // For opening positions, liquidity needed is the worst-case notional
    // This represents the maximum the pool might need to pay out
    const worstCaseNotional = calculateWorstCaseNotional(size, limitPrice, maxSlippageBps);
    
    // For leverage, the pool risk is the notional, not just collateral
    return worstCaseNotional;
  }
}
