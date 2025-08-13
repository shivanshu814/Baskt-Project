import { DataBus, STREAMS, MessageEnvelope, OrderRequest, OrderAccepted, OrderRejected } from '@baskt/data-bus';
import { RiskCheckContext, RiskCheckResult, RiskCheck } from '../types';
import { logger } from '../utils/logger';
import { querierClient } from '../config/client';
import { OnchainOrder } from '@baskt/types';
import BN from 'bn.js';

export class OrderRequestHandler {
  constructor(
    private dataBus: DataBus,
    private riskChecks: RiskCheck[]
  ) { }

  private async fetchExecutionPrice(order: OnchainOrder): Promise<BN> {
    const navResult = await querierClient.baskt.getBasktNAV(order.basktId.toString());
    if (navResult.success && navResult.data) {
      return new BN(navResult.data.nav);
    }
    throw new Error('Failed to fetch NAV');
  }

  async handleOrderRequest(envelope: MessageEnvelope<OrderRequest>): Promise<void> {
    const orderRequest = envelope.payload;
    const order = orderRequest.order;

    try {
      logger.info({ orderId: orderRequest.order.orderId }, 'Processing order request');

      let executionPrice: BN;
      try {
        executionPrice = order.limitParams?.limitPrice ?? await this.fetchExecutionPrice(order); // Default to limit price for limit ordersnew Error('Failed to fetch NAV');
      } catch (error) {
        logger.error({ error, orderId: order.orderId }, 'Failed to fetch NAV for market order');
        await this.handleOrderRejection(orderRequest, {
          passed: false,
          checkName: 'price-fetch',
          reason: 'Failed to fetch current NAV for market order',
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
        await this.handleOrderAcceptance(orderRequest, results, executionPrice);
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
