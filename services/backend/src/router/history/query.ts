import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { OrderAction } from '@baskt/types';
import { querier } from '../../utils/querier';

export const getHistory = publicProcedure
  .input(
    z.object({
      basktId: z.string().optional(),
      userId: z.string().optional(),
      status: z.string().optional(),
      action: z.enum([OrderAction.Open, OrderAction.Close]).optional(),
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    }),
  )
  .query(async ({ input }) => {
    try {
      const result = await querier.history.getHistory(input);
      return result;
    } catch (error) {
      console.error('Error fetching history:', error);
      return {
        success: false,
        error: 'Failed to fetch history',
      };
    }
  });
