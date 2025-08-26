import { Queue, Worker, ConnectionOptions } from 'bullmq';

// Redis connection configuration
export const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
};

// Manager queue for scheduling rebalance checks
export const managerQueue = new Queue('rebalance-manager', { connection });

// Rebalance queue for processing actual rebalances
export const rebalanceQueue = new Queue('rebalance', { connection });