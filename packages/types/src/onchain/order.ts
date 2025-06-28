import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';

export enum OrderAction {
  Open = 'OPEN',
  Close = 'CLOSE',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
}

export enum OrderType {
  Market = 'MARKET',
  Limit = 'LIMIT',
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
  limitPrice: BN;
  maxSlippage: BN;
  orderType: OrderType;
}
