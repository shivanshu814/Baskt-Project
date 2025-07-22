import { BasktMetadataModel } from '../models/mongodb';
import { createQuerierError, handleQuerierError } from '../utils/error-handling';
import { QueryResult } from '../models/types';
import { AssetQuerier } from './asset.querier';
import { PriceQuerier } from './price.querier';
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
        this.assetQuerier.getAllAssets({ withLatestPrices: true, withConfig: true }),
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
            false,
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
          withLatestPrices: true,
          withConfig: true,
        }),
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

      const assetIds =
        onchainBaskt?.account?.currentAssetConfigs?.map((asset: any) =>
          asset.assetId?.toString(),
        ) || [];

      const combinedBaskt = await this.combineBasktData(
        onchainBaskt,
        basktMetadata,
        assetLookup,
        assetIds,
        false,
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
          withLatestPrices: true,
          withConfig: true,
        }),
      ]);

      // Create asset lookup map using asset.assetAddress as key
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
        false,
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
      const nav = basktResult.data.price;

      const result: QueryResult<BasktNAV> = {
        success: true,
        data: {
          nav: nav,
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

  /**
   * Calculate performance metrics from NAV history
   */
  private async calculatePerformanceMetrics(basktId: string): Promise<{
    daily: number;
    weekly: number;
    monthly: number;
    year: number;
  }> {
    try {
      const navHistoryResult = await this.priceQuerier.getBasktNavHistory(basktId);

      if (
        !navHistoryResult.success ||
        !navHistoryResult.data ||
        navHistoryResult.data.length === 0
      ) {
        return {
          daily: 0,
          weekly: 0,
          monthly: 0,
          year: 0,
        };
      }

      const navHistory = navHistoryResult.data
        .filter((entry) => entry.price !== null && entry.time !== null)
        .sort((a, b) => (b.time || 0) - (a.time || 0));

      if (navHistory.length === 0) {
        return {
          daily: 0,
          weekly: 0,
          monthly: 0,
          year: 0,
        };
      }

      const currentPrice = navHistory[0].price || 0;
      const now = Math.floor(Date.now() / 1000);

      // Calculate time periods
      const oneDayAgo = now - 24 * 60 * 60;
      const oneWeekAgo = now - 7 * 24 * 60 * 60;
      const oneMonthAgo = now - 30 * 24 * 60 * 60;
      const oneYearAgo = now - 365 * 24 * 60 * 60;

      // find prices at different time periods
      const findPriceAtTime = (targetTime: number): number | null => {
        const entry = navHistory.find((item) => (item.time || 0) <= targetTime);
        return entry?.price || null;
      };

      const dayAgoPrice = findPriceAtTime(oneDayAgo);
      const weekAgoPrice = findPriceAtTime(oneWeekAgo);
      const monthAgoPrice = findPriceAtTime(oneMonthAgo);
      const yearAgoPrice = findPriceAtTime(oneYearAgo);

      // calculate percentage changes
      const calculateChange = (oldPrice: number | null, newPrice: number): number => {
        if (!oldPrice || oldPrice === 0) return 0;
        return ((newPrice - oldPrice) / oldPrice) * 100;
      };

      return {
        daily: dayAgoPrice ? calculateChange(dayAgoPrice, currentPrice) : 0,
        weekly: weekAgoPrice ? calculateChange(weekAgoPrice, currentPrice) : 0,
        monthly: monthAgoPrice ? calculateChange(monthAgoPrice, currentPrice) : 0,
        year: yearAgoPrice ? calculateChange(yearAgoPrice, currentPrice) : 0,
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return {
        daily: 0,
        weekly: 0,
        monthly: 0,
        year: 0,
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
      basktMetadata?.basktId?.toString() || onchainBaskt?.account?.basktId?.toString();

    // Calculate NAV with proper logic from the original
    let price = new BN(0);
    try {
      if (assets.length > 0 && assets.every((asset: any) => asset && asset.price > 0)) {
        const currentAssetConfigs = assets.map((asset: any) => ({
          assetId: new PublicKey(asset.id),
          weight: new BN(asset.weight).mul(WEIGHT_PRECISION).divn(100),
          direction: Boolean(asset.direction),
          baselinePrice: new BN(asset.price),
        }));

        const baselineAssetConfigs = assets.map((asset: any) => ({
          assetId: new PublicKey(asset.id),
          weight: new BN(asset.weight).mul(WEIGHT_PRECISION).divn(100),
          direction: Boolean(asset.direction),
          baselinePrice: new BN(asset.baselinePrice),
        }));

        price = calculateNav(
          baselineAssetConfigs,
          currentAssetConfigs,
          new BN(onchainBaskt?.account?.baselineNav || 1000000),
        );
      }
    } catch (error) {
      if (onchainBaskt?.oracle?.price) {
        price = new BN(onchainBaskt.oracle.price);
      } else if (onchainBaskt?.account?.baselineNav) {
        price = new BN(onchainBaskt.account.baselineNav);
      } else {
        price = new BN(0);
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
      performance: await this.calculatePerformanceMetrics(basktId),
    };
  }
}
