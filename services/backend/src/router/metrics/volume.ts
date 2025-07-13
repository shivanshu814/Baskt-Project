import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { querier } from '../../utils/querier';

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

      const result = await querier.metrics.getVolumeForBaskt({
        basktId,
      });

      return result;
    } catch (error) {
      console.error('Error fetching volume:', error);
      return {
        success: false,
        error: 'Failed to fetch volume',
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

      const result = await querier.metrics.getVolumeForAsset({
        assetId,
      });

      return result;
    } catch (error) {
      console.error('Error fetching volume:', error);
      return {
        success: false,
        message: 'Failed to fetch volume',
      };
    }
  });
