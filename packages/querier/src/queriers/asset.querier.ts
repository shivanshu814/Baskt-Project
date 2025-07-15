import { AssetMetadataModel } from '../models/mongodb';
import { AssetPrice } from '../config/timescale';
import { getOnchainConfig } from '../config/onchain';
import { createQuerierError, handleQuerierError } from '../utils/error-handling';
import { AssetOptions, QueryResult } from '../models/types';
import { PublicKey } from '@solana/web3.js';
import { BaseClient, fetchAssetPrices } from '@baskt/sdk';
import { 
  CombinedAsset, 
  AssetCacheStats, 
  AssetQueryOptions,
  AssetPriceData,
  AssetConfig,
} from '../types/asset';
import { AssetPriceProviderConfig, OnchainAsset } from '@baskt/types';

/**
 * Asset Querier
 *
 * This class provides methods to query the asset data from the MongoDB and Onchain.
 * It is used to get the asset data for the baskt, asset, order, position, access code, and authorized wallet models.
 *
 */
export class AssetQuerier {
  public basktClient: BaseClient;
  constructor(basktClient: BaseClient) {
    this.basktClient = basktClient;
  }

  /**
   * Get all assets with optional price and config data
   */
  async getAllAssets(options: AssetQueryOptions = {}): Promise<QueryResult<CombinedAsset[]>> {
    try {
      const { withLatestPrices = false, withConfig = false } = options;

      // Fetch data from multiple sources
      const [assetConfigs, onchainAssets, latestPrices] = await Promise.all([
        this.getAssetConfigsFromMongoDB(),
        this.getAssetsFromOnchain(),
        withLatestPrices ? this.getLatestPricesFromTimescaleDB() : Promise.resolve([]),
      ]);

      if (!assetConfigs || assetConfigs.length === 0) {
        return {
          success: false,
          data: [],
          message: 'No assets found',
        };
      }

      // Combine data from all sources
      const combinedAssets = this.combineAssetData(
        assetConfigs,
        onchainAssets,
        latestPrices,
        withConfig,
      );

      const result: QueryResult<CombinedAsset[]> = {
        success: true,
        data: combinedAssets,
      };

      return result;
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch assets',
        error: querierError.message,
      };
    }
  }

  /**
   * Get asset by address
   */
  async getAssetByAddress(
    assetAddress: string,
    options: AssetQueryOptions = {},
  ): Promise<QueryResult<CombinedAsset>> {
    try {
      const [assetConfig, onchainAsset, latestPrices] = await Promise.all([
        this.getAssetConfigFromMongoDB(assetAddress),
        this.getAssetFromOnchain(assetAddress),
        options.withLatestPrices ? this.getLatestPricesForAsset(assetAddress) : Promise.resolve([]),
      ]);

      if (!assetConfig && !onchainAsset) {
        return {
          success: false,
          message: 'Asset not found',
        };
      }

      const combinedAsset = this.combineSingleAssetData(
        assetConfig,
        onchainAsset,
        latestPrices[0] || null,
        options.withConfig || false,
      );

      const result: QueryResult<CombinedAsset> = {
        success: true,
        data: combinedAsset,
      };

      return result;
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch asset',
        error: querierError.message,
      };
    }
  }

  /**
   * Get multiple assets by their addresses
   */
  async getAssetsByAddress(
    assetAddresses: string[],
    options: AssetQueryOptions = {},
  ): Promise<QueryResult<CombinedAsset[]>> {
    try {
      const { withLatestPrices = false, withConfig = false } = options;

      // Fetch data from multiple sources
      const [assetConfigs, onchainAssets] = await Promise.all([
        this.getAssetConfigsByAddressFromMongoDB(assetAddresses),
        Promise.all(assetAddresses.map((addr) => this.getAssetFromOnchain(addr).catch(() => null))),
        withLatestPrices ? this.getLatestPricesForAssets(assetAddresses) : Promise.resolve([]),
      ]);
      const latestPrices = withLatestPrices ? await this.getLatestPricesForAssets(assetConfigs) : [];
      if (!assetConfigs || assetConfigs.length === 0) {
        console.log('No assets found from Querier');
        return {
          success: false,
          data: [],
          message: 'No assets found',
        };
      }

      const combinedAssets = assetConfigs.map((assetConfig: any, index: number) => {
        const matchingOnchainAsset = onchainAssets[index];
        const matchingPrice = latestPrices.find(
          (price: any) => price?.id === assetConfig.assetAddress?.toString(),
        );

        return this.combineSingleAssetData(
          assetConfig,
          matchingOnchainAsset,
          matchingPrice,
          withConfig,
        );
      }).filter((asset: any): asset is CombinedAsset => asset !== undefined);

      const result: QueryResult<CombinedAsset[]> = {
        success: true,
        data: combinedAssets,
      };

      return result;
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch assets',
        error: querierError.message,
      };
    }
  }

  /**
   * Get asset by ID
   */
  async getAssetById(
    assetId: string,
    options: AssetQueryOptions = {},
  ): Promise<QueryResult<CombinedAsset>> {
    try {
      const assetConfig = await this.getAssetConfigByIdFromMongoDB(assetId);
      if (!assetConfig) {
        return {
          success: false,
          message: 'Asset not found',
        };
      }

      const [onchainAsset, latestPrices] = await Promise.all([
        this.getAssetFromOnchain(assetConfig.assetAddress),
        options.withLatestPrices
          ? this.getLatestPricesForAsset(assetConfig.assetAddress)
          : Promise.resolve([]),
      ]);

      const combinedAsset = this.combineSingleAssetData(
        assetConfig,
        onchainAsset,
        latestPrices[0] || null,
        options.withConfig || false,
      );

      const result: QueryResult<CombinedAsset> = {
        success: true,
        data: combinedAsset,
      };

      return result;
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch asset',
        error: querierError.message,
      };
    }
  }

  // MongoDB data fetching methods
  private async getAssetConfigsFromMongoDB(): Promise<any[]> {
    try {
      return await AssetMetadataModel.find().sort({ createdAt: -1 });
    } catch (error) {
      throw createQuerierError(
        'Failed to fetch asset configs from MongoDB',
        'MONGODB_ERROR',
        500,
        error,
      );
    }
  }

  private async getAssetConfigFromMongoDB(assetAddress: string): Promise<any> {
    try {
      return await AssetMetadataModel.findOne({ assetAddress }).exec();
    } catch (error) {
      throw createQuerierError(
        'Failed to fetch asset config from MongoDB',
        'MONGODB_ERROR',
        500,
        error,
      );
    }
  }

  private async getAssetConfigByIdFromMongoDB(assetId: string): Promise<any> {
    try {
      return await AssetMetadataModel.findById(assetId).exec();
    } catch (error) {
      throw createQuerierError(
        'Failed to fetch asset config by ID from MongoDB',
        'MONGODB_ERROR',
        500,
        error,
      );
    }
  }

  private async getAssetConfigsByAddressFromMongoDB(assetAddresses: string[]): Promise<any[]> {
    try {
      return await AssetMetadataModel.find({ assetAddress: { $in: assetAddresses } }).exec();
    } catch (error) {
      throw createQuerierError(
        'Failed to fetch asset configs by addresses from MongoDB',
        'MONGODB_ERROR',
        500,
        error,
      );
    }
  }

  // Onchain data fetching methods
  private async getAssetsFromOnchain(): Promise<OnchainAsset[]> {
    try {
      return this.basktClient.getAllAssets();
    } catch (error) {
      throw createQuerierError('Failed to fetch assets from onchain', 'ONCHAIN_ERROR', 500, error);
    }
  }

  private async getAssetFromOnchain(assetAddress: string): Promise<any> {
    try {
      return this.basktClient.getAssetRaw(new PublicKey(assetAddress));
    } catch (error) {
      throw createQuerierError('Failed to fetch asset from onchain', 'ONCHAIN_ERROR', 500, error);
    }
  }

  // TimescaleDB data fetching methods
  private async getLatestPricesFromTimescaleDB(): Promise<any[]> {
    try {
      const prices = await AssetPrice.findAll({
        order: [['time', 'DESC']],
        limit: 100, // Adjust based on your needs
      });

      return prices.map((price: any) => ({
        id: price.asset_id,
        price: price.price,
        time: price.time,
      }));
    } catch (error) {
      throw createQuerierError(
        'Failed to fetch latest prices from TimescaleDB',
        'TIMESCALE_ERROR',
        500,
        error,
      );
    }
  }

  private async getLatestPricesForAsset(assetAddress: string): Promise<any[]> {
    try {
      const prices = await AssetPrice.findAll({
        where: { asset_id: assetAddress },
        order: [['time', 'DESC']],
        limit: 1,
      });

      return prices.map((price: any) => ({
        id: price.asset_id,
        price: price.price,
        time: price.time,
      }));
    } catch (error) {
      throw createQuerierError(
        'Failed to fetch latest prices for asset from TimescaleDB',
        'TIMESCALE_ERROR',
        500,
        error,
      );
    }
  }


  private async getLatestPricesForAssets(assetMetadata: any[]): Promise<any[]> {
    try {
      const prices = await fetchAssetPrices(assetMetadata.map((asset) => asset.priceConfig), assetMetadata.map((asset) => asset.assetAddress));
      return prices.map((price) => ({
        id: price.assetAddress,
        price: price.priceUSD,
        time: price.timestamp
      }));
    } catch (error) {
      throw createQuerierError(
        'Failed to fetch latest prices for assets from TimescaleDB',
        'TIMESCALE_ERROR',
        500,
        error,
      );
    }
  }

  // Data combination methods
  private combineAssetData(
    assetConfigs: any[],
    onchainAssets: any[],
    latestPrices: any[],
    withConfig: boolean,
  ): CombinedAsset[] {
    return assetConfigs
      .map((assetConfig) => {
        const matchingOnchainAsset = onchainAssets.find(
          (asset) => asset?.ticker?.toString() === assetConfig.ticker?.toString(),
        );
        const matchingPrice = latestPrices.find(
          (price) => price?.id === assetConfig._id?.toString(),
        );

        return this.combineSingleAssetData(
          assetConfig,
          matchingOnchainAsset,
          matchingPrice,
          withConfig,
        );
      })
      .filter((asset): asset is CombinedAsset => asset !== undefined);
  }

  private combineSingleAssetData(
    assetConfig: any,
    onchainAsset: any,
    latestPrice: any,
    withConfig: boolean,
  ): CombinedAsset | undefined {
    if (!assetConfig && !onchainAsset) {
      return undefined;
    }

    if (!assetConfig) {
      return {
        ticker: onchainAsset?.ticker || '',
        assetAddress: onchainAsset?.address?.toString() || '',
        logo: '',
        name: onchainAsset?.ticker || '',
        price: 0,
        priceRaw: 0,
        change24h: 0,
        account: onchainAsset,
        weight: 0,
        config: withConfig ? undefined : undefined,
        basktIds: [],
      };
    }

    const price = latestPrice?.price || 0;
    const change24h = assetConfig.priceMetrics?.change24h || 0;

    return {
      _id: assetConfig._id,
      ticker: onchainAsset?.ticker || assetConfig.ticker,
      assetAddress: onchainAsset?.address?.toString() || assetConfig.assetAddress,
      logo: assetConfig.logo || '',
      name: assetConfig.name || onchainAsset?.ticker || assetConfig.ticker,
      price,
      priceRaw: price,
      change24h,
      account: onchainAsset,
      weight: 0,
      config: withConfig
        ? {
            priceConfig: assetConfig.priceConfig,
            coingeckoId: assetConfig.coingeckoId,
          }
        : undefined,
      latestPrice,
      basktIds: assetConfig.basktIds || [],
    };
  }

  /**
   * Get asset performance statistics and cache stats
   */
  async getCacheStats(): Promise<QueryResult<AssetCacheStats>> {
    try {
      // Get basic asset counts
      const [assetConfigs, onchainAssets, latestPrices] = await Promise.all([
        this.getAssetConfigsFromMongoDB(),
        this.getAssetsFromOnchain(),
        this.getLatestPricesFromTimescaleDB(),
      ]);

      // Calculate performance metrics
      const totalAssets = assetConfigs.length;
      const totalOnchainAssets = onchainAssets.length;
      const totalPrices = latestPrices.length;

      // Get unique asset addresses
      const uniqueAssetAddresses = new Set([
        ...assetConfigs.map((asset: any) => asset.assetAddress).filter(Boolean),
        ...onchainAssets.map((asset: any) => asset?.address?.toString()).filter(Boolean),
      ]);

      // Calculate price coverage
      const assetsWithPrices = latestPrices.filter((price: any) =>
        assetConfigs.some((asset: any) => asset.assetAddress === price.id),
      ).length;

      const priceCoveragePercentage = totalAssets > 0 ? (assetsWithPrices / totalAssets) * 100 : 0;

      // Get recent activity (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentAssets = assetConfigs.filter(
        (asset: any) => asset.updatedAt && new Date(asset.updatedAt) > oneDayAgo,
      ).length;

      const stats = {
        totalAssets,
        totalOnchainAssets,
        totalPrices,
        uniqueAssetAddresses: uniqueAssetAddresses.size,
        assetsWithPrices,
        priceCoveragePercentage: Math.round(priceCoveragePercentage * 100) / 100,
        recentActivity24h: recentAssets,
        dataSources: {
          mongodb: totalAssets,
          onchain: totalOnchainAssets,
          timescale: totalPrices,
        },
        cacheStatus: {
          mongodb: 'active',
          onchain: 'active',
          timescale: 'active',
        },
        lastUpdated: new Date().toISOString(),
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch cache stats',
        error: querierError.message,
      };
    }
  }
}
