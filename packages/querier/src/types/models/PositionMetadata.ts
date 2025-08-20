import { PositionStatus } from '@baskt/types';
import mongoose from 'mongoose';

/**
 * Partial close history entry
 */
export interface PartialCloseHistory {
  id: string;
  closeAmount: string;
  closePrice: string;
  pnl: string;
  feeCollected: string;
  closePosition: {
    tx: string;
    ts: string;
  };
  order: mongoose.Types.ObjectId;
}

export interface PositionMetadata {
  positionId: string;
  positionPDA: string;
  baskt: mongoose.Types.ObjectId;
  basktAddress: string;
  openOrder: mongoose.Types.ObjectId;
  openOrderId: number;
  openPosition: {
    tx: string;
    ts: string;
  };
  status: PositionStatus;
  entryPrice: string;
  exitPrice?: string;
  closePosition?: {
    tx: string;
    ts: string;
  };
  owner: string;
  size: string;
  remainingSize: string;
  collateral: string;
  remainingCollateral: string;
  isLong: boolean;
  partialCloseHistory: PartialCloseHistory[];
  createdAt: Date;
  updatedAt: Date;
}


