import { BaseClient } from '@baskt/sdk';
import { PositionStatus } from '@baskt/types';
import { QueryResult } from '../models/types';
import BN from 'bn.js';
import { CombinedPosition, PositionMetadata } from '../types';
import {
  AssetOpenInterestParams,
  AssetVolumeParams,
  BasktOpenInterestParams,
  BasktVolumeParams,
  OpenInterestData,
  VolumeData,
  VolumeResult,
} from '../types/metrics';
import { AssetQuerier } from './asset.querier';
import { PositionQuerier } from './position.querier';

/**
 * MetricsQuerier
 *
 * This class is responsible for fetching metrics for the application.
 * It is used to fetch metrics for the application.
 */

// TODO nshmadhaani Delete the unused code
export class MetricsQuerier {
  private assetQuerier: AssetQuerier;
  private basktClient: BaseClient;
  private basktQuerier: any;

  constructor(assetQuerier: AssetQuerier, basktQuerier?: any) {
    this.assetQuerier = assetQuerier;
    this.basktClient = assetQuerier.basktClient;
    this.basktQuerier = basktQuerier;
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

      const positionsResult = await PositionQuerier.getInstance(this.basktClient).getPositions({ basktId, isActive: positionStatus === PositionStatus.OPEN });
      const positions = positionsResult.data || [];

      return this.calculateOpentInterestFromPositions(positions);
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

      const positionsResult = await PositionQuerier.getInstance(this.basktClient).getPositions({ basktId });
      const positions = positionsResult.data || [];

      return {
        success: true,
        data: await this.calculateVolumeFromPositions(positions),
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

      const positionsResult = await PositionQuerier.getInstance(this.basktClient).getPositionByAssetId(assetId, PositionStatus.OPEN);
      const positions = positionsResult.data || [];

      return this.calculateOpentInterestFromPositions(positions);
    } catch (error) {
      console.error('Error fetching open interest:', error);
      return {
        success: false,
        error: 'Failed to fetch open interest',
      };
    }
  }


   // get open interest for an asset
  async getOpenInterestForAllAsset(): Promise<QueryResult<Map<string, OpenInterestData>>> {
    try {
      const openInterestData = await this.getPositionsForAllAssets();
      if (!openInterestData.success || !openInterestData.data) {
        throw new Error('Open interest data not found');
      }

      const openInterestDataMap = new Map<string, OpenInterestData>();

      for (const [assetAddress, positions] of openInterestData.data.entries()) {
        const oiData = await this.calculateOpentInterestFromPositions(positions);
        openInterestDataMap.set(assetAddress, oiData.data);
      }

      return {
        success: true,
        data: openInterestDataMap,
      };
    } catch (error) {
      console.error('Error fetching open interest:', error);
      return {
        success: false,
        error: 'Failed to fetch open interest',
      };
    }
  }

  private async getPositionsForAllAssets(): Promise<QueryResult<Map<string, PositionMetadata[]>>> {
    // Batch asset lookup optimization
    const assetFetchResult = await this.assetQuerier.getAllAssets();
     

    if (!assetFetchResult.success || !assetFetchResult.data) {
      throw new Error('Asset not found');
    }

    const uniqueBasktIds = [...new Set(assetFetchResult.data.map((asset) => asset.basktIds))].flat();

    const basktWithPositons = await Promise.all(uniqueBasktIds.map(async (basktId) => {
      const positions = await PositionQuerier.getInstance(this.basktClient).getPositions({ basktId, isActive: true });
      return {
        basktId,
        positions: positions.data || [],
      };
    }));

    const basktWithPositionsMap = new Map<string, CombinedPosition[]>(basktWithPositons.map((baskt) => [baskt.basktId, baskt.positions]));      

    const combinedAssets = assetFetchResult.data;
    const openInterestData: Map<string, PositionMetadata[]> = new Map();

    for (const asset of combinedAssets) {
      const positionsForAsset = asset.basktIds.map((basktId) => basktWithPositionsMap.get(basktId) || []).flat();
      openInterestData.set(asset.assetAddress, positionsForAsset);
    }

   return {  
     success: true,
     data: openInterestData,
   };
 }

  private async calculateOpentInterestFromPositions(positions: PositionMetadata[]) {
    const longPositions = positions.filter((p: any) => p.isLong);
    const shortPositions = positions.filter((p: any) => !p.isLong);

    const safeLongPositions = longPositions || [];
    const safeShortPositions = shortPositions || [];

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
        totalPositions: safeLongPositions.length + safeShortPositions.length,
        longOpenInterest,
        shortOpenInterest,
        longPositions: safeLongPositions,
        shortPositions: safeShortPositions,
      },
    };
  }

  private async calculateVolumeFromPositions(positions: PositionMetadata[]) {
    const longPositions = positions.filter((p: any) => p.isLong);
    const shortPositions = positions.filter((p: any) => !p.isLong);

    const longVolume = longPositions.reduce(
      (sum: any, pos: PositionMetadata) => {
        const remainingSize = new BN(pos.remainingSize);
        const entryPrice = new BN(pos.entryPrice);
        const usdcValue = remainingSize.mul(entryPrice).div(new BN(1000000));
        return sum.add(usdcValue);
      },
      new BN(0),
    );
    const shortVolume = shortPositions.reduce(
      (sum: BN, pos: PositionMetadata) => {
        const remainingSize = new BN(pos.remainingSize);
        const entryPrice = new BN(pos.entryPrice);
        const usdcValue = remainingSize.mul(entryPrice).div(new BN(1000000));
        return sum.add(usdcValue);
      },
      new BN(0),
    );

    return {
        totalVolume: Number(longVolume.add(shortVolume).toString()),
        totalPositions: positions.length,
        longVolume: Number(longVolume.toString()),
        shortVolume: Number(shortVolume.toString()),
      } as VolumeData;
    };
}


