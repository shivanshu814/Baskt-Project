import { Connection, PublicKey } from '@solana/web3.js';
import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import { eventsQueueName, eventsQueue, connection as redis } from './config/queue';

dotenv.config();

const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || 'GK52S4WZPVEAMAgjRf8XsBd7upmG862AjMF89HavDpkm',
);
const solanaConnection = new Connection(RPC_URL, 'confirmed');

console.log('event engine initialized and listening for logs...');

const EVENT_MAPPINGS: Record<string, string> = {
  BasktCreatedEvent: 'baskt-created',
  OrderCreatedEvent: 'order-created',
  OrderCancelledEvent: 'order-cancelled',
  PositionOpenedEvent: 'position-opened',
  CollateralAddedEvent: 'collateral-added',
  PositionClosedEvent: 'position-closed',
  PositionLiquidatedEvent: 'position-liquidated',
};

solanaConnection.onLogs(
  PROGRAM_ID,
  async (logs, logCtx) => {
    for (const logLine of logs.logs) {
      for (const [eventName, jobName] of Object.entries(EVENT_MAPPINGS)) {
        if (logLine.includes(`Program log: Event: ${eventName}`)) {
          const jsonMatch = logLine.match(/{.*}/);
          if (!jsonMatch) {
            console.warn(`unable to parse JSON payload from ${eventName}:`, logLine);
            continue;
          }

          try {
            const eventData = JSON.parse(jsonMatch[0]);
            await eventsQueue.add(jobName, {
              tx: (logCtx as any).signature,
              ...eventData,
              received_at: Date.now(),
            });
          } catch (err) {
            console.error(`failed to parse JSON from ${eventName}:`, err);
          }
        }
      }
    }
  },
  'confirmed',
);

const handlers: Record<string, (data: any) => void> = {
  'baskt-created': (data) => {
    console.log(`new baskt created: ${data.baskt_id}`);
    console.log(`name: ${data.baskt_name}, creator: ${data.creator}`);
    console.log(`public: ${data.is_public}, asset count: ${data.asset_count}`);
    console.log(`timestamp: ${new Date(data.timestamp).toISOString()}`);
  },
  'order-created': (data) => {
    console.log(`order created by ${data.owner}`);
    console.log(`order ID: ${data.order_id}, baskt ID: ${data.baskt_id}`);
    console.log(`size: ${data.size}, collateral: ${data.collateral}`);
    console.log(`is long: ${data.is_long}, action: ${data.action}`);
    console.log(`target position: ${data.target_position}`);
    console.log(`timestamp: ${new Date(data.timestamp).toISOString()}`);
  },
  'order-cancelled': (data) => {
    console.log(`order ${data.order_id} was cancelled by ${data.owner}`);
    console.log(`baskt ID: ${data.baskt_id}`);
    console.log(`timestamp: ${new Date(data.timestamp).toISOString()}`);
  },
  'position-opened': (data) => {
    console.log(`position ${data.position_id} opened by ${data.owner}`);
    console.log(`baskt ID: ${data.baskt_id}, size: ${data.size}`);
    console.log(`collateral: ${data.collateral}, entry price: ${data.entry_price}`);
    console.log(`funding index: ${data.entry_funding_index}`);
    console.log(`timestamp: ${new Date(data.timestamp).toISOString()}`);
  },
  'collateral-added': (data) => {
    console.log(`additional collateral added to position ${data.position_id}`);
    console.log(`owner: ${data.owner}, baskt ID: ${data.baskt_id}`);
    console.log(`new total collateral: ${data.new_total_collateral}`);
    console.log(`timestamp: ${new Date(data.timestamp).toISOString()}`);
  },
  'position-closed': (data) => {
    console.log(`position ${data.position_id} closed by ${data.owner}`);
    console.log(`size: ${data.size}, exit price: ${data.exit_price}`);
    console.log(`PnL: ${data.pnl}, fee: ${data.fee_amount}`);
    console.log(`funding payment: ${data.funding_payment}`);
    console.log(`settlement amount: ${data.settlement_amount}`);
    console.log(`timestamp: ${new Date(data.timestamp).toISOString()}`);
  },
  'position-liquidated': (data) => {
    console.log(`position ${data.position_id} was liquidated`);
    console.log(`owner: ${data.owner}, exit price: ${data.exit_price}`);
    console.log(`PnL: ${data.pnl}, liquidation fee: ${data.liquidation_fee}`);
    console.log(`funding payment: ${data.funding_payment}`);
    console.log(`remaining collateral: ${data.remaining_collateral}`);
    console.log(`timestamp: ${new Date(data.timestamp).toISOString()}`);
  },
};

const worker = new Worker(
  eventsQueueName,
  async (job) => {
    const handler = handlers[job.name];
    if (handler) {
      handler(job.data);
    } else {
      console.log(`unhandled event type: ${job.name}`);
    }
  },
  { connection: redis },
);

worker.on('completed', (job) => {
  console.log(`job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`job ${job?.id} failed with error:`, err);
});
