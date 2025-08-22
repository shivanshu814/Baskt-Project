import { AssetMetadata } from './models';
import BN from 'bn.js';

/**
 * Price information for an asset
 */
export interface AssetPriceData {
  id: string;
  price: number;
  time: string | Date;
}

/**
 * Combined asset data structure that merges metadata, onchain data, and price information
 */
export interface CombinedAsset extends AssetMetadata {
  price: number;
  change24h: number;
  exposure?: {
    longOpenInterest: BN;
    shortOpenInterest: BN;
  }
  volume?: {
    longVolume: BN;
    shortVolume: BN;
  }
}

/**
 * Cache statistics for asset data
 */
export interface AssetCacheStats {
  totalAssets: number;
  totalOnchainAssets: number;
  totalPrices: number;
  uniqueAssetAddresses: number;
  assetsWithPrices: number;
  priceCoveragePercentage: number;
  recentActivity24h: number;
  dataSources: {
    mongodb: number;
    onchain: number;
    timescale: number;
  };
  cacheStatus: {
    mongodb: string;
    onchain: string;
    timescale: string;
  };
  lastUpdated: string;
}

/**
 * Options for asset queries
 */
export interface AssetQueryOptions {
  /** Include asset configuration */
  withConfig?: boolean;
}