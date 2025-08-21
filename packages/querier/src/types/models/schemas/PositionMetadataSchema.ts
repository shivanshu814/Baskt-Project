import mongoose from 'mongoose';
import { PositionStatus } from '@baskt/types';
import { BNAndDecimal128 } from './helper';

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
      feeToTreasury: {
        type: Number,
        required: true,
        trim: true,
      },
      feeToBlp: {
        type: Number,
        required: true,
        trim: true,
      },
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
      type: Number,
      required: true,
      trim: true,
    },
    exitPrice: {
      type: Number,
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
    size: BNAndDecimal128(true),
    remainingSize: BNAndDecimal128(true),
    collateral: BNAndDecimal128(true),
    remainingCollateral: BNAndDecimal128(true),
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
        // TODO: Shivanshu we need to modify this closeAmount - What is it used for?
        closeAmount: { type: String, required: true, trim: true },

        closePrice: { type: String, required: true, trim: true },

        settlementDetails: {
          escrowToTreasury: BNAndDecimal128(true),
          escrowToPool: BNAndDecimal128(true),
          escrowToUser: BNAndDecimal128(true),
          poolToUser: BNAndDecimal128(true),
          feeToTreasury: { type: Number, required: true, trim: true },
          feeToBlp: { type: Number, required: true, trim: true },
          baseFee: { type: Number, required: true, trim: true },
          rebalanceFee: { type: Number, required: true, trim: true },
          fundingAccumulated: BNAndDecimal128(true),
          pnl: BNAndDecimal128(true),
          badDebtAmount: BNAndDecimal128(true),
          userPayout: BNAndDecimal128(true),
          collateralToRelease: BNAndDecimal128(true),
        },
        
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