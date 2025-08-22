import mongoose from 'mongoose';
import { BNAndDecimal128 } from './helper';

export const AssetMetadataSchema = new mongoose.Schema(
  {
    ticker: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    assetAddress: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    permissions: {
      allowLongs: {
        type: Boolean,
        required: true,
        default: true,
      },
      allowShorts: {
        type: Boolean,
        required: true,
        default: true,
      },
    },
    allTimeLongVolume:  BNAndDecimal128(true),
    allTimeShortVolume: BNAndDecimal128(true),
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    listingTime: {
      type: Number,
      required: true,
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
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: 'baskt_metadata',
    },
  },
  {
    timestamps: true,
    collection: 'asset_metadata',
  },
);
