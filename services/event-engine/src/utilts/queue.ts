import dotenv from 'dotenv';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { EVENT_ENGINE_QUEUE_NAME } from './const';

dotenv.config();

export const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const eventsQueue = new Queue(EVENT_ENGINE_QUEUE_NAME, { connection });

