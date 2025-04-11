/** @format */

import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { Oracle } from '../models/Oracle';
import { Asset } from '../models/Asset';

export const appRouter = router({
  // health check
  health: publicProcedure.query(() => {
    return {
      status: 'ok',
      message: 'Server is running',
    };
  }),

  // hello endpoint
  hello: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
      }),
    )
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.name || 'World'}!`,
      };
    }),

  // oracle router
  oracle: router({
    // create oracle
    createOracle: publicProcedure
      .input(
        z.object({
          oracleName: z.string().min(1),
          oracleType: z.string().default('custom'),
          price: z.number(),
          exponent: z.number(),
          confidence: z.number().optional(),
          ema: z.number().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          const oracle = new Oracle(input);
          await oracle.save();
          return {
            success: true,
            data: oracle,
          };
        } catch (error) {
          console.error('Error creating oracle:', error);
          throw new Error('Failed to create oracle');
        }
      }),

    // get all oracles
    getAllOracles: publicProcedure.query(async () => {
      try {
        const oracles = await Oracle.find().sort({ createdAt: -1 });
        return {
          success: true,
          data: oracles,
        };
      } catch (error) {
        console.error('Error fetching oracles:', error);
        throw new Error('Failed to fetch oracles');
      }
    }),
  }),

  // asset router
  asset: router({
    // create asset
    createAsset: publicProcedure
      .input(
        z.object({
          assetId: z.string().min(1),
          assetName: z.string().min(1),
          oracleType: z.string().default('custom'),
          oracleAddress: z.string().min(1),
          logo: z.string().min(1),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          const asset = new Asset(input);
          await asset.save();
          return {
            success: true,
            data: asset,
          };
        } catch (error) {
          console.error('Error creating asset:', error);
          throw new Error('Failed to create asset');
        }
      }),

    // get all assets
    getAllAssets: publicProcedure.query(async () => {
      try {
        const assets = await Asset.find().sort({ createdAt: -1 });
        return {
          success: true,
          data: assets,
        };
      } catch (error) {
        console.error('Error fetching assets:', error);
        throw new Error('Failed to fetch assets');
      }
    }),

    // get asset by address
    getAssetByAddress: publicProcedure
      .input(z.object({ assetAddress: z.string() }))
      .query(async ({ input }) => {
        try {
          console.log('Backend: Looking for asset with address:', input.assetAddress);
          const asset = await Asset.findOne({ assetAddress: input.assetAddress });
          console.log('Backend: Found asset:', asset);
          return {
            success: true,
            data: asset,
          };
        } catch (error) {
          console.error('Error fetching asset:', error);
          throw new Error('Failed to fetch asset');
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
