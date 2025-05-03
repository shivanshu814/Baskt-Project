import mongoose, { ObjectId } from 'mongoose';

/**
 * Interface for BasktMetadata model
 * Stores metadata for a Baskt that is not stored on-chain
 */
export interface BasktMetadataModel {
  basktId: string | ObjectId;
  name: string;
  description: string;
  creator: string;
  creationDate: Date;
  categories: string[];
  risk: 'low' | 'medium' | 'high';
  assets: string[];
  image?: string;
  rebalancePeriod: {
    value: number;
    unit: 'day' | 'hour';
  };
  txSignature: string;
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
    description: {
      type: String,
      required: true,
      trim: true,
    },
    creator: {
      type: String,
      required: true,
      trim: true,
    },
    creationDate: {
      type: Date,
      default: Date.now,
    },
    categories: {
      type: [String],
      required: true,
    },
    risk: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    assets: {
      type: [String],
      required: true,
    },
    image: {
      type: String,
    },
    rebalancePeriod: {
      value: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        enum: ['day', 'hour'],
        required: true,
      },
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
