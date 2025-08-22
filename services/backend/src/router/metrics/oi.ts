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

