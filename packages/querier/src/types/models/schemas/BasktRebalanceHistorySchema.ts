import mongoose from 'mongoose';

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
    previousBaselineNav: {
      type: String,
      required: true,
    },
    previousRebalanceIndex: {
      type: Number,
      required: true,
    },
    previousAssetConfigs: [{
      assetId: {
        type: String,
        required: true,
      },
      weight: {
        type: String,
        required: true,
      },
      direction: {
        type: Boolean,
        required: true,
      },
      baselinePrice: {
        type: String,
        required: true,
      },
    }],
    // New state (after rebalance)
    newBaselineNav: {
      type: String,
      required: true,
    },
    newRebalanceIndex: {
      type: Number,
      required: true,
    },
    newAssetConfigs: [{
      assetId: {
        type: String,
        required: true,
      },
      weight: {
        type: String,
        required: true,
      },
      direction: {
        type: Boolean,
        required: true,
      },
      baselinePrice: {
        type: String,
        required: true,
      },
    }],
    // Rebalance fee information
    rebalanceFeePerUnit: {
      type: String,
      required: false,
    },
    // Performance metrics
    navChange: {
      type: String,
      required: true,
    },
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
