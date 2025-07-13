import { AssetPrice } from '../config/timescale';
import { handleQuerierError } from '../utils/error-handling';
import { PriceOptions, QueryResult } from '../models/types';
import { Op } from 'sequelize';
import { BaseClient } from '@baskt/sdk';
import { FormattedAssetPrice, PriceRange, PriceStats } from '../types/price';

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
          latestPrice: (priceResult.success && priceResult.data) ? priceResult.data : null,
          priceRange: (rangeResult.success && rangeResult.data) ? rangeResult.data : null,
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
