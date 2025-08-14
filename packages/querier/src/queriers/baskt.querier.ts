import { BasktMetadataModel } from '../models/mongodb';
import { createQuerierError, handleQuerierError } from '../utils/error-handling';
import { QueryResult } from '../models/types';
import { AssetQuerier } from './asset.querier';
import { PriceQuerier } from './price.querier';
import { BN } from 'bn.js';
import { BaseClient, calculateNav,  calculateLiveNav } from '@baskt/sdk';
import { BasktStatus, OnchainAssetConfig, OnchainBasktAccount } from '@baskt/types';
import { PublicKey } from '@solana/web3.js';
import { CombinedBaskt,  BasktNAV, BasktQueryOptions, BasktPerformance } from '../types/baskt';

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
  private priceQuerier: PriceQuerier;
  private basktClient: BaseClient;

  constructor(assetQuerier: AssetQuerier, priceQuerier: PriceQuerier, basktClient: BaseClient) {
    this.assetQuerier = assetQuerier;
    this.priceQuerier = priceQuerier;
    this.basktClient = basktClient;
  }

  /**
   * Get all baskts with asset integration
   */
  async getAllBaskts(options: BasktQueryOptions = {}): Promise<QueryResult<CombinedBaskt[]>> {
    try {
      // Fetch data from multiple sources
      const [basktConfigs, onchainBaskts, allAssetsResult] = await Promise.all([
        this.getBasktConfigsFromMongoDB(),
        this.getBasktsFromOnchain(),
        this.assetQuerier.getAllAssets({ withConfig: true }),
      ]);
      const performanceMap = options.withPerformance ? await this.priceQuerier.getBatchBasktPerformanceOptimized(onchainBaskts.map(baskt => baskt.basktId?.toString() || '')) : null;

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
            (b) => b.basktId === onchainBaskt.basktId?.toString(),
          );

          if (!basktMetadata) {
            return null;
          }
          const performance = performanceMap?.get(onchainBaskt.basktId?.toString());

          const result = await this.combineBasktData(
            onchainBaskt,
            basktMetadata,
            assetLookup,
            performance || null,
          );
          return result;
        })
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
      const [basktMetadata, onchainBaskt, allAssetsResult, performance] = await Promise.all([
        this.getBasktConfigByIdFromMongoDB(basktId),
        this.getBasktFromOnchain(basktId),
        this.assetQuerier.getAllAssets({
          withConfig: true,
        }),
        options.withPerformance ? this.priceQuerier.getBasktPerformanceOptimized(basktId) : null,
      ]);


      if (!basktMetadata && !onchainBaskt) {
        return {
          success: false,
          message: 'Baskt not found',
        };
      }

      // Create asset lookup map using asset.assetAddress as key
      const assetLookup = new Map<string, any>();
      if (allAssetsResult.success && allAssetsResult.data) {
        allAssetsResult.data.forEach((asset: any) => {
          if (asset && asset.assetAddress) {
            assetLookup.set(asset.assetAddress, asset);
          }
        });
      }

      const combinedBaskt = await this.combineBasktData(
        onchainBaskt,
        basktMetadata,
        assetLookup,
        performance,
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
      // TODO we will change this later on
      const basktId = await this.basktClient.getBasktPDA(parseInt(basktName));
      return this.getBasktById(basktId.toString(), options);
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
      const [onchainBaskt, allAssetsResult] = await Promise.all([
        this.getBasktFromOnchain(basktId),
        this.assetQuerier.getAllAssets({
          withConfig: true,
        }),
      ]);


      if (!onchainBaskt) {
        return {
          success: false,
          message: 'Baskt not found',
        };
      }

      // Create asset lookup map using asset.assetAddress as key
      const assetLookup = new Map<string, any>();
      if (allAssetsResult.success && allAssetsResult.data) {
        allAssetsResult.data.forEach((asset: any) => {
          if (asset && asset.assetAddress) {
            assetLookup.set(asset.assetAddress, asset);
          }
        });
      }

      const nav = this.computeNav(onchainBaskt, assetLookup);

      const result: QueryResult<BasktNAV> = {
        success: true,
        data: {
          nav: nav.toNumber(),
        },
      };

      return result;
    } catch (error) {
      console.error('Error fetching baskt NAV:', error);
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch baskt NAV',
        error: querierError.message,
      };
    }
  }

  private computeNav(onchainBaskt: OnchainBasktAccount, assetLookup: Map<string, any>) {
    const currentAssetConfigs =
      onchainBaskt.currentAssetConfigs?.map((asset: any) => {
        const assetId = asset.assetId;
        const fetchedAsset = assetLookup.get(assetId.toString());

        const assetData = {
          assetId,
          weight: asset.weight,
          direction: asset.direction,
          baselinePrice: new BN(fetchedAsset.price),
        };
        return assetData;
      }) || [];


    return calculateNav(
      onchainBaskt.currentAssetConfigs,
      currentAssetConfigs,
      new BN(onchainBaskt?.baselineNav || 100 * 1e6),
    );
  }

  // MongoDB data fetching methods
  private async getBasktConfigsFromMongoDB(): Promise<any[]> {
    try {
      const basktConfigs = await BasktMetadataModel.find().sort({ createdAt: -1 });
      return basktConfigs;
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
      const basktMetadata = await BasktMetadataModel.findOne({ basktId }).exec();
      return basktMetadata;
    } catch (error) {
      throw createQuerierError(
        'Failed to fetch baskt config by ID from MongoDB',
        'MONGODB_ERROR',
        500,
        error,
      );
    }
  }

  // Onchain data fetching methods
  private async getBasktsFromOnchain(): Promise<any[]> {
    try {
      const onchainBaskts = await this.basktClient.getAllBaskts();
      return onchainBaskts;
    } catch (error) {
      throw createQuerierError('Failed to fetch baskts from onchain', 'ONCHAIN_ERROR', 500, error);
    }
  }

  private async getBasktFromOnchain(basktId: string): Promise<any> {
    try {
      return this.basktClient.getBasktAccount(new PublicKey(basktId));
    } catch (error) {
      throw createQuerierError('Failed to fetch baskt from onchain', 'ONCHAIN_ERROR', 500, error);
    }
  }

  // Data combination methods
  private async combineBasktData(
    onchainBaskt: OnchainBasktAccount,
    basktMetadata: any,
    assetLookup: Map<string, any>,
    performance: BasktPerformance | null,
  ): Promise<CombinedBaskt | undefined> {
    if (!onchainBaskt && !basktMetadata) {
      return undefined;
    }

    // Get assets for this baskt using the same logic as the original
    const currentAssetConfigs =
      onchainBaskt?.currentAssetConfigs || onchainBaskt?.currentAssetConfigs;

    const assets =
      currentAssetConfigs?.map((asset: any) => {
        const assetId = asset.assetId.toString();
        const fetchedAsset = assetLookup.get(assetId);

        const assetData = {
          ...(fetchedAsset || {}),
          weight: (asset.weight.toNumber() * 100) / 10_000,
          direction: asset.direction,
          id: assetId,
          baselinePrice: asset.baselinePrice.toNumber(),
          volume24h: 0,
          marketCap: 0,
        };
        return assetData;
      }) || [];

    const basktId =
      basktMetadata?.basktId?.toString() || onchainBaskt?.basktId?.toString();

    // Calculate NAV with proper logic from the original
    let price = new BN(0);
    const status = onchainBaskt?.status;
    const isActive = status === BasktStatus.Active;

    try {
      price = this.computeNav(onchainBaskt, assetLookup);
    } catch (error) {
      //TODO nshmadhani: handle this error
      //console.error('Error calculating NAV:', error);
      price = new BN(0);
    }

    // Build final result with proper account structure conversion
    const account = (onchainBaskt || {}) as OnchainBasktAccount;

    return {
      _id: basktMetadata?._id,
      basktId,
      name: basktMetadata?.name || '',
      creator: basktMetadata?.creator || '',
      txSignature: basktMetadata?.txSignature,
      assets,
      totalAssets: assets.length,
      price: price.toNumber(),
      change24h: 0,
      aum: 0,
      sparkline: [],
      account: {
        ...account,
        fundingIndex: {
          cumulativeIndex: account?.fundingIndex?.cumulativeIndex?.toString() || '0',
          lastUpdateTimestamp: account?.fundingIndex?.lastUpdateTimestamp?.toString() || '0',
          currentRate: account?.fundingIndex?.currentRate?.toString() || '0',
        },
        basktRebalancePeriod: account?.basktRebalancePeriod?.toString() || '0',
        lastRebalanceTime: account?.lastRebalanceTime?.toString() || '',
        baselineNav: account?.baselineNav?.toString() || '0',
        currentAssetConfigs:
          account?.currentAssetConfigs?.map((asset: any) => ({
            ...asset,
            weight: asset?.weight?.toString() || '0',
            baselinePrice: asset?.baselinePrice?.toString() || '0',
          })) || [],
        isActive: isActive,
      },
      creationDate: basktMetadata?.creationDate || new Date().toISOString(),
      priceHistory: { daily: [] }, // Placeholder
      performance: performance || {
        daily: 0,
        weekly: 0,
        monthly: 0,
        year: 0,
      },
    };
  }
}
