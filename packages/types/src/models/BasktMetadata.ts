import mongoose, { ObjectId } from 'mongoose';
import { BasktAssetInfo } from '../ui';

type TimeUnit = 'day' | 'hour';
type RiskLevel = 'low' | 'medium' | 'high';

interface PriceHistoryEntry {
  date: string;
  price: number;
  volume: number;
}

interface PriceHistory {
  daily: PriceHistoryEntry[];
  weekly: PriceHistoryEntry[];
  monthly: PriceHistoryEntry[];
  yearly: PriceHistoryEntry[];
}

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
  risk: RiskLevel;
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
}

export interface BasktInfo extends Omit<BasktMetadataModel, 'assets'> {
  assets: BasktAssetInfo[];
  aum: number;
  change24h: number;
  price: number;
  totalAssets: number;
  category: string[];
  performance: {
    day: number;
    week: number;
    month: number;
    year?: number;
  };
  sparkline: number[];
  priceHistory?: PriceHistory;
}

export interface BasktPageState {
  filteredBaskts: BasktInfo[];
  popularBaskts: BasktInfo[];
  categoryBaskts: Record<string, BasktInfo[]>;
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
