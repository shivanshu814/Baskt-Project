import { Worker, Job, Queue } from 'bullmq';
import { redis } from '../config';
import { deserializeMessage, logger, serializeMessage } from '@baskt/data-bus';

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export interface WorkerConfig {
  queueName: string;
  concurrency?: number;
  limiter?: {
    max: number;
    duration: number;
  };
}

export interface JobInfo {
  data: any;
  jobType: string;
  jobId: string;
}

export abstract class BaseWorker {
  protected worker: Worker | null = null;
  protected queue: Queue;
  protected config: WorkerConfig;

  constructor(config: WorkerConfig) {
    this.config = config;
    
    // Initialize the queue
    this.queue = new Queue(config.queueName, {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      }
    });
  }

  async start(): Promise<void> {
    this.worker = new Worker(
      this.config.queueName,
      async (job: Job) => {
        logger.info('Processing job', { jobId: job.id, jobName: job.name, jobData: job.data });
        const jobInfo = deserializeMessage(job.data) as JobInfo;
        logger.info('Job info', { jobInfo });
        await this.processJob(jobInfo, job);
      },
      {
        connection: redis,
        concurrency: this.config.concurrency || 1,
        limiter: this.config.limiter || {
          max: 10,
          duration: 1000
        }
      }
    );

    logger.info(`${this.constructor.name} started`, { queue: this.config.queueName });
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    await this.queue.close();
    logger.info(`${this.constructor.name} stopped`, { queue: this.config.queueName });
  }

  async addJobInternal(jobName: string, jobData: JobInfo, options?: {
    jobId?: string;
    attempts?: number;
    backoff?: { type: string; delay: number };
    removeOnComplete?: boolean;
    removeOnFail?: boolean;
  }): Promise<void> {
    const defaultOptions = {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
      ...options
    };

    const serializedJobData = serializeMessage(jobData);

    await this.queue.add(jobName, serializedJobData, defaultOptions);
    
    logger.info(`Job queued`, { 
      worker: this.constructor.name,
      queue: this.config.queueName, 
      jobName,
      jobId: options?.jobId 
    });
  }

  async getQueueStats(): Promise<QueueStats> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed
    };
  }

  // Abstract method that each worker must implement
  protected abstract processJob(jobInfo: JobInfo, job: Job): Promise<void>;

  abstract addJob(jobInfo: JobInfo): Promise<void>;
}
