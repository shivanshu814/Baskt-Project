import mongoose from 'mongoose';

export enum RebalanceRequestStatus {
  Pending = 'pending',
  Processed = 'processed',
  Failed = 'failed',
}

export const RebalanceRequestSchema = new mongoose.Schema(
  {
    baskt: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'baskt_metadata',
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(RebalanceRequestStatus),
      default: RebalanceRequestStatus.Pending,
    },
    basktId: {
      type: String,
      required: true,
    },
    creator: {
      type: String,
      required: true,
    },
    rebalanceRequestFee: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
    txSignature: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'rebalance_request',
  },
);
