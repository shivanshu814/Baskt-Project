import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface OnchainAssetConfig {
  assetId: PublicKey;
  direction: boolean; // true for long, false for short
  weight: BN; // In BPS (basis points, e.g., 5000 = 50%)
  baselinePrice: BN; // Price at last rebalance/activation
}

export interface OnchainOracleParams {
  price: BN;
  maxPriceAgeSec: number;
  publishTime: BN;
}
export interface OnchainRebalanceHistory {
  basktId: PublicKey;
  rebalanceIndex: BN;
  assetConfigs: OnchainAssetConfig[];
  baselineNav: BN;
  timestamp: BN; // i64 timestamp
}

export enum BasktStatus {
  Pending = 'pending',
  Active = 'active',
  Decommissioning = 'decommissioning',
  Settled = 'settled',
  Closed = 'closed',
}

export interface OnchainBasktAccount {
  address: PublicKey;
  basktId: PublicKey;
  basktName: string;
  currentAssetConfigs: OnchainAssetConfig[];
  isPublic: boolean;
  creator: PublicKey;
  creationTime: BN | string; // i64 timestamp
  lastRebalanceIndex: BN | string;
  lastRebalanceTime: BN | string; // i64 timestamp
  oracle: OnchainOracleParams;
  status: BasktStatus;
  baselineNav: BN | string;
  bump: number;
  isActive: boolean;
}
