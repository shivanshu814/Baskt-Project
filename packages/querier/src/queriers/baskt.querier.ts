import { BaseClient, calculateNav } from '@baskt/sdk';
import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { metadataManager } from '../models/metadata-manager';
import {
  BasktMetadataModel,
  BasktRebalanceHistoryModel,
  RebalanceRequestModel,
} from '../models/mongodb';
import { QueryResult } from '../models/types';
import { BasktMetadata, CombinedAsset } from '../types';
import { BasktNAV, BasktQueryOptions, CombinedBaskt } from '../types/baskt';
import { BasktRebalanceHistory, RebalanceRequestMetadata } from '../types/models';
import { handleQuerierError } from '../utils/error-handling';
import { toNumber } from '../utils/helpers';
import { AssetQuerier } from './asset.querier';
import { PriceQuerier } from './price.querier';

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

  private static instance: BasktQuerier;

  public static getInstance(basktClient: BaseClient): BasktQuerier {
    if (!BasktQuerier.instance) {
      BasktQuerier.instance = new BasktQuerier(basktClient);
    }
    return BasktQuerier.instance;
  }

  constructor(basktClient: BaseClient) {
    this.assetQuerier = AssetQuerier.getInstance(basktClient);
    this.priceQuerier = PriceQuerier.getInstance(basktClient);
    this.basktClient = basktClient;
  }

  /**
   * Get all baskts with asset integration
   */
  async getAllBaskts(
    options: BasktQueryOptions = {
      hidePrivateBaskts: true,
      userAddress: undefined,
    },
  ): Promise<QueryResult<CombinedBaskt[]>> {
    try {
      const query: any = {};
      if (options.userAddress) {
        query['creator'] = options.userAddress;
      }
      if(options.hidePrivateBaskts) {
        query['isPublic'] = true;
      }
      const [basktConfigs, allAssetsResult] = await Promise.all([
        BasktMetadataModel.find(query).sort({ createdAt: -1 }).lean<BasktMetadata[]>(),
        this.assetQuerier.getAllAssets({ withConfig: false }),
      ]);

      if (!basktConfigs || basktConfigs.length === 0) {
        return {
          success: false,
          data: [],
          message: 'No baskts found',
        };
      }

      // Create asset lookup map
      const assetLookup = new Map<string, CombinedAsset>();
      if (allAssetsResult.success && allAssetsResult.data) {
        allAssetsResult.data.forEach((asset: CombinedAsset) => {
          if (asset && asset.assetAddress) {
            assetLookup.set(asset.assetAddress, asset);
          }
        });
      }
      // Combine baskts with asset data
      const combinedBaskts = await Promise.all(
        basktConfigs.map(async (basktConfig) => {
          const result = await this.combineBasktData(basktConfig, assetLookup);
          return result;
        }),
      );

      const result: QueryResult<CombinedBaskt[]> = {
        success: true,
        data: combinedBaskts.filter(
          (baskt): baskt is CombinedBaskt => baskt !== null && baskt !== undefined,
        ),
      };

      return result;
    } catch (err) {
      const querierError = handleQuerierError(err);
      console.error('Error fetching baskts:', querierError);
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
  async getBasktByAddress(basktId: string): Promise<QueryResult<CombinedBaskt>> {
    try {
      const [basktMetadata, allAssetsResult] = await Promise.all([
        BasktMetadataModel.findOne({ basktId }).lean<BasktMetadata>(),
        this.assetQuerier.getAllAssets({
          withConfig: false,
        }),
      ]);

      if (!basktMetadata) {
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

      const combinedBaskt = await this.combineBasktData(basktMetadata, assetLookup);

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
  async getBasktByUID(basktUID: string): Promise<QueryResult<CombinedBaskt>> {
    try {
      const basktId = await this.basktClient.getBasktPDA(parseInt(basktUID));
      return this.getBasktByAddress(basktId.toString());
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
      const basktMetadata = await this.getBasktByAddress(basktId);
      return {
        success: true,
        data: {
          nav: basktMetadata.data?.price || 0,
        },
      };
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

  async getBasktByAssetId(assetId: string): Promise<QueryResult<BasktMetadata[]>> {
    const basktsForAssets = await BasktMetadataModel.find({
      currentAssetConfigs: {
        $elemMatch: {
          assetId: assetId,
        },
      },
    }).lean<BasktMetadata[]>();

    return {
      success: true,
      data: basktsForAssets,
    };
  }

  /**
   * Resync baskt metadata from on-chain data
   */
  async resyncBasktMetadata(basktId: string): Promise<void> {
    try {
      const basktAccount = await this.basktClient.getBasktAccount(new PublicKey(basktId));

      // Get asset metadata to map assetObjectIds using metadata manager directly
      const assetAddresses = basktAccount.currentAssetConfigs.map((config) =>
        config.assetId.toString(),
      );
      const assetMetadatas = await metadataManager.getAllAssets();

      // Create a map of asset address to asset metadata ID
      const assetIdMap = new Map<string, string>();
      assetMetadatas.forEach((asset) => {
        if (assetAddresses.includes(asset.assetAddress)) {
          assetIdMap.set(asset.assetAddress, asset._id?.toString() || '');
        }
      });

      // Create new baskt metadata entry with current timestamp
      // await metadataManager.updateBaskt(basktId, {
      //   uid: toNumber(basktAccount.uid),
      //   status: basktAccount.status,
      //   isPublic: basktAccount.isPublic,
      //   openPositions: toNumber(basktAccount.openPositions),
      //   lastRebalanceTime: toNumber(basktAccount.lastRebalanceTime),
      //   baselineNav: basktAccount.baselineNav.toString(),
      //   rebalancePeriod: toNumber(basktAccount.rebalancePeriod),
      //   config: {
      //     openingFeeBps: basktAccount.config.openingFeeBps ? toNumber(basktAccount.config.openingFeeBps) : undefined,
      //     closingFeeBps: basktAccount.config.closingFeeBps ? toNumber(basktAccount.config.closingFeeBps) : undefined,
      //     liquidationFeeBps: basktAccount.config.liquidationFeeBps ? toNumber(basktAccount.config.liquidationFeeBps) : undefined,
      //     minCollateralRatioBps: basktAccount.config.minCollateralRatioBps ? toNumber(basktAccount.config.minCollateralRatioBps) : undefined,
      //     liquidationThresholdBps: basktAccount.config.liquidationThresholdBps ? toNumber(basktAccount.config.liquidationThresholdBps) : undefined,
      //   },
      //   fundingIndex: {
      //     cumulativeIndex: basktAccount.fundingIndex.cumulativeIndex.toString(),
      //     lastUpdateTimestamp: toNumber(basktAccount.fundingIndex.lastUpdateTimestamp),
      //     currentRate: basktAccount.fundingIndex.currentRate.toString(),
      //   },
      //   rebalanceFeeIndex: {
      //     cumulativeIndex: basktAccount.rebalanceFeeIndex.cumulativeIndex.toString(),
      //     lastUpdateTimestamp: toNumber(basktAccount.rebalanceFeeIndex.lastUpdateTimestamp),
      //   },
      //   currentAssetConfigs: basktAccount.currentAssetConfigs.map(config => {
      //     const assetAddress = config.assetId.toString();
      //     const assetObjectId = assetIdMap.get(assetAddress);

      //     if (!assetObjectId) {
      //       console.warn(`Asset metadata not found for asset: ${assetAddress}`);
      //     }

      //     return {
      //       assetObjectId: assetObjectId || '', // Use empty string if not found, but log warning
      //       assetId: assetAddress,
      //       direction: config.direction,
      //       weight: toNumber(config.weight),
      //       baselinePrice: config.baselinePrice.toString(),
      //     };
      //   }),
      //   updatedAt: new Date(),
      // });

      console.log(`Baskt metadata resynced for baskt: ${basktId}`);
    } catch (error) {
      console.error('Failed to resync baskt metadata:', error);
      throw error;
    }
  }

  private computeNav(basktMetadata: BasktMetadata, assetLookup: Map<string, any>) {
    const baselineAssetConfigs = basktMetadata.currentAssetConfigs.map((asset: any) => ({
      assetId: new PublicKey(asset.assetId),
      weight: asset.weight,
      direction: asset.direction,
      baselinePrice: new BN(asset.baselinePrice),
    }));

    const currentAssetConfigs =
      basktMetadata.currentAssetConfigs?.map((asset: any) => {
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
      baselineAssetConfigs,
      currentAssetConfigs,
      new BN(basktMetadata?.baselineNav || 100 * 1e6),
    );
  }

  // Data combination methods
  private async combineBasktData(
    basktMetadata: BasktMetadata,
    assetLookup: Map<string, CombinedAsset>,
  ): Promise<CombinedBaskt | undefined> {
    if (!basktMetadata) {
      return undefined;
    }

    const assets =
      basktMetadata?.currentAssetConfigs?.map((asset: any) => {
        const assetId = asset.assetId.toString();
        const fetchedAsset = assetLookup.get(assetId);

        if (!fetchedAsset) {
          throw new Error(`Asset not found for assetId: ${assetId}`);
        }

        const assetData = {
          ...fetchedAsset,
          weight: (asset.weight * 100) / 10_000,
          direction: asset.direction,
          id: assetId,
          baselinePrice: asset.baselinePrice,
          volume24h: 0,
          marketCap: 0,
        };
        return assetData;
      }) || [];

    let price = new BN(0);

    try {
      price = this.computeNav(basktMetadata, assetLookup);
    } catch (error) {
      //TODO nshmadhani: handle this error
      console.error('Error calculating NAV:', error);
      price = new BN(0);
    }

    return {
      ...basktMetadata,
      assets: assets.map((asset) => ({
        ...asset,
        baselinePrice: asset.baselinePrice.toString(),
      })),
      price: toNumber(price),
      change24h: basktMetadata.stats.change24h ?? 0,
      aum: 0,
      sparkline: [],
      performance: {
        daily: basktMetadata.stats.change24h,
        weekly: basktMetadata.stats.change7d,
        monthly: basktMetadata.stats.change30d,
        year: basktMetadata.stats.change365d,
      },
    };
  }

  // Rebalance request methods
  async createRebalanceRequest(rebalanceRequest: RebalanceRequestMetadata): Promise<void> {
    await RebalanceRequestModel.create(rebalanceRequest);
  }

  async getRebalanceRequest(basktId: string, txSignature: string): Promise<any> {
    return await RebalanceRequestModel.findOne({ basktId, txSignature });
  }

  // Rebalance history methods
  async createRebalanceHistory(
    rebalanceHistory: Omit<BasktRebalanceHistory, '_id' | 'createdAt' | 'updatedAt'>,
  ): Promise<void> {
    await BasktRebalanceHistoryModel.create(rebalanceHistory);
  }

  async getRebalanceHistory(
    basktId: string,
    limit: number = 50,
  ): Promise<QueryResult<BasktRebalanceHistory[]>> {
    try {
      const history = await BasktRebalanceHistoryModel.find({ basktId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean<BasktRebalanceHistory[]>({ getters: true })
        .exec();

      const processedHistory = history.map((item) => ({
        ...item,
        _id: item._id?.toString() || '',
        baskt: item.baskt?.toString() || '',
      }));

      return {
        success: true,
        data: processedHistory as unknown as BasktRebalanceHistory[],
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get rebalance history',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getLatestRebalance(basktId: string): Promise<QueryResult<BasktRebalanceHistory | null>> {
    try {
      const latest = await BasktRebalanceHistoryModel.findOne({ basktId })
        .sort({ createdAt: -1 })
        .lean<BasktRebalanceHistory>({ getters: true })
        .exec();

      if (!latest) {
        return {
          success: true,
          data: null,
        };
      }

      const processedLatest = {
        ...latest,
        _id: latest._id?.toString() || '',
        baskt: latest.baskt?.toString() || '',
      };

      return {
        success: true,
        data: processedLatest as unknown as BasktRebalanceHistory,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get latest rebalance',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
