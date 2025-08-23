import mongoose from 'mongoose';
import { EventProcessStatus } from '../SolanaEventsMetadata';

export const SolanaEventsSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: String,
      required: true,
    },
    eventTx: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    processStatus: {
      type: String,
      enum: Object.values(EventProcessStatus),
      default: EventProcessStatus.PENDING,
      index: true,
    },
    error: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'solana_events',
  }
);

// Indexes for better query performance
SolanaEventsSchema.index({ eventName: 1, processStatus: 1 });
SolanaEventsSchema.index({ processStatus: 1, createdAt: 1 });
SolanaEventsSchema.index({ eventTx: 1 }, { unique: true });
