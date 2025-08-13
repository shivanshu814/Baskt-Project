import { Worker, Job } from 'bullmq';
import { OrderAction } from '@baskt/types';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { redis } from '../config/queue';
import { basktClient, querierClient } from '../config/client';
import { PositionExecutor } from '../executors/position.executor';
import { TransactionPublisher } from '../publishers/transaction.publisher';
import { IdempotencyTracker } from '../utils/idempotency';
import { DataBus, deserializeMessage, logger, OrderAccepted } from '@baskt/data-bus';

export class OrderWorker {
  private worker: Worker | null = null;
  private executor: PositionExecutor;
  private publisher: TransactionPublisher;

  public static readonly EXECUTION_JOB_NAME = 'order-execution';

  constructor(dataBus: DataBus) {
    this.executor = new PositionExecutor();
    this.publisher = new TransactionPublisher(dataBus);
  }

  async start(): Promise<void> {
    this.worker = new Worker(
      'execution',
      async (job: Job) => {
        if (job.name !== OrderWorker.EXECUTION_JOB_NAME) {
          logger.warn('Ignoring job type', { jobName: job.name });
          return;
        }

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
      },
      {
        connection: redis,
        concurrency: parseInt(process.env.EXECUTION_CONCURRENCY || '1'),
        limiter: {
          max: 50,
          duration: 1000
        }
      }
    );

    logger.info('Order worker started');
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }
}