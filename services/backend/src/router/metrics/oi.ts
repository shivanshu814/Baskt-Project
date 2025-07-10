import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { PositionStatus } from '@baskt/types';
import { AssetMetadataModel, PositionMetadataModel } from '../../utils/models';
import { sdkClient } from '../../utils';
import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { getAllAssetsInternal } from '../asset/query';

const sdkClientInstance = sdkClient();

export const getOpenInterestForBaskt = publicProcedure
  .input(
    z.object({
      basktId: z.string().optional(),
      positionStatus: z
        .enum([PositionStatus.OPEN, PositionStatus.CLOSED])
        .optional()
        .default(PositionStatus.OPEN),
    }),
  )
  .query(async ({ input }) => {
    try {
      const { basktId, positionStatus } = input;

      if (!basktId) {
        throw new Error('Baskt ID is required');
      }

      const filter: any = {};
      if (basktId) filter.basktId = basktId;
      if (positionStatus) filter.status = positionStatus;

      const positions = await PositionMetadataModel.find(filter);

      const longPositions = positions.filter((p: any) => p.isLong);
      const shortPositions = positions.filter((p: any) => !p.isLong);

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
  });

export const getOpenInterestForAsset = publicProcedure
  .input(
    z.object({
      assetId: z.string(),
      positionStatus: z
        .enum([PositionStatus.OPEN, PositionStatus.CLOSED])
        .optional()
        .default(PositionStatus.OPEN),
    }),
  )
  .query(async ({ input }) => {
    try {
      const { assetId, positionStatus } = input;

      if (!assetId) {
        throw new Error('Asset ID is required');
      }

      // Batch asset lookup optimization
      const allAssetsResult = await getAllAssetsInternal(false, false);
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
            totalOpenInterest: 0,
            totalPositions: 0,
            longOpenInterest: 0,
            shortOpenInterest: 0,
            longPositions: [],
            shortPositions: [],
          },
        };
      }

      const filter: any = {};
      if (basktIds.length > 0) filter.basktId = { $in: basktIds };
      if (positionStatus) filter.status = positionStatus;

      const positions = await PositionMetadataModel.find(filter);

      // Batch baskt fetching optimization
      const basktLookup = new Map<string, any>();
      
      // Fetch all baskts once
      const onchainBaskts = await sdkClientInstance.getAllBaskts();
      onchainBaskts.forEach((baskt: any) => {
        const basktId = baskt.account.basktId.toString();
        basktLookup.set(basktId, baskt);
      });

      const longPositions: any[] = [];
      const shortPositions: any[] = [];

      for (const pos of positions) {
        try {
          const onchainBaskt = basktLookup.get(pos.basktId);
          if (!onchainBaskt) {
            continue;
          }
          const currentAssetConfig = onchainBaskt.account.currentAssetConfigs.find(
            (asset: any) => asset.assetId.toString() === assetId,
          );
          if (!currentAssetConfig) {
            continue;
          }
          const isLong = currentAssetConfig.direction;
          const weight = Number(currentAssetConfig.weight.toNumber());
          if (isLong) {
            console.log('long', pos.size, weight);
            longPositions.push({
              position: pos,
              size: (Number(pos.size) * weight) / 10000,
            });
          } else {
            console.log('short', pos.size, weight);
            shortPositions.push({
              position: pos,
              size: (Number(pos.size) * weight) / 10000,
            });
          }
        } catch (error) {
          console.error('Error processing position:', error);
        }
      }

      const longOpenInterest = longPositions.reduce((sum: any, pos: any) => sum + pos.size, 0);
      const shortOpenInterest = shortPositions.reduce((sum: any, pos: any) => sum + pos.size, 0);

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
        message: 'Failed to fetch open interest',
      };
    }
  });
