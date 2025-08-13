import { DataBus, OrderRequest, STREAMS } from '@baskt/data-bus';
import BN from 'bn.js';
import { GuardianConfig, RiskCheck } from './types';
import { OrderRequestHandler } from './handlers/order-request.handler';
import {
  PositionSizeCheck,
  LiquidityCheck,
  ExposureCheck,
  UserLimitCheck
} from './checks';
import { GuardianCache } from './utils/cache';
import { logger } from './utils/logger';

export class GuardianService {
  private dataBus: DataBus;
  private cache: GuardianCache;
  private riskChecks: RiskCheck[] = [];
  private orderHandler: OrderRequestHandler;
  private isRunning = false;
  private startTime: number = Date.now();

  constructor(private config: GuardianConfig) {
    this.dataBus = new DataBus({
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      autoConnect: false
    });

    this.cache = new GuardianCache(config.cache);
    this.initializeRiskChecks();
    this.orderHandler = new OrderRequestHandler(this.dataBus, this.riskChecks);
  }

  private initializeRiskChecks(): void {
    const { riskLimits, features } = this.config;

    // Always enabled checks
    this.riskChecks.push(
      new PositionSizeCheck(this.cache, this.config.maxPositionSize),
      // new ExposureCheck(
      //   this.cache,
      //   riskLimits.maxSkewRatio!, // Already a ratio (0.3 = 30%)
      //   new BN(riskLimits.maxUserExposure!),
      //   riskLimits.bootstrapThresholdRatio || 0.1 // Default to 10% if not configured
      // ),
      new UserLimitCheck(this.cache, riskLimits.maxPositionsPerUser!)
    );

    // Feature-flagged checks
      this.riskChecks.push(
        new LiquidityCheck(riskLimits.minLiquidityBuffer || 0.1)
      );



    logger.info({
      checks: this.riskChecks.map(c => c.name),
      config: this.config
    }, 'Risk checks initialized');
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    try {
      logger.info('Starting Guardian service...');

      await this.dataBus.connect();

      // Subscribe to order requests using consume
      await this.dataBus.consume<OrderRequest>(
        STREAMS.order.request,
        'guardian',
        `guardian-${process.env.INSTANCE_ID || '1'}`,
        async (envelope) => {
          await this.orderHandler.handleOrderRequest(envelope);
        }
      );

      this.isRunning = true;
      this.startTime = Date.now();

      logger.info('Guardian service started successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to start Guardian service');
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    logger.info('Stopping Guardian service...');

    await this.dataBus.close();
    this.cache.clear();
    this.isRunning = false;

    logger.info('Guardian service stopped');
  }

  getHealth() {
    const healthy = this.isRunning;
    return {
      healthy,
      service: 'guardian',
      uptime: Date.now() - this.startTime,
      cache: this.cache.getStats(),
      checks: this.riskChecks.map(c => ({
        name: c.name,
        enabled: c.enabled
      }))
    };
  }

  getStatus() {
    return {
      ...this.getHealth(),
      config: {
        checks: this.riskChecks.length,
        cacheSize: this.config.cache.maxSize,
        cacheTTL: this.config.cache.ttl
      }
    };
  }
}
