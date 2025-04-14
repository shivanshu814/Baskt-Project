/** @format */

import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { sdkClient } from '../utils';
import { Asset } from '@baskt/types';
import { AssetConfigModel, OracleConfigModel } from '../utils/models';

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
          oracleName: z.string().min(1, { message: 'Oracle name is required' }),
          oracleType: z.enum(['custom', 'pyth']).default('custom'),
          oracleAddress: z.string().min(1, { message: 'Oracle address is required' }),
          priceConfig: z.object({
            provider: z.object({
              id: z.string().min(1),
              chain: z.string().min(1),
              name: z.string().min(1),
            }),
            twp: z.object({
              seconds: z.number().positive(),
            }),
            updateFrequencySeconds: z.number().positive(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          const oracle = new OracleConfigModel(input);
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
        const oracles = await OracleConfigModel.find().sort({ createdAt: -1 });
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
          ticker: z.string().min(1, { message: 'Ticker is required' }),
          name: z.string().min(1, { message: 'Name is required' }),
          assetAddress: z.string().min(1, { message: 'Asset address is required' }),
          oracleAddress: z.string().min(1, { message: 'Oracle address is required' }), // For finding the oracle
          logo: z.string().min(1, { message: 'Logo URL is required' }),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          // Find the corresponding OracleConfig by oracleAddress
          const oracle = await OracleConfigModel.findOne({ oracleAddress: input.oracleAddress });

          if (!oracle) {
            throw new Error(`Oracle with address ${input.oracleAddress} not found`);
          }

          // Create the asset with reference to the oracle
          const asset = new AssetConfigModel({
            ticker: input.ticker,
            name: input.name,
            assetAddress: input.assetAddress,
            oracleConfig: oracle._id,
            logo: input.logo,
          });

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
    getAllAssets: publicProcedure.query<{
      success: boolean;
      data: { account: Asset; ticker: string; logo: string; assetAddress: string }[];
    }>(async () => {
      try {
        const assetConfigs = await AssetConfigModel.find().sort({ createdAt: -1 });

        const assets = await sdkClient.getAllAssets();

        // Map Asset to the configs and combine then
        const combinedAssets = assetConfigs.map((assetConfig: any) => {
          return {
            ticker: assetConfig.ticker,
            assetAddress: assetConfig.assetAddress,
            logo: assetConfig.logo,
            name: assetConfig.name,
            account: assets.find((asset) => asset.address.toString() === assetConfig.assetAddress)!,
            price: 10,
            change24h: 10,
          };
        });

        return {
          success: true,
          data: combinedAssets,
        };
      } catch (error) {
        console.error('Error fetching assets:', error);
        throw new Error('Failed to fetch assets');
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
