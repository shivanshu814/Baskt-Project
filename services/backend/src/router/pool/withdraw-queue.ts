import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/querier';

/**
 * Get withdrawal queue statistics
 */
export const getWithdrawQueueStats = publicProcedure
  .input(
    z.object({
      poolId: z.string().optional(),
      userAddress: z.string().optional(),
    }),
  )
  .query(async ({ input }) => {
    try {
      const result = await querier.withdrawQueue.getWithdrawQueueStats(input.userAddress);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to fetch withdrawal queue stats',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error(error); //eslint-disable-line
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  });

/**
 * Get withdrawal queue items
 */
export const getWithdrawQueue = publicProcedure
  .input(
    z.object({
      poolId: z.string().optional(),
    }),
  )
  .query(async ({ input }) => {
    try {
      const result = await querier.withdrawQueue.getWithdrawQueue(input.poolId);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to fetch withdrawal queue',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error(error); //eslint-disable-line
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  });

/**
 * Get user's withdrawal queue items
 */
export const getUserWithdrawQueueItems = publicProcedure
  .input(
    z.object({
      userAddress: z.string(),
      poolId: z.string().optional(),
    }),
  )
  .query(async ({ input }) => {
    try {
      const result = await querier.withdrawQueue.getUserWithdrawQueueItems(
        input.userAddress,
        input.poolId,
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to fetch user withdrawal queue items',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error(error); //eslint-disable-line
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  });
