import mongoose, { ObjectId } from 'mongoose';

type TimeUnit = 'day' | 'hour';
type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Interface for BasktMetadata model
 * Stores metadata for a Baskt that is not stored on-chain
 */
export interface BasktMetadataModel {
  basktId: string | ObjectId;
  name: string;
  creator: string;
  creationDate: Date;
  assets: string[];
  image?: string;
  rebalancePeriod: {
    value: number;
    unit: TimeUnit;
  };
  txSignature: string;
  _id?: string;
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
    creator: {
      type: String,
      required: true,
      trim: true,
    },
    creationDate: {
      type: Date,
      default: Date.now,
    },
    assets: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'AssetMetadata',
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
