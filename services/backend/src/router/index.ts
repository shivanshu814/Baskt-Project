/** @format */

import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { Asset } from '@baskt/types';
import { AssetConfigModel, OracleConfigModel } from '../utils/models';
import { sdkClient } from '../utils';

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
        const sdkClientInstance = sdkClient();
        const assets = await sdkClientInstance.getAllAssets();

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

  baskt: router({
    // get trading data
    getTradingData: publicProcedure
      .input(
        z.object({
          period: z.enum(['1D', '1W', '1M', '1Y', 'All']).default('1D'),
          chartType: z.enum(['candle', 'baseline', 'line']).default('candle'),
          basePrice: z.number().default(150),
          lastUpdateTime: z.number().optional(), // Add this for incremental updates
        }),
      )
      .query(({ input }) => {
        const { period, chartType, basePrice, lastUpdateTime } = input;

        const PERIOD_CONFIGS = {
          '1D': { dataPoints: 24 * 60, timeInterval: 60, volatility: 0.5 },
          '1W': { dataPoints: 7 * 24, timeInterval: 3600, volatility: 1 },
          '1M': { dataPoints: 30, timeInterval: 86400, volatility: 2 },
          '1Y': { dataPoints: 365, timeInterval: 86400, volatility: 5 },
          All: { dataPoints: 365 * 2, timeInterval: 86400, volatility: 5 },
        };

        const config = PERIOD_CONFIGS[period] || PERIOD_CONFIGS['1D'];
        const { dataPoints, timeInterval, volatility } = config;

        const generateRandomPrice = (lastPrice: number) => {
          const change = (Math.random() - 0.5) * 2;
          return lastPrice + change;
        };

        const now = new Date();
        const data = [];
        let currentPrice = basePrice;
        let lastPrice = basePrice;

        // If lastUpdateTime is provided, only generate new data points
        const startIndex = lastUpdateTime
          ? Math.floor((now.getTime() - lastUpdateTime * 1000) / (timeInterval * 1000))
          : 0;

        if (chartType === 'candle') {
          for (let i = startIndex; i < dataPoints; i++) {
            const time = new Date(now.getTime() - (dataPoints - i) * timeInterval * 1000);
            lastPrice = currentPrice;
            currentPrice = generateRandomPrice(currentPrice);
            const high = Math.max(lastPrice, currentPrice) + Math.random() * volatility;
            const low = Math.min(lastPrice, currentPrice) - Math.random() * volatility;

            data.push({
              time: time.getTime() / 1000,
              open: lastPrice,
              high,
              low,
              close: currentPrice,
            });
          }
        } else {
          const baselineVolatility = volatility * 4;
          for (let i = startIndex; i < dataPoints; i++) {
            const time = new Date(now.getTime() - (dataPoints - i) * timeInterval * 1000);
            const value =
              basePrice +
              Math.sin(i * 0.1) * baselineVolatility +
              (Math.random() - 0.5) * baselineVolatility;

            data.push({
              time: time.getTime() / 1000,
              value,
            });
          }
        }

        return {
          success: true,
          data,
          lastUpdateTime: now.getTime() / 1000,
        };
      }),
  }),

  crypto: router({
    getCryptoNews: publicProcedure.query(async () => {
      try {
        const baseURL = 'https://pro-api.coinmarketcap.com/v1/content/latest';
        const apiKey = process.env.CMC_APIKEY;

        if (!apiKey) {
          throw new Error('CMC API key not found');
        }

        const response = await fetch(
          `${baseURL}?limit=5&news_type=all&content_type=all&language=en`,
          {
            headers: {
              'X-CMC_PRO_API_KEY': apiKey,
              Accept: 'application/json',
            },
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to fetch crypto news: ${errorData.status?.error_message || 'Unknown error'}`,
          );
        }

        const data = await response.json();
        return data.data.map((item: any) => ({
          id: item.id?.toString() || Math.random().toString(),
          title: item.title,
          time: new Date(item.released_at || item.created_at).toLocaleString(),
          url: item.source_url,
          cover: item.cover,
        }));
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        return [];
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
