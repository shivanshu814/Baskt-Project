import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';

export enum OrderAction {
  Open,
  Close,
}

export enum OrderStatus {
  PENDING = 'PENDING',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
}

export interface OnchainOrder {
  address: PublicKey;
  owner: PublicKey;
  orderId: BN;
  basktId: PublicKey;
  userPublicKey: PublicKey;
  size: BN;
  collateral: BN;
  isLong: boolean;
  action: OrderAction;
  status: OrderStatus;
  timestamp: BN;
  targetPosition: PublicKey | null;
  bump: number;
}
