import { BasktStatus } from '@baskt/types';
import mongoose from 'mongoose';

const AssetConfigSchema = {
  assetObjectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    trim: true,
    ref: 'asset_metadata',
    index: true,
  },
  assetId: {
    type: String,
    required: true,
  },
  direction: {
    type: Boolean,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  baselinePrice: {
    type: String,
    required: true,
  },
};

const FundingIndexSchema = {
  cumulativeIndex: {
    type: String,
    required: true,
  },
  lastUpdateTimestamp: {
    type: Number,
    required: true,
  },
  currentRate: {
    type: String,
    required: true,
  },
};

const RebalanceFeeIndexSchema = {
  cumulativeIndex: {
    type: String,
    required: true,
  },
  lastUpdateTimestamp: {
    type: Number,
    required: true,
  },
};

const BasktConfigSchema = {
  openingFeeBps: {
    type: Number,
    required: false,
    default: 0,
  },
  closingFeeBps: {
    type: Number,
    required: false,
    default: 0,
  },
  liquidationFeeBps: {
    type: Number,
    required: false,
    default: 0,
  },
  minCollateralRatioBps: {
    type: Number,
    required: false,
    default: 0,
  },
  liquidationThresholdBps: {
    type: Number,
    required: false,
    default: 0,
  },
};

export const RebalanceHistorySchema = {
  rebalanceTime: {
    type: String,
    required: true,
  },
  rebalanceFeePerUnit: {
    type: String,
    required: true,
  },
  previousConfig: {
    type: BasktConfigSchema,
    required: true,
  },
};

/**
 * Mongoose schema for BasktMetadata
 */
export const BasktMetadataSchema = new mongoose.Schema(
  {
    uid: {
      type: Number,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    basktId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    creator: {
      type: String,
      required: true,
      trim: true,
      ref: 'User',
    },
    isPublic: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      enum: [BasktStatus.Pending, BasktStatus.Active, BasktStatus.Closed],
      required: true,
      default: BasktStatus.Pending,
    },
    openPositions: {
      type: Number,
      required: true,
      default: 0,
    },
    lastRebalanceTime: {
      type: Number,
      required: true,
      default: 0,
    },
    currentAssetConfigs: [AssetConfigSchema],
    baselineNav: {
      type: String,
      required: true,
      default: 0,
    },
    // TODO: nshmadhani: we also want rebalancingType: Automatic/Manual
    rebalancePeriod: {
      type: Number,
      required: true,
      default: 0,
    },
    config: BasktConfigSchema,
    fundingIndex: FundingIndexSchema,
    rebalanceFeeIndex: RebalanceFeeIndexSchema,
    // TODO: nshmadhani: add rebalance history
    // rebalanceHistory: [RebalanceHistorySchema],
    creationTxSignature: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'baskt_metadata',
  },
);
