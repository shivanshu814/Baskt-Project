import mongoose from 'mongoose';
import { AssetPriceProviderConfig } from '@baskt/types';

export interface AssetMetadataModel {
  ticker: string;
  name: string;
  assetAddress: string;
  priceConfig: AssetPriceProviderConfig;
  coingeckoId?: string;
  logo: string;
  _id?: string;
  createdAt?: Date;
  basktIds?: string[];
}

export const AssetMetadataSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  assetAddress: {
    type: String,
    required: true,
    trim: true,
  },
  priceConfig: {
    type: {
      provider: {
        type: {
          id: { type: String, required: true },
          chain: { type: String, required: false },
          name: { type: String, required: true },
        },
        required: true,
      },
      twp: {
        type: {
          seconds: { type: Number, required: true },
        },
        required: true,
      },
      updateFrequencySeconds: { type: Number, required: true },
      units: { type: Number, required: true, default: 1 },
    },
    required: true,
  },
  coingeckoId: {
    type: String,
    required: false,
    trim: true,
  },
  priceMetrics: {
    type: {
      price: { type: Number, required: true },
      change24h: { type: Number, required: true },
      timestamp: { type: Number, required: true },
    },
  },
  logo: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  basktIds: {
    type: [String],
    default: [],
    ref: 'BasktMetadata',
  },
});

// Add indexes for frequently queried fields
AssetMetadataSchema.index({ assetAddress: 1 });
AssetMetadataSchema.index({ ticker: 1 });
AssetMetadataSchema.index({ basktIds: 1 });
