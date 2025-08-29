import BN from 'bn.js';
import { BaseRiskCheck } from './base.check';
import { RiskCheckContext, RiskCheckResult } from '../types';
import { querierClient } from '../config/client';
import { calculateWorstCaseNotional, calculateNotional } from '../utils/risk-calculations';
import { OnchainOrder, OrderAction, OrderType } from '@baskt/types';

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
    const liquidityRequired = this.calculateLiquidityRequired(orderRequest.order, context.executionPrice);

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
      // Convert Decimal128 to string if it's an object
      const liquidityValue = typeof pool.totalLiquidity === 'object' && pool.totalLiquidity !== null
        ? pool.totalLiquidity.toString()
        : pool.totalLiquidity || '0';
      const effectiveLiquidity = new BN(liquidityValue);
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
            totalLiquidity: liquidityValue
          }
        };
      }

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
      console.log('Error verifying liquidity pool status:', error);
      return {
        passed: false,
        checkName: this.name,
        reason: 'Failed to verify liquidity pool status',
        severity: 'critical',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private calculateLiquidityRequired(order: OnchainOrder, executionPrice: BN): BN {

    if (order.action === OrderAction.Open) {
      return order.openParams!.notionalValue;
    }

    const size = new BN(order.closeParams!.sizeAsContracts);

    // Market close: use guardian-provided execution price
    if (order.orderType === OrderType.Market) {
      return calculateNotional(size, executionPrice);
    }

    // Limit close: use limit price and configured max slippage
    const limitPrice = new BN(order.limitParams?.limitPrice || executionPrice);
    const maxSlippageBps = new BN(order.limitParams?.maxSlippageBps || 0);

    // Worst-case notional = base + slippage
    const worstCaseNotional = calculateWorstCaseNotional(size, limitPrice, maxSlippageBps);

    return worstCaseNotional;
  }
}
