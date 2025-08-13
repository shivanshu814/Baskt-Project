import mongoose, { ObjectId } from 'mongoose';

type TimeUnit = 'day' | 'hour';

/**
 * Interface for BasktMetadata model
 * Stores metadata for a Baskt that is not stored on-chain
 */
export interface BasktMetadataModel {
  basktId: string | ObjectId;
  name: string;
  creator: string;
  creationDate: Date;
  txSignature: string;
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  isActive: boolean;
}

/**
 * Mongoose schema for BasktMetadata
 */
export const BasktMetadataSchema = new mongoose.Schema(
  {
    basktId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    txSignature: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Add indexes for frequently queried fields
BasktMetadataSchema.index({ basktId: 1 });
BasktMetadataSchema.index({ name: 1 });
BasktMetadataSchema.index({ creator: 1 });
BasktMetadataSchema.index({ createdAt: -1 });
