import { AssetMetadataModel } from '../models/mongodb';
import { createQuerierError, handleQuerierError } from '../utils/error-handling';
import { QueryResult } from '../models/types';
import { PublicKey } from '@solana/web3.js';
import { BaseClient, fetchAssetPrices } from '@baskt/sdk';
import {
  CombinedAsset,
  AssetCacheStats,
  AssetQueryOptions,
} from '../types/asset';
import {   AssetPrice, AssetPriceProviderConfig, OnchainAsset } from '@baskt/types';

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
    console.time('getAllAssets');
    try {
      const { withConfig = false} = options;

      // Fetch data from multiple sources
      const [assetConfigs, onchainAssets] = await Promise.all([
        this.getAssetConfigsFromMongoDB(),
        this.getAssetsFromOnchain(),
      ]);

      const livePrices = await this.getLivePricesForAssets(assetConfigs);

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
        livePrices,
        withConfig,
      );

      const result: QueryResult<CombinedAsset[]> = {
        success: true,
        data: combinedAssets,
      };

      console.timeEnd('getAllAssets');

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
      const [assetConfig, onchainAsset] = await Promise.all([
        this.getAssetConfigFromMongoDB(assetAddress),
        this.getAssetFromOnchain(assetAddress),
      ]);

      const livePrice = await this.getLivePricesForAssets([assetConfig]);

      if (!assetConfig || !onchainAsset) {
        return {
          success: false,
          message: 'Asset not found',
        };
      }

      const combinedAsset = this.combineSingleAssetData(
        assetConfig,
        onchainAsset,
        livePrice[0],
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
      const { withConfig = false } = options;

      // Fetch data from multiple sources
      const [assetConfigs, onchainAssets] = await Promise.all([
        this.getAssetConfigsByAddressFromMongoDB(assetAddresses),
        Promise.all(assetAddresses.map((addr) => this.getAssetFromOnchain(addr).catch(() => null))),
      ]);

      const livePrices = await this.getLivePricesForAssets(assetConfigs);


      if (!assetConfigs || assetConfigs.length === 0) {
        return {
          success: false,
          data: [],
          message: 'No assets found',
        };
      }

      // Combine data from all sources
      const combinedAssets = assetConfigs
        .map((assetConfig: any, index: number) => {
          const matchingOnchainAsset = onchainAssets[index];
          const livePrice = livePrices[index];

          return this.combineSingleAssetData(
            assetConfig,
            matchingOnchainAsset,
            livePrice,
            withConfig,
          );
        })
        .filter((asset: any): asset is CombinedAsset => asset !== undefined);

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

      const [onchainAsset, livePrices] = await Promise.all([
        this.getAssetFromOnchain(assetConfig.assetAddress),
        this.getLivePricesForAssets([assetConfig]),
      ]);

      const combinedAsset = this.combineSingleAssetData(
        assetConfig,
        onchainAsset,
        livePrices[0],
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


  private async getLivePricesForAssets(assetConfigs: any[]): Promise<(AssetPrice | null)[]> {
    try {
      return fetchAssetPrices(assetConfigs.map((asset) => asset.priceConfig as AssetPriceProviderConfig), assetConfigs.map((asset) => asset.assetAddress));
    } catch (error) {
      throw createQuerierError('Failed to fetch live prices for asset', 'TIMESCALE_ERROR', 500, error);
    }
  }

  // MongoDB data fetching methods
  private async getAssetConfigsFromMongoDB(): Promise<any[]> {
    try {
      const assets = await AssetMetadataModel.find({}).lean();
      return assets;
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

  // Data combination methods
  private combineAssetData(
    assetConfigs: any[],
    onchainAssets: OnchainAsset[],
    latestPrices: (AssetPrice | null)[],
    withConfig: boolean,
  ): CombinedAsset[] {
    return assetConfigs
      .map((assetConfig) => {
        const matchingOnchainAsset = onchainAssets.find(
          (asset) => asset?.ticker?.toString() === assetConfig.ticker?.toString(),
        );
        const livePrice = latestPrices.find((price: AssetPrice | null) => price?.assetAddress.toString()  === matchingOnchainAsset?.address.toString());

        if (!livePrice) {
          console.log('livePrice not found for asset', assetConfig.ticker);
          return undefined;
        }

        return this.combineSingleAssetData(
          assetConfig,
          matchingOnchainAsset,
          livePrice,
          withConfig,
        );
      })
      .filter((asset): asset is CombinedAsset => asset !== undefined);
  }

  private combineSingleAssetData(
    assetConfig: any,
    onchainAsset: any,
    livePrice: AssetPrice | null,
    withConfig: boolean,
  ): CombinedAsset | undefined {
    if (!assetConfig || !onchainAsset) {
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

    const price = Number(livePrice?.priceUSD);
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
      basktIds: assetConfig.basktIds || [],
    };
  }

}
