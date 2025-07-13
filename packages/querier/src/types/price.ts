import { QueryResult } from '../models/types';

/**
 * Formatted asset price data
 */
export interface FormattedAssetPrice {
  id: string;
  time: number | null;
  price: number | null;
  rawPrice: any;
}

/**
 * Price range data for an asset
 */
export interface PriceRange {
  assetId: string;
  minPrice: number | null;
  maxPrice: number | null;
  latestPrice: number | null;
  startDate?: number;
  endDate?: number;
}

/**
 * Price statistics combining latest price and range
 */
export interface PriceStats {
  assetId: string;
  latestPrice: FormattedAssetPrice | null;
  priceRange: PriceRange | null;
}

/**
 * Price history query options
 */
export interface PriceHistoryOptions {
  assetId: string;
  startDate?: number;
  endDate?: number;
  interval?: 'minute' | 'hour' | 'day' | 'week' | 'month';
  limit?: number;
}

/**
 * Price change data
 */
export interface PriceChange {
  assetId: string;
  currentPrice: number;
  previousPrice: number;
  changeAmount: number;
  changePercentage: number;
  period: string;
}

/**
 * Price alert configuration
 */
export interface PriceAlert {
  assetId: string;
  alertType: 'above' | 'below' | 'change';
  threshold: number;
  isActive: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

/**
 * Price volatility metrics
 */
export interface PriceVolatility {
  assetId: string;
  period: string;
  volatility: number;
  standardDeviation: number;
  averagePrice: number;
  priceCount: number;
} 