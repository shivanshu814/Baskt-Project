import mongoose from 'mongoose';

export const LiquidityDepositSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    liquidityPool: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    depositAmount: {
      type: String,
      required: true,
    },
    feeAmount: {
      type: String,
      required: true,
    },
    sharesMinted: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Number,
      required: true,
      index: true,
    },
    transactionSignature: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    netDeposit: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'liquidity_deposits',
  },
);
