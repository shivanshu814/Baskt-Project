import { Job } from 'bullmq';
import { BasktCreatedMessage, logger, DataBus } from '@baskt/data-bus';
import { BasktExecutor } from '../executors/baskt.executor';
import { TransactionPublisher } from '../publishers/transaction.publisher';
import { IdempotencyTracker } from '../utils/idempotency';
import { BaseWorker, JobInfo } from './base.worker';

export class BasktWorker extends BaseWorker {
  private executor: BasktExecutor;
  private publisher: TransactionPublisher;

  public static readonly ACTIVATION_JOB_NAME = 'baskt-activation';
  public static readonly QUEUE_NAME = 'baskt-execution';

  constructor(dataBus: DataBus) {
    super({
      queueName: BasktWorker.QUEUE_NAME,
      concurrency: parseInt(process.env.EXECUTION_CONCURRENCY || '1'),
      limiter: {
        max: 10,
        duration: 1000
      }
    });
    
    this.executor = new BasktExecutor();
    this.publisher = new TransactionPublisher(dataBus);
  }

  protected async processJob(jobInfo: JobInfo, job: Job): Promise<void> {
    const basktMessage = jobInfo.data as BasktCreatedMessage;

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
  }

  async addJob(jobInfo: JobInfo): Promise<void> {
    await this.addJobInternal(
      BasktWorker.ACTIVATION_JOB_NAME,
      jobInfo,
      {
        jobId: jobInfo.jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false
      }
    );
  }
}
