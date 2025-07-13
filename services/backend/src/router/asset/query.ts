import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { querier } from '../../utils/querier';

export const getAllAssets = publicProcedure
  .input(
    z.object({
      withLatestPrices: z.boolean().default(false),
      withConfig: z.boolean().default(false),
    }),
  )
  .query(async ({ input }) => {
    return querier.asset.getAllAssets(input);
  });

export const getAssetsByAddress = publicProcedure
  .input(z.array(z.string()))
  .query(async ({ input }) => {
    // Use querier for each address (could be optimized in querier)
    const results = await Promise.all(input.map((addr) => querier.asset.getAssetByAddress(addr)));
    return results.map((r: any) => r.data).filter(Boolean);
  });

export const getAssetPerformanceStats = publicProcedure.query(async () => {
  return querier.asset.getCacheStats();
});
