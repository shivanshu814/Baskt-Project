import BN from 'bn.js';
import { BaseRiskCheck } from './base.check';
import { RiskCheckContext, RiskCheckResult } from '../types';
import { FeeSkewCalculator, FeeSkewConfig, PoolState, OrderDetails } from '../utils/fee-skew-calculator';
import { OnchainOrder, OrderAction } from '@baskt/types';
import { logger } from '../utils/logger';
import { GuardianCache } from '../utils/cache';

/**
 * FeeSkewCheck - Calculates and applies dynamic fee through price skewing
 * 
 * This check modifies the execution price to embed fees that will be collected
 * on-chain. Since the on-chain program only accepts a price parameter, we skew
 * the price to effectively collect fees that go to BLP.
 * 
 * Price skewing works as follows:
 * - For long opens: Increase entry price (trader pays more)
 * - For short opens: Decrease entry price (trader gets less collateral)
 * - For long closes: Decrease exit price (trader receives less)
 * - For short closes: Increase exit price (trader pays more to close)
 */
export class FeeSkewCheck extends BaseRiskCheck {
  name = 'fee-skew';
  private calculator: FeeSkewCalculator;
  
  constructor(
    private cache: GuardianCache,
    config?: Partial<FeeSkewConfig>
  ) {
    super();
    
    // Default configuration (can be overridden via environment or config)
    const defaultConfig: FeeSkewConfig = {
      // Impact scalar - larger = less impact
      // For reference: Jupiter uses 1.25B for SOL, 5B for ETH, 8B for BTC
      impactScalar: new BN(process.env.IMPACT_SCALAR || '2000000000'), // 2B default
      
      // Pool utilization parameters (dual slope model)
      targetUtilization: Number(process.env.TARGET_UTILIZATION || 0.8), // 80%
      minBorrowRate: Number(process.env.MIN_BORROW_RATE || 0.0001),   // 0.01% per hour
      targetBorrowRate: Number(process.env.TARGET_BORROW_RATE || 0.0008), // 0.08% per hour
      maxBorrowRate: Number(process.env.MAX_BORROW_RATE || 0.01),     // 1% per hour
      
      // Pool imbalance parameters
      maxImbalanceRatio: Number(process.env.MAX_IMBALANCE_RATIO || 0.3), // 30% max skew
      imbalancePenaltyBps: Number(process.env.IMBALANCE_PENALTY_BPS || 50), // 0.5% per 1% imbalance
      
      // Size limits
      maxPositionSizeUsd: new BN(process.env.MAX_POSITION_SIZE_USD || '2500000000000'), // $2.5M
      poolImpactThreshold: Number(process.env.POOL_IMPACT_THRESHOLD || 0.05), // 5% of pool
      
      ...config
    };
    
    this.calculator = new FeeSkewCalculator(defaultConfig, cache);
  }
  
  async performCheck(context: RiskCheckContext): Promise<RiskCheckResult> {
    const { orderRequest, executionPrice } = context;
    const order = orderRequest.order;
    
    try {
      // For now, only apply fee skewing to open orders
      // Close orders can be enabled later if needed
      if (order.action === OrderAction.Close) {
        logger.debug('Fee skew not applied to close orders', { 
          orderId: order.orderId 
        });
        return {
          passed: true,
          checkName: this.name,
          details: {
            skipped: true,
            reason: 'Fee skewing currently only applied to open orders'
          }
        };
      }
      
      // Get pool state using existing querier utilities
      const poolState = await FeeSkewCalculator.fetchPoolState(
        order.basktId.toString(),
        this.cache
      );
      
      if (!poolState) {
        logger.error('Failed to fetch pool state', { basktId: order.basktId });
        return {
          passed: false,
          checkName: this.name,
          reason: 'Failed to fetch pool state for fee calculation',
          severity: 'critical'
        };
      }
      
      // Prepare order details
      const orderDetails: OrderDetails = {
        isLong: order.openParams?.isLong || false,
        notionalValue: order.openParams?.notionalValue || new BN(0),
        isOpen: true,
        leverage: order.openParams?.leverageBps ? 
          order.openParams.leverageBps.toNumber() / 10000 : 1,
        basktId: order.basktId.toString()
      };
      
      // Validate order against pool constraints
      const validation = this.calculator.validateOrder(orderDetails, poolState);
      if (!validation.valid) {
        return {
          passed: false,
          checkName: this.name,
          reason: validation.reason,
          severity: 'high'
        };
      }
      
      // Calculate price skew to embed fees
      const feeResult = this.calculator.calculatePriceSkew(
        executionPrice,
        orderDetails,
        poolState
      );
      
      // Log fee breakdown for transparency and debugging
      logger.info('Price skew calculation completed', {
        orderId: order.orderId,
        basktId: order.basktId.toString(),
        originalPrice: executionPrice.toString(),
        skewedPrice: feeResult.skewedPrice.toString(),
        effectiveFeeUsd: feeResult.effectiveFeeUsd.toString(),
        effectiveFeeBps: feeResult.effectiveFeeBps,
        priceSkewBps: feeResult.priceSkewBps,
        poolUtilization: (poolState.utilization * 100).toFixed(1) + '%',
        components: {
          impactFee: feeResult.components.impactFee.toString(),
          utilizationFee: feeResult.components.utilizationFee.toString(),
          imbalanceFee: feeResult.components.imbalanceFee.toString()
        },
        warnings: feeResult.warnings
      });
      
      // CRITICAL: Modify the execution price in the context
      // This skewed price will be passed to the execution engine
      // and used as the entry_price parameter in the on-chain open_position instruction
      // The difference between original and skewed price represents the fee
      context.executionPrice = feeResult.skewedPrice;
      
      // Safety check: Ensure fees are not excessive
      const maxFeeBps = Number(process.env.MAX_TOTAL_FEE_BPS || 200); // 2% default max
      if (feeResult.effectiveFeeBps > maxFeeBps) {
        logger.warn('Excessive fee detected', {
          orderId: order.orderId,
          effectiveFeeBps: feeResult.effectiveFeeBps,
          maxFeeBps
        });
        
        return {
          passed: false,
          checkName: this.name,
          reason: `Effective fee too high: ${(feeResult.effectiveFeeBps / 100).toFixed(2)}%`,
          severity: 'medium',
          details: {
            effectiveFeeBps: feeResult.effectiveFeeBps,
            maxAllowedBps: maxFeeBps,
            components: feeResult.components
          }
        };
      }
      
      // Return success with detailed information
      return {
        passed: true,
        checkName: this.name,
        details: {
          originalPrice: executionPrice.toString(),
          skewedPrice: feeResult.skewedPrice.toString(),
          effectiveFeeUsd: feeResult.effectiveFeeUsd.toString(),
          effectiveFeeBps: feeResult.effectiveFeeBps,
          priceSkewApplied: true,
          poolState: {
            utilization: poolState.utilization,
            longNotional: poolState.longNotional.toString(),
            shortNotional: poolState.shortNotional.toString(),
            totalLiquidity: poolState.totalLiquidity.toString()
          },
          feeBreakdown: {
            impactFee: feeResult.components.impactFee.toString(),
            utilizationFee: feeResult.components.utilizationFee.toString(),
            imbalanceFee: feeResult.components.imbalanceFee.toString()
          },
          warnings: feeResult.warnings
        }
      };
      
    } catch (error) {
      logger.error('Fee skew check failed', {
        orderId: order.orderId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // In case of error, don't block the order but log the issue
      return {
        passed: true,
        checkName: this.name,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          fallbackToOriginalPrice: true
        }
      };
    }
  }
}