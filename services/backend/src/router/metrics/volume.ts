import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { querier } from '../../utils/';

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
