import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { querier } from '../../utils/';

export const getAllAssets = publicProcedure
  .input(
    z.object({
      withConfig: z.boolean().default(false),
      withLivePrices: z.boolean().default(false),
    }),
  )
  .query(async ({ input }) => {
    return querier.asset.getAllAssets(input);
  });

export const getAssetsByAddress = publicProcedure
  .input(z.array(z.string()))
  .query(async ({ input }) => {
    return querier.asset.getAssetsByAddress(input);
  });