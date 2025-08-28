import { BaseClient, BPS_DIVISOR, PRICE_PRECISION } from '@baskt/sdk';
import { BasktStatus, PositionStatus } from '@baskt/types';
import { QueryResult } from '../models/types';
import BN from 'bn.js';
import { CombinedBaskt, CombinedPosition, PositionMetadata } from '../types';
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
import { BasktQuerier } from './baskt.querier';


interface ModifiedPosition extends PositionMetadata {
  currentPrice: number;
}
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
  private basktQuerier: BasktQuerier;


  constructor(basktClient: BaseClient) {
    this.basktClient = basktClient;
    this.assetQuerier = AssetQuerier.getInstance(basktClient) ;
    this.basktQuerier = BasktQuerier.getInstance(basktClient);
  }

  // Fixed method name and optimized implementation
  async getOpenInterestForAllAssets(): Promise<QueryResult<{ [key: string]: OpenInterestData }>> {
    try {

      const [
        positionsResult,
        assetFetchResult,
        basktResults,
      ] = await Promise.all([
        PositionQuerier.getInstance(this.basktClient).getPositions({ isActive: true }),
        this.assetQuerier.getAllAssets(),
        this.basktQuerier.getAllBaskts({
          hidePrivateBaskts: false,
          status: BasktStatus.Active,
        }),
      ]);

      if (!positionsResult.success || !positionsResult.data) {
        throw new Error('Failed to fetch positions');
      }

      if (!assetFetchResult.success || !assetFetchResult.data) {
        throw new Error('Failed to fetch assets');
      }

      if (!basktResults.success || !basktResults.data) {
        throw new Error('Failed to fetch baskts');
      }

      const basktsWithPositions = new Map<string, {
        baskt: CombinedBaskt,
        positions: ModifiedPosition[]
      }>();

      for (const position of positionsResult.data) {
        const baskt = basktResults.data.find((baskt: CombinedBaskt) => baskt.basktId === position.basktAddress);
        if (baskt) {
          const basktWithPositions = basktsWithPositions.get(position.basktAddress) || { baskt, positions: [] };
          const modifiedPosition: ModifiedPosition = {
            ...position,
            currentPrice: baskt.price,
          };
          basktWithPositions.positions.push(modifiedPosition);
          basktsWithPositions.set(position.basktAddress, basktWithPositions);
        }
      }

      let openInterestDataMap = new Map<string, OpenInterestData>();

      for (const [basktAddress, basktWithPositions] of basktsWithPositions) {
        const assetConfigs = basktWithPositions.baskt.assets;
        for(const assetConfig of assetConfigs) {;
          const oiResult = this.calculateOpenInterestFromPositions(basktWithPositions.positions, assetConfig.direction, assetConfig.weight);

          const currentOI = openInterestDataMap.get(assetConfig.assetAddress) || {
            totalOpenInterest: 0,
            totalPositions: 0,
            longOpenInterest: 0,
            shortOpenInterest: 0,
            longPositions: [],
            shortPositions: [],
          };
          openInterestDataMap.set(assetConfig.assetAddress, {
            totalOpenInterest: currentOI.totalOpenInterest + oiResult.totalOpenInterest,
            totalPositions: currentOI.totalPositions + oiResult.totalPositions,
            longOpenInterest: currentOI.longOpenInterest + oiResult.longOpenInterest,
            shortOpenInterest: currentOI.shortOpenInterest + oiResult.shortOpenInterest,
            longPositions: currentOI.longPositions.concat(oiResult.longPositions),
            shortPositions: currentOI.shortPositions.concat(oiResult.shortPositions),
          });
        }
      }


      return {
        success: true,
        data: Object.fromEntries(openInterestDataMap),
      };
    } catch (error) {
      console.error('Error fetching open interest for all assets:', error);
      return {
        success: false,
        error: 'Failed to fetch open interest for all assets',
      };
    }
  }

  // Optimized calculation method with reduced duplication
  private calculateOpenInterestFromPositions(positions: ModifiedPosition[], assetDirection: boolean, weight: number): OpenInterestData {
    try {

      
      const longPositions = positions.filter((p) => p.isLong === assetDirection);
      const shortPositions = positions.filter((p) => p.isLong !== assetDirection);

      // Use a generic calculator function to reduce duplication
      const calculateInterest = (positionList: ModifiedPosition[]): number => {
        return positionList.reduce((sum, pos) => {
          const contractSize = new BN(pos.size);
          const entryPrice = new BN(pos.currentPrice);
          const usdcValue = contractSize.mul(entryPrice).muln(weight).div(PRICE_PRECISION).div(BPS_DIVISOR);
          return sum + usdcValue.toNumber();
        }, 0);
      };

      const longOpenInterest = calculateInterest(longPositions);
      const shortOpenInterest = calculateInterest(shortPositions);

      return  {
          totalOpenInterest: longOpenInterest + shortOpenInterest,
          totalPositions: positions.length,
          longOpenInterest,
          shortOpenInterest,
          longPositions,
          shortPositions,
        };
    } catch (error) {
      console.error('Error calculating open interest:', error);
      return {
        totalOpenInterest: 0,
        totalPositions: 0,
        longOpenInterest: 0,
        shortOpenInterest: 0,
        longPositions: [],
        shortPositions: [],
      };
    }
  }
}


