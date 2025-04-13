import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
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
  oracleConfig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OracleConfig',
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

export const AssetConfig = mongoose.model('AssetConfig', assetSchema);
