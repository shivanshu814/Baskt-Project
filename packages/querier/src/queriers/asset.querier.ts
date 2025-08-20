import { AssetMetadataModel } from '../models/mongodb';
import { createQuerierError, handleQuerierError } from '../utils/error-handling';
import { QueryResult } from '../models/types';
import { BaseClient } from '@baskt/sdk';
import {
  CombinedAsset,
  AssetQueryOptions,
} from '../types/asset';
import {   AssetPrice, AssetPriceProviderConfig } from '@baskt/types';
import { fetchAssetPrices } from '../helpers/pricing';
import { AssetMetadata } from '../types/models';

/**
 * Asset Querier
 *
 * This class provides methods to query the asset data from the MongoDB.
 * It is used to get the asset data for the baskt, asset, order, position, access code, and authorized wallet models.
 *
 */
export class AssetQuerier {
  public basktClient: BaseClient;
  private static instance: AssetQuerier;

  public static getInstance(basktClient: BaseClient): AssetQuerier {
    if (!AssetQuerier.instance) {
      AssetQuerier.instance = new AssetQuerier(basktClient);
    }
    return AssetQuerier.instance;
  }

  constructor(basktClient: BaseClient) {
    this.basktClient = basktClient;
  }

  /**
   * Get all assets with optional price and config data
   */
  async getAllAssets(options: AssetQueryOptions = {}): Promise<QueryResult<CombinedAsset[]>> {
    try {
      const { withConfig = false} = options;

      // Fetch data from multiple sources
      const assetMetadatas = await this.getAssetMetadata([]); 

      const livePrices = await this.getLivePricesForAssets(assetMetadatas);

      if (!assetMetadatas || assetMetadatas.length === 0) {
        return {
          success: false,
          data: [],
          message: 'No assets found',
        };
      }

      // Combine data from all sources
      const combinedAssets = this.combineAssetData(
        assetMetadatas,
        livePrices,
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
   * Get multiple assets by their addresses
   */
  async getAssetsByAddress(
    assetAddresses: string[],
    options: AssetQueryOptions = {},
  ): Promise<QueryResult<CombinedAsset[]>> {
    try {
      const { withConfig = false } = options;

      // Fetch data from multiple sources
      const assetMetadatas = await this.getAssetMetadata(assetAddresses);
      const livePrices = await this.getLivePricesForAssets(assetMetadatas);


      if (!assetMetadatas || assetMetadatas.length === 0) {
        return {
          success: false,
          data: [],
          message: 'No assets found',
        };
      }

      // Combine data from all sources
      const combinedAssets = assetMetadatas
        .map((assetMetadata: any, index: number) => {
          const livePrice = livePrices[index];

          return this.combineSingleAssetData(
            assetMetadata,
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

  private async getAssetMetadata(assetAddresses: string[]): Promise<AssetMetadata[]> {
    const filter = assetAddresses.length > 0 ? { assetAddress: { $in: assetAddresses } } : {};
    return await AssetMetadataModel.find(filter).lean<AssetMetadata[]>();
  }

  private async getLivePricesForAssets(assetMetadatas: any[]): Promise<(AssetPrice | null)[]> {
    try {
      return fetchAssetPrices(assetMetadatas.map((asset) => asset.priceConfig as AssetPriceProviderConfig), assetMetadatas.map((asset) => asset.assetAddress));
    } catch (error) {
      throw createQuerierError('Failed to fetch live prices for asset', 'TIMESCALE_ERROR', 500, error);
    }
  }

  // Data combination methods
  private combineAssetData(
    assetMetadatas: any[],
    latestPrices: (AssetPrice | null)[],
    withConfig: boolean,
  ): CombinedAsset[] {
    return assetMetadatas
      .map((assetMetadata) => {
        const livePrice = latestPrices.find((price: AssetPrice | null) => price?.assetAddress.toString()  === assetMetadata.assetAddress);

        if (!livePrice) {
          console.log('livePrice not found for asset', assetMetadata.ticker);
          return undefined;
        }

        return this.combineSingleAssetData(
          assetMetadata,
          livePrice,
          withConfig,
        );
      })
      .filter((asset): asset is CombinedAsset => asset !== undefined);
  }

  private combineSingleAssetData(
    assetMetadata: AssetMetadata,
    livePrice: AssetPrice | null,
    withConfig: boolean,
  ): CombinedAsset | undefined {
    if (!assetMetadata) {
      return undefined;
    }

    if (!withConfig) {
      assetMetadata.priceConfig = {
        provider: {
          id: '',
          chain: '',
          name: '',
        },
        twp: {
          seconds: 0,
        },
        updateFrequencySeconds: 0,
        units: 1,
      };
    }

    return {
      ...assetMetadata,
      price: Number(livePrice?.priceUSD),
      change24h: 0,
    } as CombinedAsset;
  }



}
