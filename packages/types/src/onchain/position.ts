/** @format */
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';

export enum PositionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  LIQUIDATED = 'LIQUIDATED',
}

export interface OnchainPosition {
  positionPDA: PublicKey;
  owner: PublicKey;
  positionId: BN;
  basktId: PublicKey;
  size: BN;
  collateral: BN;
  isLong: boolean;
  entryPrice: BN;
  entryPriceExponent: number;
  exitPrice?: BN;
  exitPriceExponent?: number;
  status: PositionStatus;
  timestampOpen: BN;
  timestampClose?: BN;
  bump: number;
}
