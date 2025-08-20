import mongoose from 'mongoose';

export const RebalanceRequestSchema = new mongoose.Schema(
  {
    baskt: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'baskt_metadata',
      index: true,
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
      type: String,
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
