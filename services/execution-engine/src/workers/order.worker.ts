import { Job } from 'bullmq';
import { OrderAction } from '@baskt/types';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { basktClient, querierClient } from '../config/client';
import { PositionExecutor } from '../executors/position.executor';
import { TransactionPublisher } from '../publishers/transaction.publisher';
import { IdempotencyTracker } from '../utils/idempotency';
import { DataBus, deserializeMessage, logger, OrderAccepted, serializeMessage } from '@baskt/data-bus';
import { BaseWorker } from './base.worker';

export class OrderWorker extends BaseWorker {
  private executor: PositionExecutor;
  private publisher: TransactionPublisher;

  public static readonly EXECUTION_JOB_NAME = 'order-execution';
  public static readonly QUEUE_NAME = 'order-execution';

  constructor(dataBus: DataBus) {
    super({
      queueName: OrderWorker.QUEUE_NAME,
      concurrency: parseInt(process.env.EXECUTION_CONCURRENCY || '1'),
      limiter: {
        max: 50,
        duration: 1000
      }
    });
    
    this.executor = new PositionExecutor();
    this.publisher = new TransactionPublisher(dataBus);
  }

  protected async processJob(job: Job): Promise<void> {
    const order = deserializeMessage(job.data) as OrderAccepted;

    try {
      // Check idempotency
      const existingTx = await IdempotencyTracker.getTransaction(order.request.order.orderId.toString(), order.request.order.action);
      if (existingTx) {
        logger.info('Order already processed', { orderId: order.request.order.orderId, tx: existingTx });
        return;
      }

      // Acquire processing lock
      const acquired = await IdempotencyTracker.checkAndSet(order.request.order.orderId.toString(), order.request.order.action);
      if (!acquired) {
        logger.warn('Order already being processed', { orderId: order.request.order.orderId });
        return;
      }

      logger.info('Processing order execution', { orderId: order.request.order.orderId, action: order.request.order.action });

      // Execute based on action
      let txSignature: string;
      switch (order.request.order.action) {
        case OrderAction.Open:
          txSignature = await this.executor.openPosition(order);
          break;
        case OrderAction.Close:
          txSignature = await this.executor.closePosition(order);
          break;
        default:
          throw new Error(`Unknown order action: ${order.request.order.action}`);
      }

      // Record for idempotency
      await IdempotencyTracker.recordTransaction(order.request.order.orderId.toString(), order.request.order.action, txSignature);

      // Update order metadata
      const orderPDA = basktClient.getOrderPDA(order.request.order.orderId, order.request.order.owner);

      await querierClient.metadata.updateOrderByPDA(orderPDA.toString(), {
        orderStatus: 'FILLED',
        orderFullFillTx: txSignature,
        orderFullfillTs: Date.now().toString(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('Order execution failed', { 
        error: errorMessage,
        stack: errorStack,
        orderId: order.request.order.orderId,
        action: order.request.order.action
      });

      throw error; // Trigger BullMQ retry
    }
  }

  async addJob(data: OrderAccepted, jobType: string, jobId: string): Promise<void> {
    const jobInfo = {
      data,
      jobType, 
      jobId
    }

    await this.addJobInternal(
      OrderWorker.EXECUTION_JOB_NAME,
      serializeMessage(jobInfo),
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false
      }
    );
  }
}