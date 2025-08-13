import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Single Redis connection for BullMQ
export const redis = new Redis(
  process.env.REDIS_URL || 'redis://localhost:6379',
  { maxRetriesPerRequest: null }
);

export const executionQueue = new Queue('execution', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  }
});