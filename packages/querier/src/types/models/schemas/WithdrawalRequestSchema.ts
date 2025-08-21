import mongoose from 'mongoose';
import { WithdrawRequestStatus } from '@baskt/types';
import { BNAndDecimal128 } from './helper';

export const WithdrawalRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    withdrawalProcessAddress: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    requestedLpAmount: BNAndDecimal128(true),
    remainingLp: BNAndDecimal128(true),
    providerUsdcAccount: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(WithdrawRequestStatus),
      default: WithdrawRequestStatus.QUEUED,
      required: true,
      index: true,
    },    
    requestedAt: {
      ts: {
        type: Number,
        required: true,
        index: true,
      },
      tx: {
        type: String,
        required: false,
        trim: true,
      }
    },
    bump: {
      type: Number,
      required: true,
    },    
    // Processing details
    processedAt: {
      tx: {
        type: String,
        required: false,
        trim: true,
      },
      processedTs: {
        type: Number,
        required: false,
        index: true,
      },
    },
    // Processing history for partial processing
    processingHistory: [{
      ts: {
        type: Number,
        required: true,
        index: true,
      },
      tx: {
        type: String,
        required: true,
        trim: true,
      },
      amountProcessed: BNAndDecimal128(true),
      lpTokensBurned: BNAndDecimal128(true),
    }],
  },
  {
    timestamps: true,
    collection: 'withdrawal_requests',
  },
);
