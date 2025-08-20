import {  OnchainBasktAccount } from '@baskt/types';
import { CombinedAsset } from './asset';
import { BasktMetadata } from './models';

/**
 * Performance metrics for a baskt
 */
export interface BasktPerformance {
  daily: number;
  weekly: number;
  monthly: number;
  year: number;
}

/**
 * Combined baskt data structure that merges metadata, onchain data, and asset information
 */
export interface CombinedBaskt extends Omit<BasktMetadata, 'currentAssetConfigs'> {
  /** Array of combined assets in the baskt */
  assets: CombinedBasktAsset[];
  /** Current price/NAV */
  price: number;
  /** 24-hour price change percentage */
  change24h: number;
  /** Assets under management */
  aum: number;
  /** Sparkline data for mini chart */
  sparkline: number[];
  /** Performance metrics */
  performance: BasktPerformance;
}

/**
 * Combined asset data specific to a baskt context
 */
export interface CombinedBasktAsset extends CombinedAsset {
  /** Asset weight in the baskt (percentage) */
  weight: number;
  /** Direction (long/short) */
  direction: boolean;
  /** Asset ID */
  id: string;
  /** Baseline price at last rebalance */
  baselinePrice: number;
  /** 24-hour volume */
  volume24h: number;
  /** Market cap */
  marketCap: number;
}

/**
 * NAV (Net Asset Value) data for a baskt
 */
export interface BasktNAV {
  /** Current NAV value */
  nav: number;
}

/**
 * Options for baskt queries
 */
export interface BasktQueryOptions {
  hidePrivateBaskts?: boolean;
  withPerformance: boolean;
} 