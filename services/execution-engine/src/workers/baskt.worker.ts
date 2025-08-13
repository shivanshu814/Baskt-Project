import { Worker, Job } from 'bullmq';
import { BasktCreatedMessage, logger, DataBus, deserializeMessage } from '@baskt/data-bus';
import { redis } from '../config/queue';
import { BasktExecutor } from '../executors/baskt.executor';
import { TransactionPublisher } from '../publishers/transaction.publisher';
import { IdempotencyTracker } from '../utils/idempotency';

export class BasktWorker {
  private worker: Worker | null = null;
  private executor: BasktExecutor;
  private publisher: TransactionPublisher;

  public static readonly ACTIVATION_JOB_NAME = 'baskt-activation';

  constructor(dataBus: DataBus) {
    this.executor = new BasktExecutor();
    this.publisher = new TransactionPublisher(dataBus);
  }

  async start(): Promise<void> {
    this.worker = new Worker(
      'baskt-execution',
      async (job: Job) => {
        if (job.name !== BasktWorker.ACTIVATION_JOB_NAME) {
          logger.warn('Ignoring job type', { jobName: job.name });
          return;
        }

        const basktMessage = deserializeMessage(job.data) as BasktCreatedMessage;

        try {
          // Check idempotency
          const existingTx = await IdempotencyTracker.getTransaction(basktMessage.basktId, 'ACTIVATE');
          if (existingTx) {
            logger.info('Baskt already processed', { basktId: basktMessage.basktId, tx: existingTx });
            return;
          }

          // Acquire processing lock
          const acquired = await IdempotencyTracker.checkAndSet(basktMessage.basktId, 'ACTIVATE');
          if (!acquired) {
            logger.warn('Baskt already being processed', { basktId: basktMessage.basktId });
            return;
          }

          logger.info('Processing baskt activation', { basktId: basktMessage.basktId });

          // Execute baskt activation using the executor
          const txSignature = await this.executor.activateBaskt(basktMessage);

          // Record for idempotency
          await IdempotencyTracker.recordTransaction(basktMessage.basktId, 'ACTIVATE', txSignature);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;
          
          logger.error('Baskt activation failed', { 
            error: errorMessage,
            stack: errorStack,
            basktId: basktMessage.basktId
          });

          throw error; // Trigger BullMQ retry
        }
      },
      {
        connection: redis,
        concurrency: parseInt(process.env.EXECUTION_CONCURRENCY || '1'),
        limiter: {
          max: 10,
          duration: 1000
        }
      }
    );

    logger.info('Baskt worker started');
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }
}
