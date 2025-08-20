import { BasktStatus } from "@baskt/types";
import { ObjectId } from "mongoose";

/**
 * Interface for BasktMetadata model
 * Stores metadata for a Baskt that is not stored on-chain
 */
export interface BasktMetadata{
  _id?: ObjectId;
  uid: number;
  basktId: string; // Pubkey as string
  creator: string; // Reference to User object (pubkey)
  name: string;
  currentAssetConfigs: Array<{
    assetObjectId: string;
    assetId: string; // Pubkey as string
    direction: boolean; // true for long, false for short
    weight: number; // In BPS (basis points, e.g., 5000 = 50%)
    baselinePrice: string; // Price at last rebalance/activation
  }>;
  isPublic: boolean;
  status: BasktStatus;
  openPositions: number;
  lastRebalanceTime: number;
  baselineNav: string;
  rebalancePeriod: number;
  config: {
    openingFeeBps?: number;
    closingFeeBps?: number;
    liquidationFeeBps?: number;
    minCollateralRatioBps?: number;
    liquidationThresholdBps?: number;
  };
  fundingIndex: {
    cumulativeIndex: string;
    lastUpdateTimestamp: number;
    currentRate: string;
  };
  rebalanceFeeIndex: {
    cumulativeIndex: string;
    lastUpdateTimestamp: number;
  };
  creationTxSignature: string;
  createdAt?: Date;
  updatedAt?: Date;
}
