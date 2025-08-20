import mongoose from 'mongoose';

export const LiquidityPoolSchema = new mongoose.Schema(
  {
    totalLiquidity: {
      type: String,
      required: true,
      default: '0',
    },
    lpMint: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    totalShares: {
      type: String,
      required: true,
      default: '0',
    },
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
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'liquidity_pool',
  },
);
