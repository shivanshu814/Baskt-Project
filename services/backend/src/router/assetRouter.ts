import { PublicKey } from '@solana/web3.js';
import { sdkClient } from '../utils';
import { AssetMetadataModel } from '../utils/models';
import { OnchainAsset } from '@baskt/types';
import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';

const sdkClientInstance = sdkClient();
const assetIdCache: Map<string, string> = new Map();

export const assetRouter = router({
  getAllAssets: publicProcedure.query(async () => {
    return getAllAssetsInternal(false);
  }),

  getAllAssetsWithConfig: publicProcedure.query(async () => {
    return getAllAssetsInternal(true);
  }),

  createAsset: publicProcedure
    .input(
      z.object({
        ticker: z.string().min(1),
        name: z.string().min(1),
        assetAddress: z.string().min(1),
        logo: z.string().min(1),
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
        const existingAsset = await AssetMetadataModel.findOne({ ticker: input.ticker });
        if (existingAsset) {
          return { success: false, message: 'Ticker already exists' };
        }
        const asset = new AssetMetadataModel(input);
        await asset.save();
        return { success: true, data: asset };
      } catch (error) {
        console.error('Error creating asset:', error);
        return { success: false, message: 'Failed to create asset' };
      }
    }),
});

async function getAllAssetsInternal(config: boolean) {
  try {
    const assetConfigs = await AssetMetadataModel.find().sort({ createdAt: -1 });
    console.log(sdkClientInstance.program.provider.connection.rpcEndpoint);
    const assets = await sdkClientInstance.getAllAssets();

    assetConfigs.forEach((assetConfig) => {
      assetIdCache.set(assetConfig.assetAddress, assetConfig._id.toString());
    });

    if (!assets || !assetConfigs || assets.length === 0 || assetConfigs.length === 0) {
      console.error('No assets found');
      return {
        success: false,
        data: [],
      };
    }

    // Map Asset to the configs and combine then backend + onchain
    const combinedAssets = assetConfigs.map((assetConfig) => {
      return combineAsset(
        assets.find((asset) => asset.ticker.toString() === assetConfig.ticker.toString())!,
        assetConfig,
        config,
      );
    });
    return {
      success: true,
      data: combinedAssets.filter((asset) => asset),
    };
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw new Error('Failed to fetch assets');
  }
}

export async function getAssetFromAddress(assetAddress: string) {
  try {
    const asset = await AssetMetadataModel.findOne({ assetAddress }).exec();
    const onchainAsset = await sdkClientInstance.getAsset(new PublicKey(assetAddress));
    return combineAsset(onchainAsset, asset, false);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return null;
  }
}

export async function getAssetIdFromAddress(assetAddress: string) {
  if (!assetIdCache.has(assetAddress)) {
    const asset = await AssetMetadataModel.findOne({ assetAddress }).exec();
    if (!asset) {
      return null;
    }
    assetIdCache.set(assetAddress, asset._id.toString());
    return asset._id.toString();
  }
  return assetIdCache.get(assetAddress);
}

export function combineAsset(
  onchainAsset: OnchainAsset,
  config: any,
  shouldPassConfig: boolean = false,
) {
  if (!onchainAsset) {
    return undefined;
  }

  if (!config) {
    return {
      ticker: onchainAsset.ticker,
      assetAddress: onchainAsset.address.toString(),
      logo: '',
      name: onchainAsset.ticker,
      price: 0,
      priceRaw: 0,
      change24h: 0,
      account: onchainAsset,
      weight: 0,
      config: shouldPassConfig ? undefined : undefined,
    };
  }

  const price = config.priceMetrics?.price ?? 0;
  const change24h = config.priceMetrics?.change24h ?? 0;
  //TODO a big concern is how we store BN price in the database
  return {
    _id: config._id,
    ticker: onchainAsset.ticker,
    assetAddress: onchainAsset.address.toString(),
    logo: config.logo || '',
    name: config.name || onchainAsset.ticker,
    price: price / 1e9,
    priceRaw: price,
    change24h,
    account: onchainAsset,
    weight: 0,
    config: shouldPassConfig ? config.priceConfig : undefined,
  };
}
