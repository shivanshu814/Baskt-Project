import { AssetPrice } from '../config/timescale';
import { handleQuerierError } from '../utils/error-handling';
import { PriceOptions, QueryResult } from '../models/types';
import { Op } from 'sequelize';
import { BaseClient } from '@baskt/sdk';
import { FormattedAssetPrice, PriceRange, PriceStats } from '../types/price';
import { Sequelize, QueryTypes } from 'sequelize';

/**
 * Price Querier
 *
 * This file is used to get price data from TimescaleDB.
 * It is used wherever price info is needed, such as for asset, baskt, and position.
 * It has methods to fetch latest prices, price history, and price range.
 */
export class PriceQuerier {
  private basktClient: BaseClient;

  constructor(basktClient: BaseClient) {
    this.basktClient = basktClient;
  }

  /**
   * Get latest prices for multiple assets
   */
  async getLatestPrices(assetIds: string[]): Promise<QueryResult<FormattedAssetPrice[]>> {
    try {
      const assetPriceRows = await AssetPrice.findAll({
        where: {
          asset_id: {
            [Op.in]: assetIds,
          },
        },
        order: [['time', 'DESC']],
        limit: assetIds.length * 2,
      });

      const priceMap = new Map();
      assetPriceRows.forEach((row: any) => {
        const plain = row.toJSON();
        const assetId = plain.asset_id;

        if (!priceMap.has(assetId)) {
          priceMap.set(assetId, this.formatAssetPrice(plain));
        }
      });

      const result: QueryResult<FormattedAssetPrice[]> = {
        success: true,
        data: Array.from(priceMap.values()),
      };

      return result;
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch latest prices',
        error: querierError.message,
      };
    }
  }

  /**
   * Get latest price for a single asset
   */
  async getLatestPrice(assetId: string): Promise<QueryResult<FormattedAssetPrice>> {
    try {
      const assetPriceRow = await AssetPrice.findOne({
        where: {
          asset_id: assetId,
        },
        order: [['time', 'DESC']],
      });

      if (!assetPriceRow) {
        return {
          success: false,
          message: 'Price not found',
        };
      }

      const plain = assetPriceRow.toJSON();
      const formattedPrice = this.formatAssetPrice(plain);

      const result: QueryResult<FormattedAssetPrice> = {
        success: true,
        data: formattedPrice,
      };

      return result;
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch latest price',
        error: querierError.message,
      };
    }
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
   * Get price range for an asset (min, max, avg)
   */
  async getPriceRange(
    assetId: string,
    startDate?: number,
    endDate?: number,
  ): Promise<QueryResult<PriceRange>> {
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

      const [minPrice, maxPrice, latestPrice] = await Promise.all([
        AssetPrice.min('price', { where: whereClause }),
        AssetPrice.max('price', { where: whereClause }),
        AssetPrice.findOne({
          where: whereClause,
          order: [['time', 'DESC']],
        }),
      ]);

      const result: QueryResult<PriceRange> = {
        success: true,
        data: {
          assetId,
          minPrice: minPrice ? Number(minPrice) / 1e6 : null,
          maxPrice: maxPrice ? Number(maxPrice) / 1e6 : null,
          latestPrice: latestPrice ? Number((latestPrice as any).price) / 1e6 : null,
          startDate,
          endDate,
        },
      };

      return result;
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch price range',
        error: querierError.message,
      };
    }
  }

  /**
   * Get price statistics for multiple assets
   */
  async getPriceStats(assetIds: string[]): Promise<QueryResult<PriceStats[]>> {
    try {
      const statsPromises = assetIds.map(async (assetId) => {
        const priceResult = await this.getLatestPrice(assetId);
        const rangeResult = await this.getPriceRange(assetId);

        return {
          assetId,
          latestPrice: priceResult.success && priceResult.data ? priceResult.data : null,
          priceRange: rangeResult.success && rangeResult.data ? rangeResult.data : null,
        };
      });

      const stats = await Promise.all(statsPromises);

      const result: QueryResult<PriceStats[]> = {
        success: true,
        data: stats,
      };

      return result;
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch price stats',
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
  public async getAssetPerformanceOptimized(assetId: string): Promise<{
    daily: number;
    weekly: number;
    monthly: number;
    year: number;
  }> {
    assetId = "7vTC3d36FeKwFgZY8GrCAaUsYhqSWewweQJCXCMikacG"
    try {
      // Use the batch method for consistency and efficiency
      const batchResult = await this.getBatchAssetPerformanceOptimized([assetId]);
      return batchResult.get(assetId) || { daily: 0, weekly: 0, monthly: 0, year: 0 };
    } catch (error) {
      console.error('Error calculating optimized performance metrics:', error);
      return {
        daily: 0,
        weekly: 0,
        monthly: 0,
        year: 0,
      };
    }
  }

  /**
   * Batch calculate performance metrics using TimescaleDB-optimized query (ultra fast)
   */
  public async getBatchAssetPerformanceOptimized(assetIds: string[]): Promise<Map<string, {
    daily: number;
    weekly: number;
    monthly: number;
    year: number;
  }>> {
    console.time('getBatchAssetPerformanceOptimized');
    assetIds = ["7vTC3d36FeKwFgZY8GrCAaUsYhqSWewweQJCXCMikacG", "7qBfMvYpifG9R2ajCqKU2CfvPAZbL1Bc5M95vewsE3mS", 
      "4XvV5mrhKhReGfx5LqGTdHT1fkvWQ4WbTRAFvJRrgUbU",
      "4gDjhkYZQyXN59P4p7i41LoE1XRGp92a3yL9fJHgMtzp",
      "4ri8Gv1L8WmxxSKRwFtYE9qVr3iWkfGxDgWF3mnFW3Qv",
      "44tAFMYPan5pPVxvBaxhcdGB6pXUzjdH29o4eMumZuhZ",
      "c4BupvAaQBDfpn5SFFLN4xXQQ3Mcodzop4jVr1uvWeS",
      "B1PrwYr6vM76QJDeAmn55MbjbmAeDkStr3KpWCEUM6VX",
      "AyVK6YejuMY9oUysNiw6Fur5S8nx5V1JCm9Bkj7u48Zv",
      "2ojApR4EyWjPPwVpsUp88T5Y6rA8bD3CCTP1sk4d6uTC",
      "2rMuQNvSpbLhpfnjjhAvMDdAUgkW43KdtqJCHMEPVW9m",
      "7vTC3d36FeKwFgZY8GrCAaUsYhqSWewweQJCXCMikacG",
      "i4Z2irv1Me2JWiSAkaufVno7CofN5V8ho92VQYu4dLD",
      "J34q3deypSJEbigVGCNfB3d22ZNTXv8tzA8c2K236dpr"
   ]
    try {
      if (!assetIds.length) return new Map();

      const now = Math.floor(Date.now() / 1000);
      const oneDayAgo = now - 24 * 60 * 60;
      const oneWeekAgo = now - 7 * 24 * 60 * 60;
      const oneMonthAgo = now - 30 * 24 * 60 * 60;
      const oneYearAgo = now - 365 * 24 * 60 * 60;

      // Create placeholders for the IN clause
      const placeholders = assetIds.map((_, index) => `$${index + 6}`).join(',');

      // TimescaleDB-optimized query using time_bucket and LATERAL joins
      const results = await AssetPrice.sequelize?.query(`
        WITH time_ranges AS (
          SELECT 
            asset_id,
            MAX(CASE WHEN time >= $1 THEN price END) as current_price,
            MAX(CASE WHEN time <= $2 AND time >= $2 - INTERVAL '1 day' THEN price END) as day_ago_price,
            MAX(CASE WHEN time <= $3 AND time >= $3 - INTERVAL '1 day' THEN price END) as week_ago_price,
            MAX(CASE WHEN time <= $4 AND time >= $4 - INTERVAL '1 day' THEN price END) as month_ago_price,
            MAX(CASE WHEN time <= $5 AND time >= $5 - INTERVAL '1 day' THEN price END) as year_ago_price
          FROM asset_prices 
          WHERE asset_id IN (${placeholders})
            AND time >= $5  -- Only look at data from 1 year ago onwards
          GROUP BY asset_id
        ),
        -- Fill in missing values with more targeted queries
        precise_prices AS (
          SELECT 
            tr.asset_id,
            COALESCE(tr.current_price, 
              (SELECT price FROM asset_prices 
               WHERE asset_id = tr.asset_id 
               ORDER BY time DESC LIMIT 1)
            ) as current_price,
            COALESCE(tr.day_ago_price,
              (SELECT price FROM asset_prices 
               WHERE asset_id = tr.asset_id AND time <= $2
               ORDER BY time DESC LIMIT 1)
            ) as day_ago_price,
            COALESCE(tr.week_ago_price,
              (SELECT price FROM asset_prices 
               WHERE asset_id = tr.asset_id AND time <= $3
               ORDER BY time DESC LIMIT 1)
            ) as week_ago_price,
            COALESCE(tr.month_ago_price,
              (SELECT price FROM asset_prices 
               WHERE asset_id = tr.asset_id AND time <= $4
               ORDER BY time DESC LIMIT 1)
            ) as month_ago_price,
            COALESCE(tr.year_ago_price,
              (SELECT price FROM asset_prices 
               WHERE asset_id = tr.asset_id AND time <= $5
               ORDER BY time DESC LIMIT 1)
            ) as year_ago_price
          FROM time_ranges tr
        )
        SELECT * FROM precise_prices;
      `, {
        bind: [
          new Date(now * 1000),           // $1 - now
          new Date(oneDayAgo * 1000),     // $2 - 1 day ago
          new Date(oneWeekAgo * 1000),    // $3 - 1 week ago  
          new Date(oneMonthAgo * 1000),   // $4 - 1 month ago
          new Date(oneYearAgo * 1000),    // $5 - 1 year ago
          ...assetIds                     // $6+ - asset IDs
        ],
        type: QueryTypes.SELECT,
      });

      if (!results || !Array.isArray(results)) {
        return new Map();
      }

      // Process results into performance map
      const performanceMap = new Map();
      
      for (const result of results as any[]) {
        const currentPrice = result.current_price ? Number(result.current_price) / 1e6 : 0;
        const dayAgoPrice = result.day_ago_price ? Number(result.day_ago_price) / 1e6 : null;
        const weekAgoPrice = result.week_ago_price ? Number(result.week_ago_price) / 1e6 : null;
        const monthAgoPrice = result.month_ago_price ? Number(result.month_ago_price) / 1e6 : null;
        const yearAgoPrice = result.year_ago_price ? Number(result.year_ago_price) / 1e6 : null;

        const calculateChange = (oldPrice: number | null, newPrice: number): number => {
          if (!oldPrice || oldPrice === 0) return 0;
          return ((newPrice - oldPrice) / oldPrice) * 100;
        };

        performanceMap.set(result.asset_id, {
          daily: dayAgoPrice ? calculateChange(dayAgoPrice, currentPrice) : 0,
          weekly: weekAgoPrice ? calculateChange(weekAgoPrice, currentPrice) : 0,
          monthly: monthAgoPrice ? calculateChange(monthAgoPrice, currentPrice) : 0,
          year: yearAgoPrice ? calculateChange(yearAgoPrice, currentPrice) : 0,
        });
      }

      console.timeEnd('getBatchAssetPerformanceOptimized');
      console.log('performanceMap = ', performanceMap);
      return performanceMap;
    } catch (error) {
      console.error('Error calculating batch asset performance metrics:', error);
      console.timeEnd('getBatchAssetPerformanceOptimized');
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
