import dotenv from 'dotenv';
import { Connection, PublicKey } from "@solana/web3.js";

dotenv.config();

export const EVENT_ENGINE_QUEUE_NAME = 'events';
export const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
export const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || 'GK52S4WZPVEAMAgjRf8XsBd7upmG862AjMF89HavDpkm',
);
export const solanaConnection = new Connection(RPC_URL, 'confirmed');

export const EVENT_MAPPINGS: Record<string, string> = {
    BasktCreatedEvent: 'baskt-created',
    OrderCreatedEvent: 'order-created',
    OrderCancelledEvent: 'order-cancelled',
    PositionOpenedEvent: 'position-opened',
    CollateralAddedEvent: 'collateral-added',
    PositionClosedEvent: 'position-closed',
    PositionLiquidatedEvent: 'position-liquidated',
};
  


