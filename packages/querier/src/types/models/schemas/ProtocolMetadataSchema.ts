import { AccessControlRole } from '@baskt/types';
import mongoose from 'mongoose';


// AccessControlEntry schema
const AccessControlEntrySchema = {
  account: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: [
      AccessControlRole.AssetManager,
      AccessControlRole.BasktManager,
      AccessControlRole.Rebalancer,
      AccessControlRole.Matcher,
      AccessControlRole.Liquidator,
      AccessControlRole.FundingManager,
      AccessControlRole.ConfigManager,
      AccessControlRole.Keeper,
      AccessControlRole.Owner,
    ],
    required: true
  }
};

// FeatureFlags schema
const FeatureFlagsSchema = {
  allowAddLiquidity: {
    type: Boolean,
    default: true
  },
  allowRemoveLiquidity: {
    type: Boolean,
    default: true
  },
  allowOpenPosition: {
    type: Boolean,
    default: true
  },
  allowClosePosition: {
    type: Boolean,
    default: true
  },
  allowPnlWithdrawal: {
    type: Boolean,
    default: true
  },
  allowCollateralWithdrawal: {
    type: Boolean,
    default: true
  },
  allowAddCollateral: {
    type: Boolean,
    default: true
  },
  allowBasktCreation: {
    type: Boolean,
    default: true
  },
  allowBasktUpdate: {
    type: Boolean,
    default: true
  },
  allowTrading: {
    type: Boolean,
    default: true
  },
  allowLiquidations: {
    type: Boolean,
    default: true
  }
};

// ProtocolConfig schema
const ProtocolConfigSchema = {
  // Fee parameters (in basis points)
  openingFeeBps: {
    type: Number,
    required: true
  },
  closingFeeBps: {
    type: Number,
    required: true
  },
  liquidationFeeBps: {
    type: Number,
    required: true
  },

  // Fee split parameters (in basis points)
  treasuryCutBps: {
    type: Number,
    required: true
  },
  fundingCutBps: {
    type: Number,
    required: true
  },

  // Funding parameters
  maxFundingRateBps: {
    type: Number,
    required: true
  },
  fundingIntervalSeconds: {
    type: Number,
    required: true
  },

  // Risk parameters
  minCollateralRatioBps: {
    type: Number,
    required: true
  },
  liquidationThresholdBps: {
    type: Number,
    required: true
  },

  // Liquidity parameters
  minLiquidity: {
    type: Number,
    required: true
  },

  // Rebalance request fee in lamports (SOL)
  rebalanceRequestFeeLamports: {
    type: Number,
    default: 0
  },

  // Baskt creation fee in lamports (SOL)
  basktCreationFeeLamports: {
    type: Number,
    default: 0
  },

  // Metadata
  lastUpdated: {
    type: Number,
    required: true
  },
  lastUpdatedBy: {
    type: String,
    required: true
  }
};

// Main Protocol schema
const ProtocolMetadataSchema = new mongoose.Schema({
  isInitialized: {
    type: Boolean,
    default: true
  },
  owner: {
    type: String,
    required: true
  },
  accessControl: {
    type: [AccessControlEntrySchema],
    required: true
  },
  featureFlags: {
    type: FeatureFlagsSchema,
    required: true
  },
  treasury: {
    type: String,
    required: true
  },
  // Collateral mint (USDC)
  collateralMint: {
    type: String,
    required: true
  },
  // Protocol configuration parameters
  config: {
    type: ProtocolConfigSchema,
    required: true
  },
  protocolAddress: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'protocol_metadata'
});

export default ProtocolMetadataSchema;
