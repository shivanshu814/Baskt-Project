/** @format */
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';

export enum PositionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  LIQUIDATED = 'LIQUIDATED',
}

export interface OnchainPosition {
  positionPDA: PublicKey; // Not in Rust, but needed for SDK
  owner: PublicKey;
  positionId: number;
  basktId: PublicKey;
  size: BN;
  collateral: BN;
  isLong: boolean;
  entryPrice: BN;
  exitPrice?: BN;
  entryFundingIndex: BN;
  lastFundingIndex: BN;
  fundingAccumulated: BN;
  lastRebalanceFeeIndex: BN;
  status: PositionStatus;
  timestampOpen: BN;
  timestampClose?: BN;
  bump: number;
}
