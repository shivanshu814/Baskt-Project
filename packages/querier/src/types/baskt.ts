import {  OnchainBasktAccount } from '@baskt/types';
import { CombinedAsset } from './asset';

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
 * Price history data for a baskt
 */
export interface BasktPriceHistory {
  daily: Array<{
    date: string;
    price: number;
    volume?: number;
  }>;
}

/**
 * Combined baskt data structure that merges metadata, onchain data, and asset information
 */
export interface CombinedBaskt {
  /** MongoDB document ID */
  _id?: string;
  /** Baskt ID */
  basktId: string;
  /** Baskt name */
  name: string;
  /** Creator address */
  creator: string;
  /** Transaction signature */
  txSignature: string;
  /** Array of combined assets in the baskt */
  assets: CombinedBasktAsset[];
  /** Total number of assets */
  totalAssets: number;
  /** Current price/NAV */
  price: number;
  /** 24-hour price change percentage */
  change24h: number;
  /** Assets under management */
  aum: number;
  /** Sparkline data for mini chart */
  sparkline: number[];
  /** Onchain baskt account data */
  account: OnchainBasktAccount | {};
  /** Creation date */
  creationDate: string;
  /** Price history data */
  priceHistory: BasktPriceHistory;
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
  /** Include asset configuration data */
  withConfig?: boolean;
  /** Include performance metrics */
  withPerformance?: boolean;
  /** Include price history */
  withPriceHistory?: boolean;
} 