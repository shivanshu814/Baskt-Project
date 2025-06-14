import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import { connection as redis } from './utils/queue';
import { EVENT_ENGINE_QUEUE_NAME, EVENT_MAPPINGS_HANDLER } from './utils/const';

dotenv.config();

console.log('event engine initialized and listening for logs...');

const worker = new Worker(
  EVENT_ENGINE_QUEUE_NAME,
  async (job: any) => {
    const handler = EVENT_MAPPINGS_HANDLER[job.name];
    if (handler) {
      handler(job.data);
    } else {
      console.log(`unhandled event type: ${job.name}`);
    }
  },
  { connection: redis },
);

worker.on('completed', (job: any) => {
  console.log(`job ${job.id} completed successfully`);
});

worker.on('failed', (job: any, err: any) => {
  console.error(`job ${job?.id} failed with error:`, err);
});
