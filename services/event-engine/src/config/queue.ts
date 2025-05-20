import dotenv from 'dotenv';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

dotenv.config();

export const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const eventsQueueName = 'events';
export const eventsQueue = new Queue(eventsQueueName, { connection });
