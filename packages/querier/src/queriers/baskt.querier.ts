import { BasktMetadataModel } from '../models/mongodb';
import { createQuerierError, handleQuerierError } from '../utils/error-handling';
import { QueryResult } from '../models/types';
import { AssetQuerier } from './asset.querier';
import { BN } from 'bn.js';
import { BaseClient, calculateNav, WEIGHT_PRECISION, calculateLiveNav } from '@baskt/sdk';
import { OnchainAssetConfig, OnchainBasktAccount } from '@baskt/types';
import { PublicKey } from '@solana/web3.js';
import { CombinedBaskt, CombinedBasktAsset, BasktNAV, BasktQueryOptions } from '../types/baskt';

/**
 * Baskt Querier
 *
 * This file is used to get baskt data from MongoDB, Onchain.
 * It is used wherever baskt info is needed, like for asset, order, and position.
 * It has methods to fetch all baskts, and combine data.
 *
 */
export class BasktQuerier {
  private assetQuerier: AssetQuerier;
  private basktClient: BaseClient;

  constructor(assetQuerier: AssetQuerier, basktClient: BaseClient) {
    this.assetQuerier = assetQuerier;
    this.basktClient = basktClient;
  }

  /**
   * Get all baskts with asset integration
   */
  async getAllBaskts(options: BasktQueryOptions = {}): Promise<QueryResult<CombinedBaskt[]>> {
    try {
      const { withLatestPrices = false, withConfig = false } = options;

      // Fetch data from multiple sources
      const [basktConfigs, onchainBaskts, allAssetsResult] = await Promise.all([
        this.getBasktConfigsFromMongoDB(),
        this.getBasktsFromOnchain(),
        this.assetQuerier.getAllAssets({ withLatestPrices, withConfig }),
      ]);

      if (!basktConfigs || basktConfigs.length === 0) {
        return {
          success: false,
          data: [],
          message: 'No baskts found',
        };
      }

      // Create asset lookup map
      const assetLookup = new Map<string, any>();
      if (allAssetsResult.success && allAssetsResult.data) {
        allAssetsResult.data.forEach((asset: any) => {
          if (asset && asset.assetAddress) {
            assetLookup.set(asset.assetAddress, asset);
          }
        });
      }

      // Combine baskts with asset data
      const combinedBaskts = await Promise.all(
        onchainBaskts.map(async (onchainBaskt) => {
          const basktMetadata = basktConfigs.find(
            (b) => b.basktId === onchainBaskt.account?.basktId?.toString(),
          );

          if (!basktMetadata) {
            return null;
          }

          const assetIds =
            onchainBaskt.account?.currentAssetConfigs?.map((asset: any) =>
              asset.assetId?.toString(),
            ) || [];

          return await this.combineBasktData(
            onchainBaskt,
            basktMetadata,
            assetLookup,
            assetIds,
            withConfig,
          );
        }),
      );

      const result: QueryResult<CombinedBaskt[]> = {
        success: true,
        data: combinedBaskts.filter((baskt): baskt is CombinedBaskt => baskt !== undefined),
      };

      return result;
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch baskts',
        error: querierError.message,
      };
    }
  }

  /**
   * Get baskt by ID
   */
  async getBasktById(
    basktId: string,
    options: BasktQueryOptions = {},
  ): Promise<QueryResult<CombinedBaskt>> {
    try {
      const [basktMetadata, onchainBaskt, allAssetsResult] = await Promise.all([
        this.getBasktConfigByIdFromMongoDB(basktId),
        this.getBasktFromOnchain(basktId),
        this.assetQuerier.getAllAssets({
          withLatestPrices: options.withLatestPrices,
          withConfig: options.withConfig,
        }),
      ]);

      if (!basktMetadata && !onchainBaskt) {
        return {
          success: false,
          message: 'Baskt not found',
        };
      }

      // Create asset lookup map
      const assetLookup = new Map<string, any>();
      if (allAssetsResult.success && allAssetsResult.data) {
        allAssetsResult.data.forEach((asset: any) => {
          if (asset && asset.assetAddress) {
            assetLookup.set(asset.assetAddress, asset);
          }
        });
      }

      const assetIds =
        onchainBaskt?.account?.currentAssetConfigs?.map((asset: any) =>
          asset.assetId?.toString(),
        ) || [];

      const combinedBaskt = await this.combineBasktData(
        onchainBaskt,
        basktMetadata,
        assetLookup,
        assetIds,
        options.withConfig || false,
      );

      const result: QueryResult<CombinedBaskt> = {
        success: true,
        data: combinedBaskt,
      };

      return result;
    } catch (error) {
      console.error('Error fetching baskt metadata:', error);
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch baskt',
        error: querierError.message,
      };
    }
  }

  /**
   * Get baskt by name
   */
  async getBasktByName(
    basktName: string,
    options: BasktQueryOptions = {},
  ): Promise<QueryResult<CombinedBaskt>> {
    try {
      const basktMetadata = await this.getBasktConfigByNameFromMongoDB(basktName);
      if (!basktMetadata) {
        return {
          success: false,
          message: 'Baskt not found',
        };
      }

      const [onchainBaskt, allAssetsResult] = await Promise.all([
        this.getBasktFromOnchain(basktMetadata.basktId),
        this.assetQuerier.getAllAssets({
          withLatestPrices: options.withLatestPrices,
          withConfig: options.withConfig,
        }),
      ]);

      // Create asset lookup map
      const assetLookup = new Map<string, any>();
      if (allAssetsResult.success && allAssetsResult.data) {
        allAssetsResult.data.forEach((asset: any) => {
          if (asset && asset.assetAddress) {
            assetLookup.set(asset.assetAddress, asset);
          }
        });
      }

      const assetIds =
        onchainBaskt?.account?.currentAssetConfigs?.map((asset: any) =>
          asset.assetId?.toString(),
        ) || [];

      const combinedBaskt = await this.combineBasktData(
        onchainBaskt,
        basktMetadata,
        assetLookup,
        assetIds,
        options.withConfig || false,
      );

      const result: QueryResult<CombinedBaskt> = {
        success: true,
        data: combinedBaskt,
      };

      return result;
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch baskt',
        error: querierError.message,
      };
    }
  }

  /**
   * Get baskt NAV
   */
  async getBasktNAV(basktId: string): Promise<QueryResult<BasktNAV>> {
    try {
      const basktResult = await this.getBasktById(basktId);
      if (!basktResult.success || !basktResult.data) {
        return {
          success: false,
          message: 'Baskt not found',
        };
      }

      const result: QueryResult<BasktNAV> = {
        success: true,
        data: {
          nav: basktResult.data.price,
        },
      };

      return result;
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch baskt NAV',
        error: querierError.message,
      };
    }
  }

  // MongoDB data fetching methods
  private async getBasktConfigsFromMongoDB(): Promise<any[]> {
    try {
      return await BasktMetadataModel.find().sort({ createdAt: -1 });
    } catch (error) {
      throw createQuerierError(
        'Failed to fetch baskt configs from MongoDB',
        'MONGODB_ERROR',
        500,
        error,
      );
    }
  }

  private async getBasktConfigByIdFromMongoDB(basktId: string): Promise<any> {
    try {
      return await BasktMetadataModel.findOne({ basktId }).exec();
    } catch (error) {
      throw createQuerierError(
        'Failed to fetch baskt config by ID from MongoDB',
        'MONGODB_ERROR',
        500,
        error,
      );
    }
  }

  private async getBasktConfigByNameFromMongoDB(basktName: string): Promise<any> {
    try {
      // Try exact match first
      let basktMetadata = await BasktMetadataModel.findOne({ name: basktName }).exec();

      if (!basktMetadata) {
        // Try case-insensitive search
        basktMetadata = await BasktMetadataModel.findOne({
          name: { $regex: new RegExp(`^${basktName}$`, 'i') },
        }).exec();
      }

      return basktMetadata;
    } catch (error) {
      throw createQuerierError(
        'Failed to fetch baskt config by name from MongoDB',
        'MONGODB_ERROR',
        500,
        error,
      );
    }
  }

  // Onchain data fetching methods
  private async getBasktsFromOnchain(): Promise<any[]> {
    try {
      return this.basktClient.getAllBaskts();
    } catch (error) {
      throw createQuerierError('Failed to fetch baskts from onchain', 'ONCHAIN_ERROR', 500, error);
    }
  }

  private async getBasktFromOnchain(basktId: string): Promise<any> {
    try {
      return this.basktClient.getBaskt(new PublicKey(basktId));
    } catch (error) {
        throw createQuerierError('Failed to fetch baskt from onchain', 'ONCHAIN_ERROR', 500, error);
    }
  }

  // Data combination methods
  private async combineBasktData(
    onchainBaskt: any,
    basktMetadata: any,
    assetLookup: Map<string, any>,
    assetIds: string[],
    withConfig: boolean,
  ): Promise<CombinedBaskt | undefined> {
    if (!onchainBaskt && !basktMetadata) {
      return undefined;
    }

    // Get assets for this baskt using the same logic as the original
    const currentAssetConfigs =
      onchainBaskt?.currentAssetConfigs || onchainBaskt?.account?.currentAssetConfigs;

    const assets =
      currentAssetConfigs?.map((asset: any) => {
        const assetId = asset.assetId.toString();
        const fetchedAsset = assetLookup.get(assetId);

        return {
          ...(fetchedAsset || {}),
          weight: (asset.weight.toNumber() * 100) / 10_000,
          direction: asset.direction,
          id: assetId,
          baselinePrice: asset.baselinePrice.toNumber(),
          volume24h: 0,
          marketCap: 0,
        };
      }) || [];

    const basktId =
      basktMetadata?.basktId?.toString() || onchainBaskt?.account?.basktId?.toString();

    // Calculate NAV with proper logic from the original
    let price = new BN(0);
    try {
      if (assets.length > 0 && assets.every((asset: any) => asset && asset.price > 0)) {
        const assetsWithPriceConfig = assets.filter((asset: any) => asset.config?.priceConfig);

        if (assetsWithPriceConfig.length === 0) {
          throw new Error('No price config available');
        }

        const basktAssets = assetsWithPriceConfig.map((asset: any) => {
          const weightBN = new BN(asset.weight).mul(WEIGHT_PRECISION).divn(100);
          return {
            assetId: asset.id,
            weight: weightBN,
            direction: asset.direction ? 1 : 0,
            baselinePrice: new BN(asset.baselinePrice),
            priceConfig: asset.config.priceConfig,
          };
        });

        const { liveNav } = await calculateLiveNav(
          basktAssets,
          new BN(onchainBaskt?.account?.baselineNav || 0),
        );

        price = liveNav;
      }
    } catch (error) {
      // Fallback to calculateNav if calculateLiveNav fails
      const formattedAssets = assets.map(
        (asset: any) =>
          ({
            assetId: new PublicKey(asset.id),
            direction: asset.direction,
            weight: new BN(asset.weight).mul(WEIGHT_PRECISION).divn(100),
            baselinePrice: new BN(asset.baselinePrice),
          } as OnchainAssetConfig),
      );

      try {
        price = calculateNav(
          onchainBaskt?.account?.currentAssetConfigs?.map((asset: any) => ({
            ...asset,
          })) || [],
          formattedAssets,
          new BN(onchainBaskt?.account?.baselineNav || 0),
        );
      } catch (fallbackError) {
        console.error('Error calculating NAV:', fallbackError);
        if (onchainBaskt?.oracle?.price) {
          price = new BN(onchainBaskt.oracle.price);
        } else if (onchainBaskt?.baselineNav) {
          price = new BN(onchainBaskt.baselineNav);
        } else {
          price = new BN(0);
        }
      }
    }

    if (price.isZero() && onchainBaskt?.oracle?.price) {
      price = new BN(onchainBaskt.oracle.price);
    }

    // Build final result with proper account structure conversion
    const status = onchainBaskt?.status || {};
    const account = (onchainBaskt?.account || onchainBaskt || {}) as OnchainBasktAccount;

    return {
      _id: basktMetadata?._id,
      basktId,
      name: basktMetadata?.name || '',
      creator: basktMetadata?.creator || '',
      rebalancePeriod: basktMetadata?.rebalancePeriod,
      txSignature: basktMetadata?.txSignature,
      assets,
      totalAssets: assets.length,
      price: price.toNumber(),
      change24h: 0,
      aum: 0,
      sparkline: [],
      account: {
        ...account,
        creationTime: account?.creationTime?.toString() || '',
        lastRebalanceTime: account?.lastRebalanceTime?.toString() || '',
        baselineNav: account?.baselineNav?.toString() || '0',
        currentAssetConfigs:
          account?.currentAssetConfigs?.map((asset: any) => ({
            ...asset,
            weight: asset?.weight?.toString() || '0',
            baselinePrice: asset?.baselinePrice?.toString() || '0',
          })) || [],
        oracle: {
          ...account?.oracle,
          price: account?.oracle?.price?.toString() || '0',
          publishTime: account?.oracle?.publishTime?.toString() || '0',
        },
        isActive: status?.['active'] || false,
      },
      creationDate: basktMetadata?.creationDate || new Date().toISOString(),
      priceHistory: { daily: [] }, // Placeholder
      performance: {
        daily: 2.5,
        weekly: 5.2,
        monthly: 12.8,
        year: 45.6,
      },
    };
  }
}
