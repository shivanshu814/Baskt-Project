import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { querier } from '../../utils/';

export const getAssetPrice = publicProcedure
  .input(
    z.object({
      assetId: z.string().min(1),
      startDate: z.number().min(1),
      endDate: z.number().min(1),
    }),
  )
  .query(async ({ input }) => {
    try {
      const result = await querier.price.getPriceHistory({
        assetId: input.assetId,
        startDate: input.startDate,
        endDate: input.endDate,
      });
      return result;
    } catch (error) {
      console.error('Error fetching asset price:', error);
      return {
        success: false,
        error: 'Failed to fetch asset price',
      };
    }
  });

export const getLatestAssetPrice = publicProcedure
  .input(
    z.object({
      assetId: z.string().min(1),
    }),
  )
  .query(async ({ input }) => {
    try {
      const result = await querier.price.getLatestPrice(input.assetId);
      return result;
    } catch (error) {
      console.error('Error fetching latest asset price:', error);
      return {
        success: false,
        error: 'Failed to fetch latest asset price',
      };
    }
  });

export const getLatestAssetPrices = publicProcedure
  .input(z.array(z.object({ assetId: z.string().min(1) })))
  .query(async ({ input }) => {
    try {
      const result = await querier.price.getLatestPrices(input.map((asset) => asset.assetId));
      return result;
    } catch (error) {
      console.error('Error fetching latest asset prices:', error);
      return {
        success: false,
        error: 'Failed to fetch latest asset prices',
      };
    }
  });



export const getRouter = {
  getAssetPrice,
  getLatestAssetPrice,
  getLatestAssetPrices,
};
