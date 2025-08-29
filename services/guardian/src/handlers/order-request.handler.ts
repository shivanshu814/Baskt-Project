import { DataBus, STREAMS, MessageEnvelope, OrderRequest, OrderAccepted, OrderRejected } from '@baskt/data-bus';
import { RiskCheckContext, RiskCheckResult, RiskCheck } from '../types';
import { logger } from '../utils/logger';
import { basktClient, querierClient } from '../config/client';
import { OnchainOrder, OnchainOrderStatus } from '@baskt/types';
import BN from 'bn.js';
import { FeeSkewCheck } from '../checks/fee-skew.check';
import { GuardianCache } from '../utils/cache';

export class OrderRequestHandler {
  private feeSkewCheck: FeeSkewCheck;
  
  constructor(
    private dataBus: DataBus,
    private riskChecks: RiskCheck[],
    cache?: GuardianCache
  ) {
    // Initialize fee skew check separately - it runs after validation
    this.feeSkewCheck = new FeeSkewCheck(cache || new GuardianCache({ ttl: 60000, maxSize: 100 }));
  }

  private async fetchExecutionPrice(order: OnchainOrder): Promise<BN> {
    const navResult = await querierClient.baskt.getBasktNAV(order.basktId.toString());
    if (!navResult.success || !navResult.data) {
      throw new Error(navResult.message || 'Failed to fetch NAV');
    }
    const nav = navResult.data.nav;
    if (typeof nav !== 'number' || !isFinite(nav) || nav <= 0) {
      throw new Error('Invalid NAV value');
    }
    return new BN(nav);
  }

  async handleOrderRequest(envelope: MessageEnvelope<OrderRequest>): Promise<void> {
    const orderRequest = envelope.payload;
    const order = orderRequest.order;

    try {
      logger.info({ orderId: orderRequest.order.orderId }, 'Processing order request');

      let executionPrice: BN;
      try {
        executionPrice = order.limitParams?.limitPrice ?? await this.fetchExecutionPrice(order);
      } catch (error) {
        logger.error({ error, orderId: order.orderId }, 'Failed to fetch NAV for market order');
        await this.handleOrderRejection(orderRequest, {
          passed: false,
          checkName: 'price-fetch',
          reason: 'Failed to fetch valid current NAV for market order',
          severity: 'critical'
        });
        return;
      }

      // Build risk context with execution price
      const context: RiskCheckContext = {
        orderRequest,
        executionPrice
      };

      // Run all risk checks
      const results = await this.runRiskChecks(context);

      // Check if any failed
      const failedCheck = results.find(r => !r.passed);

      if (failedCheck) {
        await this.handleOrderRejection(orderRequest, failedCheck);
      } else {
        // All validation checks passed, now apply fee skewing
        // This modifies the execution price to embed fees
        let finalExecutionPrice = executionPrice;
        
        try {
          // Run fee skew check to calculate skewed price
          // This runs AFTER validation to ensure liquidity checks use correct price
          const feeSkewResult = await this.feeSkewCheck.check(context);
          
          if (!feeSkewResult.passed) {
            // Fee skew failed (e.g., excessive fees)
            await this.handleOrderRejection(orderRequest, feeSkewResult);
            return;
          }
          
          // Use the skewed price from context (modified by FeeSkewCheck)
          finalExecutionPrice = context.executionPrice;
          
          logger.info({
            orderId: order.orderId,
            originalPrice: executionPrice.toString(),
            skewedPrice: finalExecutionPrice.toString(),
            feeSkewDetails: feeSkewResult.details
          }, 'Price skewing applied for fee collection');
          
        } catch (error) {
          logger.error({
            error,
            orderId: order.orderId
          }, 'Fee skew calculation failed, using original price');
          // On error, continue with original price
        }
        
        // Verify on-chain state: order must still be pending
        const { status } = await basktClient.getOrderStatusWithRetry({
          orderId: Number(order.orderId),
          owner: order.owner,
          commitment: 'confirmed',
          retries: 3,
          delay: 1500,
        });

        if (!status || status === OnchainOrderStatus.CANCELLED || status === OnchainOrderStatus.FILLED) {
          logger.info({ orderId: order.orderId, status }, 'Order not pending; rejecting');  
          await this.handleOrderRejection(orderRequest, {
            passed: false,
            checkName: 'order_cancelled',
            reason: !status? 'Order was cancelled (account closed)' : 'Order was not pending',
            severity: 'low'
          });
          return;
        }

        // Use the final (potentially skewed) execution price
        await this.handleOrderAcceptance(orderRequest, results, finalExecutionPrice);
      }

    } catch (error) {
      logger.error({ error, orderId: orderRequest.order.orderId }, 'Order processing error');
      await this.handleOrderRejection(orderRequest, {
        passed: false,
        checkName: 'system',
        reason: 'Risk evaluation error',
        severity: 'critical'
      });
    }
  }

  private async runRiskChecks(context: RiskCheckContext): Promise<RiskCheckResult[]> {
    const results = await Promise.all(
      this.riskChecks.map(check => check.check(context))
    );

    logger.debug({
      orderId: context.orderRequest.order.orderId,
      results: results.map(r => ({
        check: r.checkName,
        passed: r.passed
      }))
    }, 'Risk check results');

    return results;
  }

  private async handleOrderAcceptance(
    orderRequest: OrderRequest,
    results: RiskCheckResult[],
    executionPrice: BN
  ): Promise<void> {
    const accepted: OrderAccepted = {
      request: orderRequest,
      executionPrice: executionPrice
    };

    await this.dataBus.publish(STREAMS.order.accepted, accepted);

    logger.info({
      orderId: orderRequest.order.orderId,
      checks: results.map(r => r.checkName)
    }, 'Order accepted');
  }

  private async handleOrderRejection(
    orderRequest: OrderRequest,
    failedCheck: RiskCheckResult
  ): Promise<void> {
    const rejected: OrderRejected = {
      request: orderRequest,
      reason: failedCheck.reason || 'Risk check failed'
    };

    await this.dataBus.publish(STREAMS.order.rejected, rejected);

    logger.warn({
      orderId: orderRequest.order.orderId,
      check: failedCheck.checkName,
      reason: failedCheck.reason,
      severity: failedCheck.severity
    }, 'Order rejected');
  }
}
