import { PositionStatus } from '@baskt/types';
import mongoose from 'mongoose';
import BN from 'bn.js';

/**
 * Partial close history entry
 */
export interface PartialCloseHistory {
  id: string;
  closeAmount: BN;
  closePrice: BN;
  settlementDetails: {
    escrowToTreasury: BN,
    escrowToPool: BN,
    escrowToUser: BN,
    poolToUser: BN,
    feeToTreasury: number,
    feeToBlp: number,
    baseFee: number,
    rebalanceFee: number,
    fundingAccumulated: BN,
    pnl: BN,
    badDebtAmount: BN,
    userPayout: BN,
    collateralToRelease: BN,
  },
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
    feeToTreasury: number;
    feeToBlp: number;
    tx: string;
    ts: string;
  };
  status: PositionStatus;
  entryPrice: number;
  exitPrice?: number;
  closePosition?: {
    tx: string;
    ts: string;
  };
  owner: string;
  size: BN;
  remainingSize: BN;
  collateral: BN;
  remainingCollateral: BN;
  isLong: boolean;
  partialCloseHistory: PartialCloseHistory[];
  createdAt: Date;
  updatedAt: Date;
}


