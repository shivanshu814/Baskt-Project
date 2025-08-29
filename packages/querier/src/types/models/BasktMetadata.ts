import { BasktStatus } from "@baskt/types";
import BN from "bn.js";
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
    baselinePrice: BN; // Price at last rebalance/activation
  }>;
  isPublic: boolean;
  status: BasktStatus;
  openPositions: number;
  lastRebalanceTime: number;
  baselineNav: BN;
  rebalancePeriod: number;
  config: {
    openingFeeBps?: number;
    closingFeeBps?: number;
    liquidationFeeBps?: number;
    minCollateralRatioBps?: number;
    liquidationThresholdBps?: number;
  };
  stats: {
    change24h?: number;
    change7d?: number;
    change30d?: number;
    change365d?: number;
    longAllTimeVolume: BN;
    shortAllTimeVolume: BN;
    longOpenInterestContracts: BN;
    shortOpenInterestContracts: BN;
  };
  marketIndices: {
    cumulativeFundingIndex: BN;
    cumulativeBorrowIndex: BN;
    currentFundingRate: number;
    currentBorrowRate: number;
    lastUpdateTimestamp: number;
  };
  rebalanceFeeIndex: {
    cumulativeIndex: BN;
    lastUpdateTimestamp: number;
  };
  creationTxSignature: string;
  activateBasktTxSignature: string;
  decomissionBasktTxSignature: string;
  closeBasktTxSignature: string;
  createdAt?: Date;
  updatedAt?: Date;
}
