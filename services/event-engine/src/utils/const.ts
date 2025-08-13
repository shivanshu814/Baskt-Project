import dotenv from 'dotenv';
import { Connection, PublicKey } from '@solana/web3.js';

// import basktCreatedHandler from '../handlers/solana/baskt-created';
// import orderCreatedHandler from '../handlers/solana/order-created';
// import orderCancelledHandler from '../handlers/solana/order-cancelled';
// import positionOpenedHandler from '../handlers/solana/position-opened';
// import collateralAddedHandler from '../handlers/solana/collateral-added';
// import positionClosedHandler from '../handlers/solana/position-closed';
// import positionLiquidatedHandler from '../handlers/solana/position-liquidated';

dotenv.config();

export const EVENT_ENGINE_QUEUE_NAME = 'events';
export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
export const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || '8JaW8fhu46ii83WapMp64i4B4bKTM76XUSXftJfHfLyg',
);
export const solanaConnection = new Connection(SOLANA_RPC_URL, 'confirmed');

export const FLAG_MIGRATE_TO_DATABUS = process.env.FLAG_MIGRATE_TO_DATABUS === 'true' ;