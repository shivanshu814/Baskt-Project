import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { BasktMetadataModel } from '../utils/models';
import { sdkClient } from '../utils';
import { PublicKey } from '@solana/web3.js';
import { getAssetFromAddress } from './assetRouter';

// Schema for validating baskt creation request
const createBasktSchema = z.object({
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
});

const sdkClientInstance = sdkClient();

export const basktRouter = router({
  createBasktMetadata: publicProcedure.input(createBasktSchema).mutation(async ({ input }) => {
    try {
      const newBasktMetadata = new BasktMetadataModel({
        ...input,
        creationDate: new Date(),
      });

      const savedBasktMetadata = await newBasktMetadata.save();

      return {
        success: true,
        data: savedBasktMetadata,
      };
    } catch (error) {
      console.error('Error creating baskt metadata:', error);
      return {
        success: false,
        message: 'Failed to create baskt metadata',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }),

  getBasktMetadataById: publicProcedure
    .input(z.object({ basktId: z.string() }))
    .query(async ({ input }) => {
      try {
        const basktInfo = await getBasktInfoFromAddress(input.basktId);
        if (!basktInfo) {
          return {
            success: false,
            message: 'Baskt metadata not found',
          };
        }

        return {
          success: true,
          data: basktInfo,
        };
      } catch (error) {
        console.error('Error fetching baskt metadata:', error);
        return {
          success: false,
          message: 'Failed to fetch baskt metadata',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  getAllBaskts: publicProcedure.query(async () => {
    try {
      const baskts = await BasktMetadataModel.find().sort({ createdAt: -1 });
      const onchainBaskts = await sdkClientInstance.getAllBaskts();

      if (!baskts || !onchainBaskts || baskts.length === 0 || onchainBaskts.length === 0) {
        return { success: false, data: [] };
      }

      const combinedBaskts = await Promise.all(
        baskts.map(async (basktConfig) => {
          const onchainBaskt = onchainBaskts.find(
            (b) => b.account.basktId.toString() === basktConfig.basktId,
          );
          if (!onchainBaskt) return null;

          const assets = await Promise.all(
            onchainBaskt.account.currentAssetConfigs.map(async (asset) => ({
              ...(await getAssetFromAddress(asset.assetId.toString())),
              weight: asset.weight,
              direction: asset.direction,
              id: asset.assetId.toString(),
              volume24h: 0,
              marketCap: 0,
              weightage: (asset.weight.toNumber() * 100) / 10_000,
              position: asset.direction ? 'long' : 'short',
            })),
          );

          return {
            id: basktConfig.basktId,
            basktId: basktConfig.basktId,
            name: basktConfig.name,
            description: basktConfig.description,
            creator: basktConfig.creator,
            image: basktConfig.image,
            risk: basktConfig.risk,
            categories: basktConfig.categories,
            assets,
            price: 0,
            change24h: 0,
            aum: 0,
            totalAssets: assets.length,
            account: onchainBaskt,
            creationDate: basktConfig.creationDate,
            sparkline: [],
            rebalancePeriod: basktConfig.rebalancePeriod,
            txSignature: basktConfig.txSignature,
            priceHistory: {
              daily: Array(24)
                .fill(0)
                .map((_, i) => ({
                  date: new Date(Date.now() - (24 - i) * 3600000).toISOString(),
                  price: 150 + Math.sin(i) * 5,
                  volume: 1000000 + Math.random() * 500000,
                })),
              weekly: Array(7)
                .fill(0)
                .map((_, i) => ({
                  date: new Date(Date.now() - (7 - i) * 86400000).toISOString(),
                  price: 150 + Math.sin(i) * 10,
                  volume: 2000000 + Math.random() * 1000000,
                })),
              monthly: Array(30)
                .fill(0)
                .map((_, i) => ({
                  date: new Date(Date.now() - (30 - i) * 86400000).toISOString(),
                  price: 150 + Math.sin(i) * 15,
                  volume: 3000000 + Math.random() * 1500000,
                })),
              yearly: Array(12)
                .fill(0)
                .map((_, i) => ({
                  date: new Date(Date.now() - (12 - i) * 2592000000).toISOString(),
                  price: 150 + Math.sin(i) * 20,
                  volume: 4000000 + Math.random() * 2000000,
                })),
            },
            performance: {
              daily: 2.5,
              weekly: 5.2,
              monthly: 12.8,
              year: 45.6,
            },
          };
        }),
      );

      return { success: true, data: combinedBaskts.filter(Boolean) };
    } catch (error) {
      console.error('Error fetching baskts:', error);
      return { success: false, message: 'Failed to fetch baskts' };
    }
  }),

  getTradingData: publicProcedure
    .input(
      z.object({
        period: z.enum(['1D', '1W', '1M', '1Y', 'All']).default('1D'),
        chartType: z.enum(['candle', 'baseline', 'line']).default('candle'),
        basePrice: z.number().default(150),
        lastUpdateTime: z.number().optional(),
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
});

async function getBasktInfoFromAddress(basktId: string) {
  const basktMetadata = await BasktMetadataModel.findOne({ basktId }).exec();
  if (!basktMetadata) {
    return null;
  }
  const onchainBaskt = await sdkClientInstance.getBaskt(new PublicKey(basktId));
  if (!onchainBaskt) {
    return null;
  }
  console.log({ basktMetadata }, ' this is basktmetadata');
  console.log({ onchainBaskt }, ' this is onchainBaskt');
  return convertToBasktInfo(onchainBaskt, basktMetadata);
}

async function convertToBasktInfo(onchainBaskt: any, basktMetadata: any) {
  const assets: any[] = [];
  for (const asset of onchainBaskt.currentAssetConfigs) {
    assets.push({
      ...(await getAssetFromAddress(asset.assetId.toString())),
      weightage: (asset.weight * 100) / 10_000,
      position: asset.direction ? 'long' : 'short',
    });
  }
  return {
    assets,
    name: basktMetadata.name,
    description: basktMetadata.description,
    price: 0,
    change24h: 0,
    category: basktMetadata.categories,
    risk: basktMetadata.risk,
    totalAssets: assets.length,
    creator: basktMetadata.creator,
    id: basktMetadata.basktId.toString(),
    image: basktMetadata.image,
    creationDate: new Date().toISOString(),
    priceHistory: {
      daily: Array(24)
        .fill(0)
        .map((_, i) => ({
          date: new Date(Date.now() - (24 - i) * 3600000).toISOString(),
          price: 150 + Math.sin(i) * 5,
          volume: 1000000 + Math.random() * 500000,
        })),
      weekly: Array(7)
        .fill(0)
        .map((_, i) => ({
          date: new Date(Date.now() - (7 - i) * 86400000).toISOString(),
          price: 150 + Math.sin(i) * 10,
          volume: 2000000 + Math.random() * 1000000,
        })),
      monthly: Array(30)
        .fill(0)
        .map((_, i) => ({
          date: new Date(Date.now() - (30 - i) * 86400000).toISOString(),
          price: 150 + Math.sin(i) * 15,
          volume: 3000000 + Math.random() * 1500000,
        })),
      yearly: Array(12)
        .fill(0)
        .map((_, i) => ({
          date: new Date(Date.now() - (12 - i) * 2592000000).toISOString(),
          price: 150 + Math.sin(i) * 20,
          volume: 4000000 + Math.random() * 2000000,
        })),
    },
    performance: {
      day: 2.5,
      week: 5.2,
      month: 12.8,
      year: 45.6,
    },
  };
}
