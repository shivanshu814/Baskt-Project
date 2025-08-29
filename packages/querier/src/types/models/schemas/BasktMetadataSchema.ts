import { BasktStatus } from '@baskt/types';
import mongoose from 'mongoose';
import { BNAndDecimal128 } from './helper';

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
  baselinePrice: BNAndDecimal128(true),
   
};

const MarketIndicesSchema = {
  cumulativeFundingIndex: BNAndDecimal128(true),
  cumulativeBorrowIndex: BNAndDecimal128(true),
  currentFundingRate: {
    type: String,
    required: true,
  },
  currentBorrowRate: {
    type: String,
    required: true,
  },
  lastUpdateTimestamp: {
    type: Number,
    required: true,
  },
};

const RebalanceFeeIndexSchema = {
  cumulativeIndex: BNAndDecimal128(true),
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
      enum: [BasktStatus.Pending, BasktStatus.Active, BasktStatus.Decommissioning, BasktStatus.Closed],
      required: true,
      default: BasktStatus.Pending,
    },
    openPositions: {
      type: Number,
      required: true,
      default: 0,
    },
    stats : {
      // Updated once a day
      change24h: {
        type: Number,
        required: false,
      },
      change7d: {
        type: Number,
        required: false,
      },
      change30d: {
        type: Number,
        required: false,
      },
      change365d: {
        type: Number,
        required: false,
      },
      // Update Live as we open/close positions
      longAllTimeVolume: BNAndDecimal128(true),
      shortAllTimeVolume: BNAndDecimal128(true),
      longOpenInterestContracts: BNAndDecimal128(true),
      shortOpenInterestContracts: BNAndDecimal128(true),
    },
    lastRebalanceTime: {
      type: Number,
      required: true,
      default: 0,
    },
    currentAssetConfigs: [AssetConfigSchema],
    baselineNav: BNAndDecimal128(true),     
    rebalancePeriod: {
      type: Number,
      required: true,
      default: 0,
    },
    config: BasktConfigSchema,
    marketIndices: MarketIndicesSchema,
    rebalanceFeeIndex: RebalanceFeeIndexSchema,
    creationTxSignature: {
      type: String,
      required: true,
      trim: true,
    },
    activateBasktTxSignature: {
      type: String,
      required: false,
      trim: true,
    },
    decomissionBasktTxSignature: {
      type: String,
      required: false,
      trim: true,
    },
    closeBasktTxSignature: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'baskt_metadata',
  },
);

