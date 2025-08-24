import { BaseClient } from '@baskt/sdk';
import { PublicKey } from '@solana/web3.js';
import { Op, QueryTypes } from 'sequelize';
import { AssetPrice } from '../config/timescale';
import { PriceOptions, QueryResult } from '../models/types';
import { FormattedAssetPrice, PriceRange, PriceStats } from '../types/price';
import { handleQuerierError } from '../utils/error-handling';

/**
 * Price Querier
 *
 * This file is used to get price data from TimescaleDB.
 * It is used wherever price info is needed, such as for asset, baskt, and position.
 * It has methods to fetch latest prices, price history, and price range.
 */
export class PriceQuerier {
  private basktClient: BaseClient;

  private static instance: PriceQuerier;
  public static getInstance(basktClient: BaseClient): PriceQuerier {
    if (!PriceQuerier.instance) {
      PriceQuerier.instance = new PriceQuerier(basktClient);
    }
    return PriceQuerier.instance;
  }

  constructor(basktClient: BaseClient) {
    this.basktClient = basktClient;
  }



  /**
   * Get price history for an asset within a date range
   */
  async getPriceHistory(options: PriceOptions): Promise<QueryResult<FormattedAssetPrice[]>> {
    const { assetId, startDate, endDate } = options;
    try {
      const whereClause: any = {
        asset_id: assetId,
      };

      if (startDate && endDate) {
        whereClause.time = {
          [Op.gte]: new Date(startDate * 1000),
          [Op.lte]: new Date(endDate * 1000),
        };
      }

      const assetPriceRows = await AssetPrice.findAll({
        where: whereClause,
        order: [['time', 'DESC']],
      });

      const formattedPrices = assetPriceRows.map((row: any) => {
        const plain = row.toJSON();
        return this.formatAssetPrice(plain);
      });

      const result: QueryResult<FormattedAssetPrice[]> = {
        success: true,
        data: formattedPrices,
      };

      return result;
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch price history',
        error: querierError.message,
      };
    }
  }



  /**
   * Get all NAV data for a specific baskt
   */
  async getBasktNavHistory(basktId: string): Promise<QueryResult<FormattedAssetPrice[]>> {
    return this.getAssetHistory(basktId);
  }

  async getAssetHistory(assetId: string): Promise<QueryResult<FormattedAssetPrice[]>> {
    try {
      const assetPriceRows = await AssetPrice.findAll({
        where: {
          asset_id: assetId,
        },
        order: [['time', 'DESC']],
      });

      const formattedPrices = assetPriceRows.map((row: any) => {
        const plain = row.toJSON();
        return this.formatAssetPrice(plain);
      });

      const result: QueryResult<FormattedAssetPrice[]> = {
        success: true,
        data: formattedPrices,
      };

      return result;
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch asset history',
        error: querierError.message,
      };
    }
  }

  /**
   * Calculate performance metrics using TimescaleDB-optimized query (single asset)
   */
  public async getAssetPerformanceOptimized(
    assetId: string, 
    currentPrice: number
  ): Promise<{
    daily: number | null;
    weekly: number | null;
    monthly: number | null;
    year: number | null;
    prices: {
      current: number;
      daily: number | null;
      weekly: number | null;
      monthly: number | null;
      yearly: number | null;
    };
  }> {
    try {
      // Use the batch method for consistency and efficiency
      const currentPrices = new Map([[assetId, currentPrice]]);
      const batchResult = await this.getBatchAssetPerformanceOptimized([assetId], currentPrices);
      return batchResult.get(assetId) || { 
        daily: null, 
        weekly: null, 
        monthly: null, 
        year: null,
        prices: {
          current: currentPrice,
          daily: null,
          weekly: null,
          monthly: null,
          yearly: null
        }
      };
    } catch (error) {
      console.error('Error calculating optimized performance metrics:', error);
      return {
        daily: null,
        weekly: null,
        monthly: null,
        year: null,
        prices: {
          current: currentPrice,
          daily: null,
          weekly: null,
          monthly: null,
          yearly: null
        }
      };
    }
  }

  /**
   * Batch calculate performance metrics using TimescaleDB-optimized query (ultra fast)
   */
  public async getBatchAssetPerformanceOptimized(
    assetIds: string[], 
    currentPrices: Map<string, number>
  ): Promise<
    Map<
      string,
      {
        daily: number | null;
        weekly: number | null;
        monthly: number | null;
        year: number | null;
        prices: {
          current: number;
          daily: number | null;
          weekly: number | null;
          monthly: number | null;
          yearly: number | null;
        };
      }
    >
  > {
    try {
      if (!assetIds.length) return new Map();

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const placeholders = assetIds.map((_, index) => `$${index + 5}`).join(',');
      const results = await AssetPrice.sequelize?.query(
        `
        SELECT 
          asset_id,
          (SELECT price FROM asset_prices 
           WHERE asset_id = ap.asset_id AND time <= $1 
           ORDER BY time DESC LIMIT 1) as day_ago_price,
          (SELECT price FROM asset_prices 
           WHERE asset_id = ap.asset_id AND time <= $2 
           ORDER BY time DESC LIMIT 1) as week_ago_price,
          (SELECT price FROM asset_prices 
           WHERE asset_id = ap.asset_id AND time <= $3 
           ORDER BY time DESC LIMIT 1) as month_ago_price,
          (SELECT price FROM asset_prices 
           WHERE asset_id = ap.asset_id AND time <= $4 
           ORDER BY time DESC LIMIT 1) as year_ago_price
        FROM asset_prices ap
        WHERE ap.asset_id IN (${placeholders})
          AND EXISTS (SELECT 1 FROM asset_prices WHERE asset_id = ap.asset_id AND time >= $4)
        GROUP BY ap.asset_id
        `,
        {
          bind: [
            oneDayAgo,
            oneWeekAgo,
            oneMonthAgo,
            oneYearAgo,
            ...assetIds,
          ],
          type: QueryTypes.SELECT,
        },
      );

      if (!results || !Array.isArray(results)) {
        return new Map();
      }

      // Process results into performance map
      const performanceMap = new Map();

      for (const result of results as any[]) {
        const assetId = result.asset_id;
        const currentPrice = currentPrices.get(assetId) || 0;
        
        
        // Get historical prices from the database results
        const dayAgoPrice = result.day_ago_price ? Number(result.day_ago_price): null;
        const weekAgoPrice = result.week_ago_price ? Number(result.week_ago_price)  : null;
        const monthAgoPrice = result.month_ago_price ? Number(result.month_ago_price)  : null;
        const yearAgoPrice = result.year_ago_price ? Number(result.year_ago_price)  : null;

        const calculateChange = (oldPrice: number | null, newPrice: number): number => {
          if (!oldPrice || oldPrice === 0) return 0;
          return ((newPrice - oldPrice) / oldPrice) * 100;
        };

        performanceMap.set(assetId, {
          daily: dayAgoPrice ? calculateChange(dayAgoPrice, currentPrice) : null,
          weekly: weekAgoPrice ? calculateChange(weekAgoPrice, currentPrice) : null,
          monthly: monthAgoPrice ? calculateChange(monthAgoPrice, currentPrice) : null,
          year: yearAgoPrice ? calculateChange(yearAgoPrice, currentPrice) : null,
          prices: {
            current: currentPrice,        // Use caller's current price
            daily: dayAgoPrice,           // Historical price from DB
            weekly: weekAgoPrice,         // Historical price from DB
            monthly: monthAgoPrice,       // Historical price from DB
            yearly: yearAgoPrice          // Historical price from DB
          }
        });
      }

      return performanceMap;
    } catch (error) {
      console.error('Error in getBatchAssetPerformanceOptimized:', error);
      return new Map();
    }
  }

  /**
   * Format asset price data
   */
  private formatAssetPrice(assetPrice: any): FormattedAssetPrice {
    return {
      id: assetPrice.asset_id,
      time: assetPrice.time ? Math.floor(new Date(assetPrice.time).getTime() / 1000) : null,
      price:
        assetPrice.price && !isNaN(Number(assetPrice.price))
          ? Number(assetPrice.price) / 1e6
          : null,
      rawPrice: assetPrice.price,
    };
  }

 
}
