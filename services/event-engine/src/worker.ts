import { Connection, PublicKey } from '@solana/web3.js';
import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import {  eventsQueue, connection as redis } from './utilts/queue';
import { EVENT_ENGINE_QUEUE_NAME } from './utilts/const';
import basktCreatedHandler from './handlers/baskt-created';
import orderCreatedHandler from './handlers/order-created';
import orderCancelledHandler from './handlers/order-cancelled';
import positionOpenedHandler from './handlers/position-opened';
import collateralAddedHandler from './handlers/collateral-added';
import positionClosedHandler from './handlers/position-closed';
import positionLiquidatedHandler from './handlers/position-liquidated';

dotenv.config();


console.log('event engine initialized and listening for logs...');


const handlers: Record<string, (data: any) => void> = {
  'baskt-created': basktCreatedHandler,
  'order-created': orderCreatedHandler,
  'order-cancelled': orderCancelledHandler,
  'position-opened': positionOpenedHandler,
  'collateral-added': collateralAddedHandler,
  'position-closed': positionClosedHandler,
  'position-liquidated': positionLiquidatedHandler,
};

const worker = new Worker(
  EVENT_ENGINE_QUEUE_NAME,
  async (job: any) => {
    const handler = handlers[job.name];
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
