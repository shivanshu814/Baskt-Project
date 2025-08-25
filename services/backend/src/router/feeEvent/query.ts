import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/';

export const getAllFeeEventData = publicProcedure
  .input(
    z.object({
      limit: z.number().optional().default(100),
      offset: z.number().optional().default(0),
    }),
  )
  .query(async ({ input }) => {
    try {
      const { limit, offset } = input;
      const result = await querier.feeEvent.getAllFeeEventData(limit, offset);
      return result;
    } catch (error) {
      console.error('Error fetching all fee event data:', error);
      return {
        success: false,
        error: 'Failed to fetch all fee event data',
      };
    }
  });

export const getFeeEventStats = publicProcedure.query(async () => {
  try {
    const result = await querier.feeEvent.getFeeEventStats();
    return result;
  } catch (error) {
    console.error('Error fetching fee event stats:', error);
    return {
      success: false,
      error: 'Failed to fetch fee event stats',
    };
  }
});

export const getFeeEvents = publicProcedure
  .input(
    z.object({
      limit: z.number().optional().default(100),
      offset: z.number().optional().default(0),
    }),
  )
  .query(async ({ input }) => {
    try {
      const { limit, offset } = input;
      const result = await querier.feeEvent.getFeeEvents(limit, offset);
      return result;
    } catch (error) {
      console.error('Error fetching fee events:', error);
      return {
        success: false,
        error: 'Failed to fetch fee events',
      };
    }
  });

export const getRouter = {
  getAllFeeEventData,
  getFeeEventStats,
  getFeeEvents,
};
