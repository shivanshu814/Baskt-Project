import { Worker, Job, Queue } from 'bullmq';
import { redis } from '../config';
import { logger } from '@baskt/data-bus';

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
        await this.processJob(job);
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

  async addJobInternal(jobName: string, jobData: any, options?: {
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

    await this.queue.add(jobName, jobData, defaultOptions);
    
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
  protected abstract processJob(job: Job): Promise<void>;

  async addJob(data: any, jobType: string, jobId: string): Promise<void> {
    
  }
}
