import { metadataManager } from '../models/metadata-manager';
import { OnchainBasktAccount, PositionStatus } from '@baskt/types';
import { AssetQuerier } from './asset.querier';
import { BN } from 'bn.js';
import {
  VolumeResult,
  BasktOpenInterestParams,
  AssetOpenInterestParams,
  BasktVolumeParams,
  AssetVolumeParams,
  OpenInterestData,
} from '../types/metrics';
import { BaseClient } from '@baskt/sdk';
import { CombinedAsset } from '../types';
import { QueryResult } from '../models/types';

/**
 * MetricsQuerier
 *
 * This class is responsible for fetching metrics for the application.
 * It is used to fetch metrics for the application.
 */

export class MetricsQuerier {
  private assetQuerier: AssetQuerier;
  private basktClient: BaseClient;

  constructor(assetQuerier: AssetQuerier) {
    this.assetQuerier = assetQuerier;
    this.basktClient = assetQuerier.basktClient;
  }

  // get open interest for a baskt
  async getOpenInterestForBaskt(
    params: BasktOpenInterestParams,
  ): Promise<QueryResult<OpenInterestData>> {
    try {
      const { basktId, positionStatus = PositionStatus.OPEN } = params;

      if (!basktId) {
        throw new Error('Baskt ID is required');
      }

      const positions = await metadataManager.getAllPositions();
      const filteredPositions = positions.filter(
        (p: any) => p.basktId === basktId && p.status === positionStatus,
      );

      const longPositions = filteredPositions.filter((p: any) => p.isLong);
      const shortPositions = filteredPositions.filter((p: any) => !p.isLong);

      const longOpenInterest = longPositions.reduce((sum: any, pos: any) => {
        const contractSize = new BN(pos.size);
        const entryPrice = new BN(pos.entryPrice);
        const usdcValue = contractSize.mul(entryPrice).div(new BN(1000000));
        return sum + usdcValue.toNumber();
      }, 0);
      const shortOpenInterest = shortPositions.reduce((sum: any, pos: any) => {
        const contractSize = new BN(pos.size);
        const entryPrice = new BN(pos.entryPrice);
        const usdcValue = contractSize.mul(entryPrice).div(new BN(1000000));
        return sum + usdcValue.toNumber();
      }, 0);

      return {
        success: true,
        data: {
          totalOpenInterest: longOpenInterest + shortOpenInterest,
          totalPositions: positions.length,
          longOpenInterest,
          shortOpenInterest,
          longPositions,
          shortPositions,
        },
      };
    } catch (error) {
      console.error('Error fetching open interest:', error);
      return {
        success: false,
        error: 'Failed to fetch open interest',
      };
    }
  }

  // get volume for a baskt
  async getVolumeForBaskt(params: BasktVolumeParams): Promise<VolumeResult> {
    try {
      const { basktId } = params;

      if (!basktId) {
        throw new Error('Baskt ID is required');
      }

      const positions = await metadataManager.getAllPositions();
      const filteredPositions = positions.filter((p: any) => p.basktId === basktId);

      const longPositions = filteredPositions.filter((p: any) => p.isLong);
      const shortPositions = filteredPositions.filter((p: any) => !p.isLong);

      const longVolume = longPositions.reduce(
        (sum: any, pos: any) =>
          sum + Number(pos.size) * (pos.status === PositionStatus.OPEN ? 1 : 2),
        0,
      );
      const shortVolume = shortPositions.reduce(
        (sum: any, pos: any) =>
          sum + Number(pos.size) * (pos.status === PositionStatus.OPEN ? 1 : 2),
        0,
      );

      return {
        success: true,
        data: {
          totalVolume: longVolume + shortVolume,
          totalPositions: positions.length,
          longVolume,
          shortVolume,
        },
      };
    } catch (error) {
      console.error('Error fetching volume:', error);
      return {
        success: false,
        error: 'Failed to fetch volume',
      };
    }
  }

  // get open interest for an asset
  async getOpenInterestForAsset(
    params: AssetOpenInterestParams,
  ): Promise<QueryResult<OpenInterestData>> {
    try {
      const { assetId } = params;

      if (!assetId) {
        throw new Error('Asset ID is required');
      }

      // Batch asset lookup optimization
      const [assetFetchResult, positions] = await Promise.all([
        this.assetQuerier.getAssetByAddress(assetId),
        metadataManager.getAllPositions(),
      ]);

      if (!assetFetchResult.success || !assetFetchResult.data) {
        throw new Error('Asset not found');
      }

      return this.getOIForAssetInternal(assetFetchResult.data, positions);
    } catch (error) {
      console.error('Error fetching open interest:', error);
      return {
        success: false,
        error: 'Failed to fetch open interest',
      };
    }
  }

  // get open interest for an asset
  async getOpenInterestForAllAsset(): Promise<QueryResult<OpenInterestData[]>> {
    try {
      // Batch asset lookup optimization
      const [assetFetchResult, positions] = await Promise.all([
        this.assetQuerier.getAllAssets(),
        metadataManager.getAllPositions(),
      ]);

      if (!assetFetchResult.success || !assetFetchResult.data) {
        throw new Error('Asset not found');
      }

      const combinedAssets = assetFetchResult.data;

      const openInterestData: OpenInterestData[] = [];

      for (const asset of combinedAssets) {
        const oiData = await this.getOIForAssetInternal(asset, positions);
        if (!oiData.success || !oiData.data) {
          continue;
        }
        openInterestData.push(oiData.data);
      }

      return {
        success: true,
        data: openInterestData,
      };
    } catch (error) {
      console.error('Error fetching open interest:', error);
      return {
        success: false,
        error: 'Failed to fetch open interest',
      };
    }
  }

  // get volume for an asset
  async getVolumeForAsset(params: AssetVolumeParams): Promise<VolumeResult> {
    try {
      const { assetId } = params;

      if (!assetId) {
        throw new Error('Asset ID is required');
      }

      // Batch asset lookup optimization
      const allAssetsResult = await this.assetQuerier.getAllAssets({
        withLatestPrices: false,
        withConfig: false,
      });
      const assetLookup = new Map<string, any>();

      if (allAssetsResult.success && allAssetsResult.data) {
        allAssetsResult.data.forEach((asset: any) => {
          if (asset && asset.assetAddress) {
            assetLookup.set(asset.assetAddress, asset);
          }
          if (asset && asset._id) {
            assetLookup.set(asset._id.toString(), asset);
          }
        });
      }

      const assetMetadata = assetLookup.get(assetId);
      if (!assetMetadata) {
        throw new Error('Asset not found');
      }

      const basktIds = assetMetadata.basktIds || [];
      if (basktIds.length === 0) {
        return {
          success: true,
          data: {
            totalVolume: 0,
            totalPositions: 0,
            longVolume: 0,
            shortVolume: 0,
          },
        };
      }

      const positions = await metadataManager.getAllPositions();
      const filteredPositions = positions.filter((p) => basktIds.includes(p.basktId));

      const longPositions: any[] = [];
      const shortPositions: any[] = [];

      for (const pos of filteredPositions) {
        try {
          const isLong = pos.isLong;
          const weight = 10000;

          if (isLong) {
            longPositions.push({
              position: pos,
              size:
                ((Number(pos.size) * weight) / 10000) *
                (pos.status === PositionStatus.OPEN ? 1 : 2),
            });
          } else {
            shortPositions.push({
              position: pos,
              size:
                ((Number(pos.size) * weight) / 10000) *
                (pos.status === PositionStatus.OPEN ? 1 : 2),
            });
          }
        } catch (error) {
          console.error('Error processing position:', error);
        }
      }

      const longVolume = longPositions.reduce((sum: any, pos: any) => sum + pos.size, 0);
      const shortVolume = shortPositions.reduce((sum: any, pos: any) => sum + pos.size, 0);

      return {
        success: true,
        data: {
          totalVolume: longVolume + shortVolume,
          totalPositions: positions.length,
          longVolume,
          shortVolume,
        },
      };
    } catch (error) {
      console.error('Error fetching volume:', error);
      return {
        success: false,
        error: 'Failed to fetch volume',
      };
    }
  }

  private async getOIForAssetInternal(assetMetadata: CombinedAsset, positions: any[]) {
    const { longPositions, shortPositions } = await this.getPositionsForAsset(
      assetMetadata,
      positions,
    );

    if (!longPositions || !shortPositions) {
      return {
        success: true,
        data: {
          assetMetadata,
          totalOpenInterest: 0,
          totalPositions: 0,
          longOpenInterest: 0,
          shortOpenInterest: 0,
          longPositions: [],
          shortPositions: [],
        },
      };
    }

    const longOpenInterest = longPositions.reduce((sum: any, pos: any) => sum + pos.size, 0);
    const shortOpenInterest = shortPositions.reduce((sum: any, pos: any) => sum + pos.size, 0);

    return {
      success: true,
      data: {
        assetMetadata,
        totalOpenInterest: longOpenInterest + shortOpenInterest,
        totalPositions: longPositions.length + shortPositions.length,
        longOpenInterest,
        shortOpenInterest,
        longPositions,
        shortPositions,
      },
    };
  }

  async getPositionsForAsset(assetMetadata: CombinedAsset, positions: any[]) {
    const basktIds = assetMetadata.basktIds || [];
    if (basktIds.length === 0) {
      return {};
    }

    const filteredPositions = positions.filter(
      (p: any) => basktIds.includes(p.basktId) && p.status === PositionStatus.OPEN,
    );

    const baskts = (await this.basktClient.program.account.baskt.fetchMultiple(basktIds)).filter(
      (baskt: any) => baskt !== null,
    );
    const basktMap = new Map<string, OnchainBasktAccount>();
    baskts.forEach((baskt: any) => {
      basktMap.set(baskt.basktId.toString(), baskt);
    });

    const longPositions: any[] = [];
    const shortPositions: any[] = [];

    for (const pos of filteredPositions) {
      try {
        const baskt = basktMap.get(pos.basktId);
        if (!baskt) {
          throw new Error('Baskt not found');
        }

        const { weight, direction } = baskt.currentAssetConfigs.find(
          (assetConfig: any) => assetConfig.assetId.toString() === assetMetadata.assetAddress,
        ) || {  };

        if (!weight || !direction) {
          throw new Error('Asset not found in baskt');
        }

        const positionIsLong = pos.isLong;
        const isAssetLong = direction;

        // XOR logic: Long when both values are the same, Short when different
        let isLong = positionIsLong === isAssetLong;
        
        if (isLong) {
          longPositions.push({
            position: pos,
            size: (Number(pos.size) * weight.toNumber()) / 10000,
          });
        } else {
          shortPositions.push({
            position: pos,
            size: (Number(pos.size) * weight.toNumber()) / 10000,
          });
        }
      } catch (error) {
        console.error('Error processing position:', error);
      }
    }
    return {
      longPositions,
      shortPositions,
    };
  }
}
