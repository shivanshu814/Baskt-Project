import mongoose from 'mongoose';

export interface AssetPriceProviderConfig {
  provider: {
    id: string;
    chain: string;
    name: string;
  };
  twp: {
    seconds: number;
  };
  updateFrequencySeconds: number;
}
export interface AssetMetadataModel {
  ticker: string;
  name: string;
  assetAddress: string;
  priceConfig: AssetPriceProviderConfig;
  logo: string;
  _id?: string;
  createdAt?: Date;
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
          chain: { type: String, required: true },
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
    },
    required: true,
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
});
