import { ObjectId } from "mongoose";
import { AccessControlRole } from '@baskt/types';

export interface AccessControlEntry {
  account: string;
  role: AccessControlRole;
}

export interface FeatureFlags {
  allowAddLiquidity: boolean;
  allowRemoveLiquidity: boolean;
  allowOpenPosition: boolean;
  allowClosePosition: boolean;
  allowPnlWithdrawal: boolean;
  allowCollateralWithdrawal: boolean;
  allowAddCollateral: boolean;
  allowBasktCreation: boolean;
  allowBasktUpdate: boolean;
  allowTrading: boolean;
  allowLiquidations: boolean;
}

export interface ProtocolConfig {
  // Fee parameters (in basis points)
  openingFeeBps: number;
  closingFeeBps: number;
  liquidationFeeBps: number;

  // Fee split parameters (in basis points)
  treasuryCutBps: number;
  fundingCutBps: number;

  // Funding parameters
  maxFundingRateBps: number;
  fundingIntervalSeconds: number;

  // Risk parameters
  minCollateralRatioBps: number;
  liquidationThresholdBps: number;

  // Liquidity parameters
  minLiquidity: number;

  // Rebalance request fee in lamports (SOL)
  rebalanceRequestFeeLamports: number;

  // Baskt creation fee in lamports (SOL)
  basktCreationFeeLamports: number;

  // Metadata
  lastUpdated: number;
  lastUpdatedBy: string;
}

export interface ProtocolMetadata { 
  _id?: ObjectId;
  isInitialized: boolean;
  owner: string;
  accessControl: AccessControlEntry[];
  featureFlags: FeatureFlags;
  treasury: string;
  collateralMint: string;
  config: ProtocolConfig;
  protocolAddress: string;
  createdAt?: Date;
  updatedAt?: Date;
}