import mongoose from 'mongoose';
import { PositionStatus } from '../onchain/position';

export interface PositionMetadataModel {
  positionId: string;
  positionPDA: string;
  basktId: string;
  openOrder: string;
  closeOrder?: string;
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
  collateral: string;
  isLong: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const PositionMetadataSchema = new mongoose.Schema<PositionMetadataModel>(
  {
    positionId: {
      type: String,
      required: true,
      trim: true,
    },
    positionPDA: {
      type: String,
      required: true,
      trim: true,
    },
    basktId: {
      type: String,
      required: true,
      trim: true,
      ref: 'BasktMetadata',
    },
    openOrder: {
      type: String,
      ref: 'OrderMetadata',
    },
    closeOrder: {
      type: String,
      ref: 'OrderMetadata',
      required: false,
    },
    openPosition: {
      tx: {
        type: String,
        required: true,
        trim: true,
      },
      ts: {
        type: String,
        required: true,
        trim: true,
      },
    },
    entryPrice: {
      type: String,
      required: true,
      trim: true,
    },
    exitPrice: {
      type: String,
      required: false,
      trim: true,
    },
    closePosition: {
      tx: {
        type: String,
        required: false,
        trim: true,
      },
      ts: {
        type: String,
        required: false,
        trim: true,
      },
    },
    owner: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [PositionStatus.OPEN, PositionStatus.CLOSED, PositionStatus.LIQUIDATED],
      required: true,
    },
    // This is number of contracts and not usdc size
    size: { type: String, required: true, trim: true },
    collateral: { type: String, required: true, trim: true },
    isLong: { type: Boolean, required: true },
  },
  {
    timestamps: true,
  },
);
