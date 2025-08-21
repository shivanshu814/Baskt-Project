import BN from 'bn.js';
import mongoose, { ObjectId } from 'mongoose';

export enum FeeEvents {
  POSITION_OPENED = 'POSITION_OPENED',
  POSITION_CLOSED = 'POSITION_CLOSED',
  POSITION_LIQUIDATED = 'POSITION_LIQUIDATED',
  LIQUIDITY_ADDED = 'LIQUIDITY_ADDED',
  LIQUIDITY_REMOVED = 'LIQUIDITY_REMOVED',
  BASKT_CREATED = 'BASKT_CREATED',
  REBALANCE_REQUESTED = 'REBALANCE_REQUESTED',
}

export interface FeeEventMetadata {
  _id?: ObjectId;
  eventType: FeeEvents;
  transactionSignature: string;
  payer: string; // Always present - either position owner or liquidity provider
  feePaidIn: 'USDC' | 'SOL';
 
  positionFee?: {
    basktId: string;
    positionId: string;  
    feeToTreasury: BN;
    feeToBlp: BN;
    totalFee: BN;
    fundingFeePaid: BN;
    fundingFeeOwed: BN;
    rebalanceFeePaid: BN;
  }
  liquidityFee?: {
    feeToTreasury: BN;
    feeToBlp: BN;
    totalFee: BN;
  }  
  basktFee?: {
    basktId: string;
    creationFee: BN;
    rebalanceRequestFee: BN;
  }
  createdAt?: Date;
  updatedAt?: Date;
}

