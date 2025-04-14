import mongoose from 'mongoose';
import { OracleConfig } from './OracleConfig';

export interface AssetConfig {
  _id: string;
  ticker: string;
  name: string;
  assetAddress: string;
  oracleConfig: OracleConfig;
  logo: string;
  createdAt: Date;
}

export const AssetConfigSchema = new mongoose.Schema({
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
