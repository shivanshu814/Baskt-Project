import { PositionStatus } from '@baskt/types';
import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/';

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

      const result = await querier.metrics.getOpenInterestForBaskt({
        basktId,
        positionStatus,
      });

      return result;
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

      const result = await querier.metrics.getOpenInterestForAsset({
        assetId,
        positionStatus,
      });

      return result;
    } catch (error) {
      console.error('Error fetching open interest:', error);
      return {
        success: false,
        message: 'Failed to fetch open interest',
      };
    }
  });

export const getOpenInterestForAllAssets = publicProcedure.query(async () => {
  try {
    const result = await querier.metrics.getOpenInterestForAllAsset();
    return result;
  } catch (error) {
    console.error('Error fetching open interest:', error);
    return {
      success: false,
      message: 'Failed to fetch open interest',
    };
  }
});

export const getTopBasktsWithVolume = publicProcedure.query(async () => {
  try {
    return {
      success: true,
      data: [],
    };
  } catch (error) {
    console.error('Error fetching top baskts with volume:', error);
    return {
      success: false,
      message: 'Failed to fetch top baskts with volume',
    };
  }
});