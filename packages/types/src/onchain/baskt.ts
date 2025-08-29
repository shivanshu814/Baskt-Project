import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface OnchainAssetConfig {
  assetId: PublicKey;
  direction: boolean; // true for long, false for short
  weight: BN; // In BPS (basis points, e.g., 5000 = 50%)
  baselinePrice: BN; // Price at last rebalance/activation
}


export enum BasktStatus {
  Pending = 'pending',
  Active = 'active',
  Decommissioning = 'decommissioning',
  Closed = 'closed',
}

export interface OnchainMarketIndices {
  cumulativeFundingIndex: BN | string;
  cumulativeBorrowIndex: BN | string;
  currentFundingRate: BN | string;
  currentBorrowRate: BN | string;
  lastUpdateTimestamp: BN | string;
}

export interface OnchainRebalanceFee {
  cumulativeIndex: BN | string;
  lastUpdateTimestamp: BN | string;
  currentFeePerUnit: BN | string;
}

export const statusStringToEnum = (status: any) => {
  if ('pending' in status) return BasktStatus.Pending;
  if ('active' in status) return BasktStatus.Active;
  if ('decommissioning' in status) return BasktStatus.Decommissioning;
  if ('closed' in status) return BasktStatus.Closed;
  return BasktStatus.Pending;
}

export interface OnchainBasktConfig {
  openingFeeBps: BN | string | null;
  closingFeeBps: BN | string | null;
  liquidationFeeBps: BN | string | null;
  minCollateralRatioBps: BN | string | null;
  liquidationThresholdBps: BN | string | null;
}

export interface OnchainBasktAccount {
  uid: BN | string;
  basktId: PublicKey;
  currentAssetConfigs: OnchainAssetConfig[];
  isPublic: boolean;
  creator: PublicKey;
  status: BasktStatus;
  lastRebalanceTime: BN | string; // u32 timestamp
  baselineNav: BN | string;
  bump: number;
  isActive: boolean;
  rebalancePeriod: BN | string; // u32 timestamp
  marketIndices: OnchainMarketIndices;
  rebalanceFeeIndex: OnchainRebalanceFee;
  config: OnchainBasktConfig;
  openPositions: BN | string;
}
