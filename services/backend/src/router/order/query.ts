import { OrderAction } from '@baskt/types';
import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/';
import logger from '../../utils/logger';

// get all orders
export const getOrders = publicProcedure
  .input(
    z.object({
      basktId: z.string().optional(),
      userId: z.string().optional(),
      orderStatus: z.string().optional(),
      orderAction: z.enum([OrderAction.Open, OrderAction.Close]).optional(),
      orderPDA: z.string().optional(),
      assetId: z.string().optional(),
    }),
  )
  .query(async ({ input }) => {
    try {
      const result = await querier.order.getOrders(input);
      return result;
    } catch (error) {
      logger.error('Error fetching orders:', error);
      return {
        success: false,
        message: 'Failed to fetch orders',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
