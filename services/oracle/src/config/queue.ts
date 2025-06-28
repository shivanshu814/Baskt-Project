// queue.ts
import dotenv from 'dotenv';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

dotenv.config();

export const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const pricingQueueName = 'pricingQueue';
export const managerQueueName = 'managerQueue';
export const eventsQueueName = 'events';
export const rebalanceQueueName = 'rebalanceQueue';

export const pricingQueue = new Queue(pricingQueueName, { connection, 
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});
export const managerQueue = new Queue(managerQueueName, {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});
export const eventsQueue = new Queue(eventsQueueName, {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});
export const rebalanceQueue = new Queue(rebalanceQueueName, {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});
