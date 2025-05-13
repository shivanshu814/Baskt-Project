import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { BasktMetadataModel } from '../utils/models';
import { sdkClient } from '../utils';
import { PublicKey } from '@solana/web3.js';
import { getAssetFromAddress, getAssetIdFromAddress } from './assetRouter';
import { calculateNav, NAV_PRECISION, WEIGHT_PRECISION } from '@baskt/sdk';
import { OnchainAssetConfig } from '@baskt/types';
import { BN } from 'bn.js';
import { generateNavHistory } from '../fakers/price';

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
        assets: await Promise.all(input.assets.map((asset) => getAssetIdFromAddress(asset))),
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
        onchainBaskts.map(async (basktConfig) => {
          const basktMetadata = baskts.find(
            (b) => b.basktId === basktConfig.account.basktId.toString(),
          );
          if (!basktMetadata) return null;

          return await convertToBasktInfo(basktConfig.account, basktMetadata);
        }),
      );

      console.log(combinedBaskts);

      return { success: true, data: combinedBaskts };
    } catch (error) {
      console.error('Error fetching baskts:', error);
      return { success: false, message: 'Failed to fetch baskts' };
    }
  }),

  getBasktNAV: publicProcedure.input(z.object({ basktId: z.string() })).query(async ({ input }) => {
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
        data: {
          nav: 1,
        },
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

  getTradingData: publicProcedure
    .input(
      z.object({
        basktId: z.string(),
        period: z.enum(['1D', '1W', '1M', '1Y', 'All']).default('1D'),
      }),
    )
    .query(async ({ input }) => {
      const { basktId } = input;

      const basktInfo = await getBasktInfoFromAddress(basktId);
      if (!basktInfo) {
        return {
          success: false,
          data: [],
          message: 'Baskt metadata not found',
        };
      }

      // Format the time data for lightweight-charts
      // It expects either a UNIX timestamp (seconds) or a string in format 'YYYY-MM-DD'
      return {
        success: true,
        data: basktInfo.priceHistory.daily.map((item) => {
          // Convert ISO string to timestamp in seconds
          const timestamp = Math.floor(new Date(item.date).getTime() / 1000);
          return {
            time: timestamp,
            value: item.price.toNumber() / 1e9,
          };
        }),
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
  console.log(onchainBaskt);
  const assets = await Promise.all(
    onchainBaskt.currentAssetConfigs.map(async (asset: any) => ({
      ...(await getAssetFromAddress(asset.assetId.toString())),
      weight: (asset.weight.toNumber() * 100) / 10_000,
      direction: asset.direction,
      id: asset.assetId.toString(),
      baselinePrice: asset.baselinePrice.toNumber(),
      volume24h: 0,
      marketCap: 0,
    })),
  );

  console.log(assets);

  const basktId =
    basktMetadata?.basktId?.toString() ||
    onchainBaskt.basktId?.toString() ||
    onchainBaskt.account?.basktId?.toString();

  //TODO pricing from somewhere else
  const price = calculateNav(
    onchainBaskt.currentAssetConfigs.map((asset: any) => ({
      ...asset,
    })),
    assets.map(
      (asset) =>
        ({
          assetId: new PublicKey(asset.id),
          direction: asset.direction,
          weight: new BN(asset.weight).mul(WEIGHT_PRECISION).divn(100),
          baselinePrice: new BN(asset.price),
        }) as OnchainAssetConfig,
    ),
    new BN(onchainBaskt.baselineNav),
  );

  return {
    id: basktId,
    basktId: basktId,
    name: basktMetadata?.name || '',
    description: basktMetadata?.description || '',
    creator: basktMetadata?.creator || '',
    image: basktMetadata?.image || '',
    risk: basktMetadata?.risk || 'medium',
    categories: basktMetadata?.categories || [],
    rebalancePeriod: basktMetadata?.rebalancePeriod,
    txSignature: basktMetadata?.txSignature,
    assets,
    totalAssets: assets.length,
    price: price.toNumber() / NAV_PRECISION.toNumber(),
    change24h: 0,
    aum: 0,
    sparkline: [],
    account: onchainBaskt.account || onchainBaskt,
    creationDate: basktMetadata?.creationDate || new Date().toISOString(),
    priceHistory: generateNavHistory(onchainBaskt.currentAssetConfigs, new BN(1e9)),
    category: basktMetadata.categories,
    performance: {
      daily: 2.5,
      weekly: 5.2,
      monthly: 12.8,
      year: 45.6,
    },
  };
}
