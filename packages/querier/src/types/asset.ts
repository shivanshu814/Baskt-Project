import { AssetMetadataModel, OnchainAsset } from '@baskt/types';

/**
 * Price information for an asset
 */
export interface AssetPriceData {
  id: string;
  price: number;
  time: string | Date;
}

/**
 * Configuration data for an asset (optional fields from AssetMetadata)
 */
export interface AssetConfig {
  priceConfig: AssetMetadataModel['priceConfig'];
  coingeckoId?: string;
}

/**
 * Combined asset data structure that merges metadata, onchain data, and price information
 */
export interface CombinedAsset {
  /** MongoDB document ID */
  _id?: string;
  /** Asset ticker symbol */
  ticker: string;
  /** Asset blockchain address */
  assetAddress: string;
  /** Asset logo URL */
  logo: string;
  /** Asset display name */
  name: string;
  /** Current price in USD */
  price: number;
  /** Raw price value */
  priceRaw: number;
  /** 24-hour price change percentage */
  change24h: number;
  /** Onchain asset account data */
  account?: OnchainAsset;
  /** Asset weight in baskt (default 0) */
  weight: number;
  /** Asset configuration (optional) */
  config?: AssetConfig;
  /** Latest price data */
  latestPrice?: AssetPriceData;
  /** Array of baskt IDs this asset belongs to */
  basktIds: string[];
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
  /** Include latest price data */
  withLatestPrices?: boolean;
  /** Include asset configuration */
  withConfig?: boolean;
} 