import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  assetId: {
    type: String,
    required: true,
    trim: true,
  },
  assetName: {
    type: String,
    required: true,
    trim: true,
  },
  assetAddress: {
    type: String,
    required: true,
    trim: true,
  },
  oracleType: {
    type: String,
    required: true,
    enum: ['custom', 'pyth'],
    default: 'custom',
  },
  oracleAddress: {
    type: String,
    required: true,
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
});

export const Asset = mongoose.model('Asset', assetSchema);
