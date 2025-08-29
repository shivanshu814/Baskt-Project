import mongoose from 'mongoose';
import { BNAndDecimal128 } from './helper';

export const LiquidityPoolSchema = new mongoose.Schema(
  {
    totalLiquidity: BNAndDecimal128(true),
    lpMint: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    totalShares: BNAndDecimal128(true),
    lastUpdateTimestamp: {
      type: Number,
      required: true,
      default: 0,
    },
    depositFeeBps: {
      type: Number,
      required: true,
      default: 0,
    },
    withdrawalFeeBps: {
      type: Number,
      required: true,
      default: 0,
    },
    bump: {
      type: Number,
      required: true,
    },
    poolAuthorityBump: {
      type: Number,
      required: true,
    },
    pendingLpTokens: {
      type: String,
      required: true,
      default: '0',
    },
    withdrawQueueHead: {
      type: Number,
      required: true,
      default: 0,
    },
    withdrawQueueTail: {
      type: Number,
      required: true,
      default: 0,
    },
    poolAddress: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fees: {
      totalFeesCollected: BNAndDecimal128(true),
      feesCollected30d: BNAndDecimal128(true),
      feesCollected7d: BNAndDecimal128(true),
      latestApr: {
        type: Number,
        required: true,
        default: 0,
      },
      lastTimeAprCalculated: {
        type: Date,
        required: false,
      },
    }
  },
  {
    timestamps: true,
    collection: 'liquidity_pool',
  },
);
