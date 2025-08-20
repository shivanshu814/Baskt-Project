import mongoose from 'mongoose';
import { WithdrawRequestStatus } from '@baskt/types';

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
    requestedLpAmount: {
      type: String,
      required: true,
    },
    remainingLp: {
      type: String,
      required: true,
    },
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
      amountProcessed: {
        type: String,
        required: true,
      },
      lpTokensBurned: {
        type: String,
        required: true,
      },
    }],
  },
  {
    timestamps: true,
    collection: 'withdrawal_requests',
  },
);
