import mongoose from 'mongoose';
import { PositionStatus } from '../onchain/position';

export interface PositionModel {
  address: string;
  owner: string;
  positionId: string;
  basktId: string;
  size: string;
  collateral: string;
  isLong: boolean;
  entryPrice: string;
  entryPriceExponent: number;
  exitPrice?: string;
  exitPriceExponent?: number;
  status: PositionStatus;
  timestampOpen: string;
  timestampClose?: string;
  bump: number;
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const PositionSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: String,
      required: true,
      trim: true,
    },
    positionId: {
      type: String,
      required: true,
      trim: true,
    },
    basktId: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    collateral: {
      type: String,
      required: true,
      trim: true,
    },
    isLong: {
      type: Boolean,
      required: true,
    },
    entryPrice: {
      type: String,
      required: true,
      trim: true,
    },
    entryPriceExponent: {
      type: Number,
      required: true,
    },
    exitPrice: {
      type: String,
      trim: true,
    },
    exitPriceExponent: {
      type: Number,
    },
    status: {
      type: String,
      enum: [PositionStatus.OPEN, PositionStatus.CLOSED, PositionStatus.LIQUIDATED],
      required: true,
    },
    timestampOpen: {
      type: String,
      required: true,
      trim: true,
    },
    timestampClose: {
      type: String,
      trim: true,
    },
    bump: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
