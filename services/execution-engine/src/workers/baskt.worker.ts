import { Job } from 'bullmq';
import { BasktCreatedMessage, logger, DataBus, STREAMS, RebalanceRequestedMessage, RebalanceRequestPayload } from '@baskt/data-bus';
import { BasktExecutor } from '../executors/baskt.executor';
import { TransactionPublisher } from '../publishers/transaction.publisher';
import { IdempotencyTracker } from '../utils/idempotency';
import { BaseWorker, JobInfo } from './base.worker';
import { RebalanceRequestEvent } from '@baskt/types';

export class BasktWorker extends BaseWorker {
  private executor: BasktExecutor;
  private publisher: TransactionPublisher;

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

  private async ensureJobIsNotAlreadyProcessing(baskId: string, jobInfo: JobInfo, job: Job): Promise<void> {
    // Check idempotency
    const existingTx = await IdempotencyTracker.getTransaction(baskId, jobInfo.jobType);
    if (existingTx) {
      logger.info('Baskt already processed', { basktId: baskId, tx: existingTx });
      return;
    }

    // Acquire processing lock
    const acquired = await IdempotencyTracker.checkAndSet(baskId, jobInfo.jobType);
    if (!acquired) {
      logger.warn('Baskt already being processed', { basktId: baskId });
      return;
    }
  }

  private async processBasktCreated(jobInfo: JobInfo, job: Job): Promise<void> {
    const basktMessage = jobInfo.data as BasktCreatedMessage;

    try {
      await this.ensureJobIsNotAlreadyProcessing(basktMessage.basktId, jobInfo, job);

      logger.info('Processing baskt activation', { basktId: basktMessage.basktId });

      // Execute baskt activation using the executor
      const txSignature = await this.executor.activateBaskt(basktMessage);

      // Record for idempotency
      await IdempotencyTracker.recordTransaction(basktMessage.basktId, jobInfo.jobType, txSignature);

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

  private async processRebalanceRequested(jobInfo: JobInfo, job: Job): Promise<void> {
  const rebalanceRequest = jobInfo.data as RebalanceRequestedMessage;
    try {
      await this.ensureJobIsNotAlreadyProcessing(rebalanceRequest.rebalanceRequest.basktId.toString(), jobInfo, job);
      logger.info('Processing rebalance requested', { basktId: rebalanceRequest.rebalanceRequest.basktId.toString() });
      const txSignature = await this.executor.rebalanceBaskt(jobInfo.data);
      await IdempotencyTracker.recordTransaction(rebalanceRequest.rebalanceRequest.basktId.toString(), jobInfo.jobType, txSignature);
      logger.info('Rebalance requested processed', { basktId: rebalanceRequest.rebalanceRequest.basktId.toString() });

    } catch (error) {
      console.log(error);
      logger.error('Rebalance requested failed', { error: error instanceof Error ? error.message : String(error) });
    }
  }


  protected async processJob(jobInfo: JobInfo, job: Job): Promise<void> {
    if (jobInfo.jobType === STREAMS.baskt.created) {
      await this.processBasktCreated(jobInfo, job);
    } else if (jobInfo.jobType === STREAMS.rebalance.requested) {
      await this.processRebalanceRequested(jobInfo, job);
    }
  }

  async addJob(jobInfo: JobInfo): Promise<void> {
    await this.addJobInternal(
      jobInfo.jobType,
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
