import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { sdkClient } from '../../utils';
import { AssetMetadataModel } from '../../utils/models';
import { getLatestAssetPriceInternal } from '../assetPrice/query';
import { PublicKey } from '@solana/web3.js';

const sdkClientInstance = sdkClient();
const assetIdCache: Map<string, string> = new Map();

export const getAllAssets = publicProcedure.query(async () => {
  return getAllAssetsInternal(false);
});

export const getAllAssetsWithConfig = publicProcedure.query(async () => {
  return getAllAssetsInternal(true);
});

export const getAssetsByAddress = publicProcedure
  .input(z.array(z.string()))
  .query(async ({ input }) => {
    return getAssetsByAddressInternal(input);
  });

// Internal helpers (shared with mutation if needed)
async function getAllAssetsInternal(config: boolean) {
  try {
    const assetConfigs = await AssetMetadataModel.find().sort({ createdAt: -1 });
    const assets = await sdkClientInstance.getAllAssets();
    const latestPrices = await Promise.all(
      assetConfigs.map((assetConfig: any) =>
        getLatestAssetPriceInternal(assetConfig._id.toString()),
      ),
    );

    assetConfigs.forEach((assetConfig: any) => {
      assetIdCache.set(assetConfig.assetAddress, assetConfig._id.toString());
    });

    if (!assets || !assetConfigs || assets.length === 0 || assetConfigs.length === 0) {
      console.error('No assets found');
      return {
        success: false,
        data: [],
      };
    }

    const combinedAssets = assetConfigs.map((assetConfig: any) => {
      return combineAsset(
        assets.find((asset: any) => asset.ticker.toString() === assetConfig.ticker.toString())!,
        assetConfig,
        latestPrices.find((price: any) => price?.id === assetConfig._id.toString())!,
        config,
      );
    });
    return {
      success: true,
      data: combinedAssets.filter((asset: any) => asset),
    };
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw new Error('Failed to fetch assets');
  }
}

export async function getAssetsByAddressInternal(assetAddresses: string[]) {
  try {
    const assets = await AssetMetadataModel.find({ assetAddress: { $in: assetAddresses } }).exec();
    return assets;
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
  onchainAsset: any,
  config: any,
  latestPrice: any,
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
      basktIds: config?.basktIds,
    };
  }

  const price = config.priceMetrics?.price ?? 0;
  const change24h = config.priceMetrics?.change24h ?? 0;
  return {
    _id: config._id,
    ticker: onchainAsset.ticker,
    assetAddress: onchainAsset.address.toString(),
    logo: config.logo || '',
    name: config.name || onchainAsset.ticker,
    price: price,
    priceRaw: price,
    change24h,
    account: onchainAsset,
    weight: 0,
    config: shouldPassConfig ? config.priceConfig : undefined,
    latestPrice: latestPrice,
    basktIds: config.basktIds,
  };
}
