import mongoose from 'mongoose';
import { BNAndDecimal128 } from './helper';

export const BasktRebalanceHistorySchema = new mongoose.Schema(
  {
    baskt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BasktMetadata',
      required: true,
    },
    basktId: {
      type: String,
      required: true,
    },
    txSignature: {
      type: String,
      required: true,
    },
    // Previous state (before rebalance)
    previousBaselineNav: BNAndDecimal128(true),
    previousRebalanceIndex: BNAndDecimal128(true),
    previousAssetConfigs: [{
      assetId: {
        type: String,
        required: true,
      },
      weight: {
        type: Number,
        required: true,
      },
      direction: {
        type: Boolean,
        required: true,
      },
      baselinePrice: BNAndDecimal128(true),
    }],
    // New state (after rebalance)
    newBaselineNav: BNAndDecimal128(true),
    newRebalanceIndex: BNAndDecimal128(true),
    newAssetConfigs: [{
      assetId: {
        type: String,
        required: true,
      },
      weight: {
        type: Number,
        required: true,
      },
      direction: {
        type: Boolean,
        required: true,
      },
      baselinePrice: BNAndDecimal128(true),
    }],
    // Rebalance fee information
    rebalanceFeePerUnit: {
      type: Number,
      required: false,
    },
    // Performance metrics
    navChange: BNAndDecimal128(true),
    navChangePercentage: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'baskt_rebalance_history',
  }
);
