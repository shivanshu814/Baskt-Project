import mongoose from 'mongoose';

export interface AssetPrice {
  priceUSD: string;
  timestamp: number;
  assetId: mongoose.Schema.Types.ObjectId;
}

export const AssetPriceSchema = new mongoose.Schema({
  priceUSD: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Number,
    required: true,
  },
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AssetConfig',
    required: true,
  },
});
