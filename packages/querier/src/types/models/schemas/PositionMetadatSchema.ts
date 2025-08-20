import mongoose from 'mongoose';
import { PositionStatus } from '@baskt/types';

export const PositionMetadataSchema = new mongoose.Schema(
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
    baskt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'baskt_metadata',
      required: true,
    },
    basktAddress: {
      type: String,
      required: true,
      trim: true,
    },
    openOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'order_metadata',
      required: true,
    },
    openOrderId: {
      type: Number,
      required: true,
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
    size: { type: String, required: true, trim: true },
    remainingSize: { type: String, required: true, trim: true },
    collateral: { type: String, required: true, trim: true },
    remainingCollateral: { type: String, required: true, trim: true },
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
    isLong: { type: Boolean, required: true },
    partialCloseHistory: [
      {
        id: { type: String, required: true, trim: true },
        order: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'order_metadata',
          required: true,
        },
        // TODO: Shivanshu we need to modify this
        closeAmount: { type: String, required: true, trim: true },
        closePrice: { type: String, required: true, trim: true },
        pnl: { type: String, required: true, trim: true },
        feeCollected: { type: String, required: true, trim: true },
        closePosition: {
          tx: { type: String, required: true, trim: true },
          ts: { type: String, required: true, trim: true },
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: 'position_metadata',
  },
);