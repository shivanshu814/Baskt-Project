/** @format */

import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { AssetPriceProviderConfig, OnchainAsset } from '@baskt/types';
import { AssetMetadataModel } from '../utils/models';
import { sdkClient } from '../utils';
import * as assetRouter from './assetRouter';
import * as basktRouter from './basktRouter';
import { TRPCError } from '@trpc/server';
import { put } from '@vercel/blob';

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

  // asset router
  asset: router({
    // create asset
    createAsset: publicProcedure
      .input(
        z.object({
          ticker: z.string().min(1, { message: 'Ticker is required' }),
          name: z.string().min(1, { message: 'Name is required' }),
          assetAddress: z.string().min(1, { message: 'Asset address is required' }),
          logo: z.string().min(1, { message: 'Logo URL is required' }),
          priceConfig: z.object({
            provider: z.object({
              id: z.string().min(1),
              chain: z.string().min(0).optional().default(''),
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
          // Find the asset if the ticker already exists
          const existingAsset = await AssetMetadataModel.findOne({ ticker: input.ticker });
          if (existingAsset) {
            return {
              success: false,
              message: 'Ticker already exists',
            };
          }

          // Create the asset with reference to the oracle
          const asset = new AssetMetadataModel({
            ticker: input.ticker,
            name: input.name,
            assetAddress: input.assetAddress,
            priceConfig: input.priceConfig,
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

    // get all assets with configs
    getAllAssetsWithConfig: publicProcedure.query<{
      success: boolean;
      data: { account: OnchainAsset; ticker: string; logo: string; assetAddress: string }[];
    }>(async () => {
      return await assetRouter.getAllAssetsWithConfig();
    }),

    // get all assets
    getAllAssets: publicProcedure.query<{
      success: boolean;
      data: {
        account: OnchainAsset | undefined;
        ticker: string;
        logo: string;
        assetAddress: string;
      }[];
    }>(async () => {
      return await assetRouter.getAllAssets();
    }),
  }),

  baskt: router({
    // create baskt metadata
    createBasktMetadata: publicProcedure
      .input(
        z.object({
          basktId: z.string(),
          name: z.string().min(1).max(30),
          description: z.string().min(1),
          creator: z.string(),
          categories: z.array(z.string()).min(1),
          risk: z.enum(['low', 'medium', 'high']),
          assets: z.array(z.string()),
          image: z.string().optional(),
          rebalancePeriod: z.object({
            value: z.number().min(1),
            unit: z.enum(['day', 'hour']),
          }),
          txSignature: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        return await basktRouter.createBasktMetadata(input);
      }),

    // get baskt metadata by ID
    getBasktMetadataById: publicProcedure
      .input(z.object({ basktId: z.string() }))
      .query(async ({ input }) => {
        return await basktRouter.getBasktMetadataById(input.basktId);
      }),

    // get all baskts
    getAllBaskts: publicProcedure.query(async () => {
      return await basktRouter.getAllBaskts();
    }),

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
  image: router({
    upload: publicProcedure
      .input(
        z.object({
          filename: z.string(),
          data: z.string(),
          contentType: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          const { filename, data, contentType } = input;
          const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const blob = await put(filename, buffer, {
            access: 'public',
            contentType,
          });

          return blob;
        } catch (error) {
          console.error('Error uploading file:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error uploading file',
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
