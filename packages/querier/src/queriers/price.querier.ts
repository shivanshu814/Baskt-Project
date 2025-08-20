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
   * Calculate baskt performance metrics from NAV history
   */
  public async getBasktPerformanceOptimized(basktId: string): Promise<{
    daily: number;
    weekly: number;
    monthly: number;
    year: number;
  }> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const oneDayAgo = now - 24 * 60 * 60;
      const oneWeekAgo = now - 7 * 24 * 60 * 60;
      const oneMonthAgo = now - 30 * 24 * 60 * 60;
      const oneYearAgo = now - 365 * 24 * 60 * 60;

      const navHistoryResult = await this.getBasktNavHistory(basktId);

      if (
        !navHistoryResult.success ||
        !navHistoryResult.data ||
        navHistoryResult.data.length === 0
      ) {
        try {
          const basktResult = await this.basktClient.getBasktRaw(
            new PublicKey(basktId),
            'confirmed',
          );

          if (basktResult && basktResult.baselineNav) {
            const baselineNav = basktResult.baselineNav.toNumber();
            const currentNav = baselineNav;

            const calculateChange = (oldNav: number, newNav: number): number => {
              if (!oldNav || oldNav === 0) return 0;
              return ((newNav - oldNav) / oldNav) * 100;
            };

            const performanceChange = calculateChange(baselineNav, currentNav);

            return {
              daily: performanceChange,
              weekly: performanceChange,
              monthly: performanceChange,
              year: performanceChange,
            };
          }
        } catch (fallbackError) {}
        return { daily: 0, weekly: 0, monthly: 0, year: 0 };
      }

      const navHistory = navHistoryResult.data;
      const currentNav = navHistory[0]?.price || 0;

      const dayAgoNav = this.findNavAtTime(navHistory, oneDayAgo);
      const weekAgoNav = this.findNavAtTime(navHistory, oneWeekAgo);
      const monthAgoNav = this.findNavAtTime(navHistory, oneMonthAgo);
      const yearAgoNav = this.findNavAtTime(navHistory, oneYearAgo);

      const oldestNav = navHistory[navHistory.length - 1]?.price || null;
      const oldestNavTime = navHistory[navHistory.length - 1]?.time || null;

      const calculateChange = (oldNav: number | null, newNav: number): number => {
        if (!oldNav || oldNav === 0) return 0;
        return ((newNav - oldNav) / oldNav) * 100;
      };

      const performance = {
        daily: dayAgoNav ? calculateChange(dayAgoNav, currentNav) : 0,
        weekly: weekAgoNav
          ? calculateChange(weekAgoNav, currentNav)
          : oldestNav && oldestNavTime
          ? calculateChange(oldestNav, currentNav)
          : 0,
        monthly: monthAgoNav
          ? calculateChange(monthAgoNav, currentNav)
          : oldestNav && oldestNavTime
          ? calculateChange(oldestNav, currentNav)
          : 0,
        year: yearAgoNav
          ? calculateChange(yearAgoNav, currentNav)
          : oldestNav && oldestNavTime
          ? calculateChange(oldestNav, currentNav)
          : 0,
      };

      return performance;
    } catch (error) {
      console.error('Error calculating baskt performance metrics:', error);
      return { daily: 0, weekly: 0, monthly: 0, year: 0 };
    }
  }

  /**
   * Find NAV value at a specific timestamp from NAV history
   */
  private findNavAtTime(navHistory: any[], targetTime: number): number | null {
    const sortedHistory = navHistory
      .filter((item) => item.time && item.price)
      .sort((a, b) => b.time - a.time);
    const entry = sortedHistory.find((item) => item.time <= targetTime);

    return entry?.price || null;
  }

  /**
   * Batch calculate baskt performance metrics from NAV history
   */
  public async getBatchBasktPerformanceOptimized(basktIds: string[]): Promise<
    Map<
      string,
      {
        daily: number;
        weekly: number;
        monthly: number;
        year: number;
      }
    >
  > {
    try {
      if (!basktIds.length) return new Map();

      const performanceMap = new Map();

      const performancePromises = basktIds.map(async (basktId) => {
        const performance = await this.getBasktPerformanceOptimized(basktId);
        return { basktId, performance };
      });

      const results = await Promise.all(performancePromises);

      results.forEach(({ basktId, performance }) => {
        performanceMap.set(basktId, performance);
      });

      return performanceMap;
    } catch (error) {
      console.error('Error calculating batch baskt performance metrics:', error);
      return new Map();
    }
  }

  /**
   * Batch calculate performance metrics using TimescaleDB-optimized query (ultra fast)
   */
  public async getBatchAssetPerformanceOptimized(assetIds: string[]): Promise<
    Map<
      string,
      {
        daily: number;
        weekly: number;
        monthly: number;
        year: number;
      }
    >
  > {
    try {
      if (!assetIds.length) return new Map();

      const now = Math.floor(Date.now() / 1000);
      const oneDayAgo = now - 24 * 60 * 60;
      const oneWeekAgo = now - 7 * 24 * 60 * 60;
      const oneMonthAgo = now - 30 * 24 * 60 * 60;
      const oneYearAgo = now - 365 * 24 * 60 * 60;

      const placeholders = assetIds.map((_, index) => `$${index + 6}`).join(',');
      const results = await AssetPrice.sequelize?.query(
        `
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
      `,
        {
          bind: [
            new Date(now * 1000),
            new Date(oneDayAgo * 1000),
            new Date(oneWeekAgo * 1000),
            new Date(oneMonthAgo * 1000),
            new Date(oneYearAgo * 1000),
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
