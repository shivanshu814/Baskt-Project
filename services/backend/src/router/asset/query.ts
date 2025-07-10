import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { sdkClient } from '../../utils';
import { AssetMetadataModel } from '../../utils/models';
import { getLatestAssetPricesInternal } from '../assetPrice/query';
import { PublicKey } from '@solana/web3.js';

const sdkClientInstance = sdkClient();
const assetIdCache: Map<string, string> = new Map();
const assetCache: Map<string, any> = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds cache
const cacheTimestamps: Map<string, number> = new Map();

export const getAllAssets = publicProcedure
  .input(z.object({
    withLatestPrices: z.boolean().default(false),
  }))
  .query(async ({ input }) => {
    try {
      const result = await getAllAssetsInternal(input.withLatestPrices);
      return result;
    } catch (error) {
      throw error;
    }
  });

export const getAssetsByAddress = publicProcedure
  .input(z.array(z.string()))
  .query(async ({ input }) => {
    return getAssetsByAddressInternal(input);
  });

export const getAssetPerformanceStats = publicProcedure.query(async () => {
  const stats = getAssetCacheStats();
  return {
    cache: stats,
    cacheTTL: CACHE_TTL,
    timestamp: Date.now(),
  };
});

// Shared internal function
async function fetchAllAssetsCore({ withLatestPrices }: { withLatestPrices: boolean }) {
  const cacheKey = withLatestPrices ? 'assets_with_latest_prices' : 'assets_mongo_only';
  const now = Date.now();

  // check cache first
  if (assetCache.has(cacheKey)) {
    const cacheTime = cacheTimestamps.get(cacheKey) || 0;
    if (now - cacheTime < CACHE_TTL) {
      return assetCache.get(cacheKey);
    }
  }

  try {
    const [assetConfigs, assets] = await Promise.all([
      AssetMetadataModel.find().sort({ createdAt: -1 }),
      sdkClientInstance.getAllAssets(),
    ]);

    if (!assets || !assetConfigs || assets.length === 0 || assetConfigs.length === 0) {
      return {
        success: false,
        data: [],
      };
    }

    let latestPrices: any[] = [];
    if (withLatestPrices) {
      const assetIds = assetConfigs.map((config: any) => config._id.toString());
      latestPrices = await getLatestAssetPricesInternal(assetIds);
    }

    assetConfigs.forEach((assetConfig: any) => {
      assetIdCache.set(assetConfig.assetAddress, assetConfig._id.toString());
    });

    const combinedAssets = assetConfigs
      .map((assetConfig: any) => {
        const matchingAsset = assets.find(
          (asset: any) => asset.ticker.toString() === assetConfig.ticker.toString(),
        );
        const matchingPrice = withLatestPrices
          ? latestPrices.find((price: any) => price?.id === assetConfig._id.toString())
          : null;
        return combineAsset(matchingAsset, assetConfig, matchingPrice, false);
      })
      .filter((asset: any) => asset);

    const result = {
      success: true,
      data: combinedAssets,
    };

    assetCache.set(cacheKey, result);
    cacheTimestamps.set(cacheKey, now);

    return result;
  } catch (error) {
    throw new Error('Failed to fetch assets');
  }
}

// Single function that handles both cases
export async function getAllAssetsInternal(withLatestPrices: boolean = false) {
  return fetchAllAssetsCore({ withLatestPrices });
}

export async function getAssetsByAddressInternal(assetAddresses: string[]) {
  try {
    const assets = await AssetMetadataModel.find({ assetAddress: { $in: assetAddresses } }).exec();
    return assets;
  } catch (error) {
    throw new Error('Failed to fetch assets');
  }
}

export async function getAssetFromAddress(assetAddress: string) {
  try {
    const asset = await AssetMetadataModel.findOne({ assetAddress }).exec();
    const onchainAsset = await sdkClientInstance.getAsset(new PublicKey(assetAddress));
    const latestPrices = asset ? await getLatestAssetPricesInternal([asset._id.toString()]) : [];
    const latestPrice = latestPrices.length > 0 ? latestPrices[0] : null;
    return combineAsset(onchainAsset, asset, latestPrice, true);
  } catch (error) {
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

  const price = config.priceMetrics?.price;
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
    config: shouldPassConfig
      ? {
          priceConfig: {
            provider: config.priceConfig.provider,
            twp: config.priceConfig.twp,
            updateFrequencySeconds: config.priceConfig.updateFrequencySeconds,
            units: config.priceConfig.units,
          },
          coingeckoId: config.coingeckoId,
        }
      : undefined,
    latestPrice: latestPrice,
    basktIds: config.basktIds,
  };
}

// cache management functions
export function clearAssetCache() {
  assetCache.clear();
  cacheTimestamps.clear();
}

export function getAssetCacheStats() {
  const now = Date.now();
  const stats = {
    totalCached: assetCache.size,
    validEntries: 0,
    expiredEntries: 0,
  };

  cacheTimestamps.forEach((timestamp) => {
    if (now - timestamp < CACHE_TTL) {
      stats.validEntries++;
    } else {
      stats.expiredEntries++;
    }
  });

  return stats;
}
