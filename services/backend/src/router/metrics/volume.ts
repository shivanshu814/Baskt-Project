import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { AssetMetadataModel, PositionMetadataModel } from '../../utils/models';
import { sdkClient } from '../../utils';
import { PublicKey } from '@solana/web3.js';
import { PositionStatus } from '@baskt/types';

const sdkClientInstance = sdkClient();

export const getVolumeForBaskt = publicProcedure
  .input(
    z.object({
      basktId: z.string().optional(),
    }),
  )
  .query(async ({ input }) => {
    try {
      const { basktId } = input;

      if (!basktId) {
        throw new Error('Baskt ID is required');
      }

      const filter: any = {};
      if (basktId) filter.basktId = basktId;

      const positions = await PositionMetadataModel.find({ basktId });

      const longPositions = positions.filter((p: any) => p.isLong);
      const shortPositions = positions.filter((p: any) => !p.isLong);

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
      console.error('Error fetching open interest:', error);
      return {
        success: false,
        error: 'Failed to fetch open interest',
      };
    }
  });

export const getVolumeForAsset = publicProcedure
  .input(
    z.object({
      assetId: z.string(),
    }),
  )
  .query(async ({ input }) => {
    try {
      const { assetId } = input;

      if (!assetId) {
        throw new Error('Asset ID is required');
      }

      const assetMetadata = await AssetMetadataModel.findOne({ assetAddress: assetId }).lean();
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

      const filter: any = {};
      if (basktIds.length > 0) filter.basktId = { $in: basktIds };

      const positions = await PositionMetadataModel.find(filter);

      const longPositions: any[] = [];
      const shortPositions: any[] = [];

      for (const pos of positions) {
        try {
          const onchainBaskt = await sdkClientInstance.getBaskt(new PublicKey(pos.basktId));
          if (!onchainBaskt) {
            return;
          }
          const currentAssetConfig = onchainBaskt.currentAssetConfigs.find(
            (asset: any) => asset.assetId.toString() === assetId,
          );
          if (!currentAssetConfig) {
            return;
          }
          const isLong = currentAssetConfig.direction;
          const weight = Number(currentAssetConfig.weight.toNumber());
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
          console.error('Error fetching open interest:', error);
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
      console.error('Error fetching open interest:', error);
      return {
        success: false,
        message: 'Failed to fetch open interest',
      };
    }
  });
