import mongoose from 'mongoose';
import { BNAndDecimal128 } from './helper';

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
    depositAmount: BNAndDecimal128(true),
    feeAmount: BNAndDecimal128(true),
    sharesMinted: BNAndDecimal128(true),
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
    netDeposit: BNAndDecimal128(true),
  },
  {
    timestamps: true,
    collection: 'liquidity_deposits',
  },
);
