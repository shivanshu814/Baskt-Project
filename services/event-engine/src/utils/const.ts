import dotenv from 'dotenv';
import { Connection, PublicKey } from '@solana/web3.js';

import basktCreatedHandler from '../handlers/baskt-created';
import orderCreatedHandler from '../handlers/order-created';
import orderCancelledHandler from '../handlers/order-cancelled';
import positionOpenedHandler from '../handlers/position-opened';
import collateralAddedHandler from '../handlers/collateral-added';
import positionClosedHandler from '../handlers/position-closed';
import positionLiquidatedHandler from '../handlers/position-liquidated';

dotenv.config();

export const EVENT_ENGINE_QUEUE_NAME = 'events';
export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
export const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || 'GK52S4WZPVEAMAgjRf8XsBd7upmG862AjMF89HavDpkm',
);
export const solanaConnection = new Connection(SOLANA_RPC_URL, 'confirmed');

export const EVENT_MAPPINGS_HANDLER: Record<string, any> = {
  basktCreatedEvent: basktCreatedHandler,
  orderCreatedEvent: orderCreatedHandler,
  orderCancelledEvent: orderCancelledHandler,
  positionOpenedEvent: positionOpenedHandler,
  collateralAddedEvent: collateralAddedHandler,
  positionClosedEvent: positionClosedHandler,
  positionLiquidatedEvent: positionLiquidatedHandler,
};
