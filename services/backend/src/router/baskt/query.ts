import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { BasktMetadataModel } from '../../utils/models';
import { sdkClient } from '../../utils';
import { PublicKey } from '@solana/web3.js';
import { getAllAssetsInternal } from '../asset/query';
import { calculateNav, WEIGHT_PRECISION, calculateLiveNav } from '@baskt/sdk';
import { OnchainAssetConfig, OnchainBasktAccount } from '@baskt/types';
import { BN } from 'bn.js';
import { generateNavHistory } from '../../fakers/price';

const sdkClientInstance = sdkClient();

// get baskt metadata by id
const getBasktMetadataById = publicProcedure
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
  });

// get all baskts
const getAllBaskts = publicProcedure.query(async () => {
  try {
    // Fetch baskts metadata from MongoDB
    const baskts = await BasktMetadataModel.find().sort({ createdAt: -1 });

    // Fetch onchain baskts from Solana
    const onchainBaskts = await sdkClientInstance.getAllBaskts();

    if (!baskts || !onchainBaskts || baskts.length === 0 || onchainBaskts.length === 0) {
      return { success: false, data: [] };
    }

    // Collect all unique asset IDs from all baskts
    const allAssetIds = new Set<string>();
    const basktAssetMap = new Map<string, string[]>(); // basktId -> assetIds

    onchainBaskts.forEach((basktConfig) => {
      const basktId = basktConfig.account.basktId.toString();
      const assetIds = basktConfig.account.currentAssetConfigs.map((asset: any) => 
        asset.assetId.toString()
      );
      basktAssetMap.set(basktId, assetIds);
      assetIds.forEach(id => allAssetIds.add(id));
    });

    // Fetch all assets once using getAllAssetsInternal
    const allAssetsResult = await getAllAssetsInternal(false); // false for fast query, no need for latest prices

    // Create asset lookup map by asset address
    const assetLookup = new Map<string, any>();
    if (allAssetsResult.success && allAssetsResult.data) {
      allAssetsResult.data.forEach((asset: any) => {
        if (asset && asset.assetAddress) {
          assetLookup.set(asset.assetAddress, asset);
        }
      });
    }

    // Combine and convert baskts using cached assets
    const combinedBaskts = await Promise.all(
      onchainBaskts
        .map(async (basktConfig) => {
          const basktMetadata = baskts.find(
            (b) => b.basktId === basktConfig.account.basktId.toString(),
          );
          if (!basktMetadata) {
            console.log('Baskt metadata not found', basktConfig.account.basktId.toString());
            return;
          }

          return await convertToBasktInfoWithAssets(
            basktConfig.account, 
            basktMetadata, 
            assetLookup,
            basktAssetMap.get(basktConfig.account.basktId.toString()) || []
          );
        })
        .filter((baskt) => !!baskt),
    );

    return { success: true, data: combinedBaskts };
  } catch (error) {
    console.error('Error fetching baskts:', error);
    return { success: false, message: 'Failed to fetch baskts' };
  }
});

// get baskt nav
const getBasktNAV = publicProcedure
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
        data: {
          nav: basktInfo.price,
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
  });

// get trading data
const getTradingData = publicProcedure
  .input(
    z.object({
      basktId: z.string(),
      period: z.enum(['1D', '1W', '1M', '1Y', 'All']).default('1W'),
    }),
  )
  .query(async ({ input }) => {
    const { basktId, period } = input;

    const basktInfo = await getBasktInfoFromAddress(basktId);
    if (!basktInfo) {
      return {
        success: false,
        data: [],
        message: 'Baskt metadata not found',
      };
    }

    const now = Math.floor(Date.now() / 1000);

    let startTime: number;
    switch (period) {
      case '1D':
        startTime = now - 24 * 60 * 60;
        break;
      case '1W':
        startTime = now - 7 * 24 * 60 * 60;
        break;
      case '1M':
        startTime = now - 30 * 24 * 60 * 60;
        break;
      case '1Y':
        startTime = now - 365 * 24 * 60 * 60;
        break;
      case 'All':
      default:
        startTime = 0;
    }

    const filteredData = basktInfo.priceHistory.daily
      .filter((item) => {
        const timestamp = Math.floor(new Date(item.date).getTime() / 1000);
        return timestamp >= startTime;
      })
      .map((item) => ({
        time: Math.floor(new Date(item.date).getTime() / 1000),
        value: item.price.toNumber() / 1e6,
      }));

    return {
      success: true,
      data: filteredData,
    };
  });

// get baskt metadata by name
const getBasktMetadataByName = publicProcedure
  .input(z.object({ basktName: z.string() }))
  .query(async ({ input }) => {
    try {
      const basktInfo = await getBasktInfoFromName(input.basktName);
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
  });

// get baskt info from address
async function getBasktInfoFromAddress(basktId: string) {
  const basktMetadata = await BasktMetadataModel.findOne({ basktId }).exec();
  if (!basktMetadata) {
    return null;
  }
  const onchainBaskt = await sdkClientInstance.getBaskt(new PublicKey(basktId));
  if (!onchainBaskt) {
    return null;
  }
  
  // Get all assets and create lookup map
  const allAssetsResult = await getAllAssetsInternal(true);
  const assetLookup = new Map<string, any>();
  if (allAssetsResult.success && allAssetsResult.data) {
    allAssetsResult.data.forEach((asset: any) => {
      if (asset && asset.assetAddress) {
        assetLookup.set(asset.assetAddress, asset);
      }
    });
  }
  
  // Get asset IDs for this baskt
  const assetIds = onchainBaskt.currentAssetConfigs.map((asset: any) => 
    asset.assetId.toString()
  );
  
  return convertToBasktInfoWithAssets(onchainBaskt, basktMetadata, assetLookup, assetIds);
}

// get baskt info from name
async function getBasktInfoFromName(basktName: string) {
  console.log('Searching for baskt with name:', basktName);

  // First try exact match
  let basktMetadata = await BasktMetadataModel.findOne({ name: basktName }).exec();

  if (!basktMetadata) {
    console.log('Exact match not found, trying case-insensitive search');
    // Try case-insensitive search
    basktMetadata = await BasktMetadataModel.findOne({
      name: { $regex: new RegExp(`^${basktName}$`, 'i') },
    }).exec();
  }

  if (!basktMetadata) {
    console.log('Baskt not found in database');
    return null;
  }

  console.log('Found baskt metadata:', basktMetadata.name, 'with ID:', basktMetadata.basktId);

  const onchainBaskt = await sdkClientInstance.getBaskt(new PublicKey(basktMetadata.basktId));
  if (!onchainBaskt) {
    console.log('Onchain baskt not found');
    return null;
  }
  
  // Get all assets and create lookup map
  const allAssetsResult = await getAllAssetsInternal(false); // false for fast query
  const assetLookup = new Map<string, any>();
  if (allAssetsResult.success && allAssetsResult.data) {
    allAssetsResult.data.forEach((asset: any) => {
      if (asset && asset.assetAddress) {
        assetLookup.set(asset.assetAddress, asset);
      }
    });
  }
  
  // Get asset IDs for this baskt
  const assetIds = onchainBaskt.currentAssetConfigs.map((asset: any) => 
    asset.assetId.toString()
  );
  
  return convertToBasktInfoWithAssets(onchainBaskt, basktMetadata, assetLookup, assetIds);
}

// convert to baskt info with pre-fetched assets
async function convertToBasktInfoWithAssets(
  onchainBaskt: any, 
  basktMetadata: any, 
  assetLookup: Map<string, any>,
  assetIds: string[]
) {
  // Use pre-fetched assets instead of fetching individually
  const assets = onchainBaskt.currentAssetConfigs.map((asset: any) => {
    const assetId = asset.assetId.toString();
    const fetchedAsset = assetLookup.get(assetId);
    
    return {
      ...(fetchedAsset || {}),
      weight: (asset.weight.toNumber() * 100) / 10_000,
      direction: asset.direction,
      id: assetId,
      baselinePrice: asset.baselinePrice.toNumber(),
      volume24h: 0,
      marketCap: 0,
    };
  });

  const basktId =
    basktMetadata?.basktId?.toString() ||
    onchainBaskt.basktId?.toString() ||
    onchainBaskt.account?.basktId?.toString();

  // Calculate price
  let price = new BN(0);
  try {
    if (assets.length > 0 && assets.every((asset: any) => asset && asset.price > 0)) {
      const assetsWithPriceConfig = assets.filter((asset: any) => asset.config?.priceConfig);

      if (assetsWithPriceConfig.length === 0) {
        throw new Error('No price config available');
      }

      const basktAssets = assetsWithPriceConfig.map((asset: any) => {
        const weightBN = new BN(asset.weight).mul(WEIGHT_PRECISION).divn(100);
        return {
          assetId: asset.id,
          weight: weightBN,
          direction: asset.direction ? 1 : 0,
          baselinePrice: new BN(asset.baselinePrice),
          priceConfig: asset.config.priceConfig,
        };
      });

      const { liveNav } = await calculateLiveNav(
        basktAssets,
        new BN(onchainBaskt.baselineNav || 0),
      );

      price = liveNav;
    }
  } catch (error) {
    const formattedAssets = assets.map(
      (asset: any) =>
        ({
          assetId: new PublicKey(asset.id),
          direction: asset.direction,
          weight: new BN(asset.weight).mul(WEIGHT_PRECISION).divn(100),
          baselinePrice: new BN(asset.baselinePrice),
        } as OnchainAssetConfig),
    );

    try {
      price = calculateNav(
        onchainBaskt.currentAssetConfigs.map((asset: any) => ({
          ...asset,
        })),
        formattedAssets,
        new BN(onchainBaskt.baselineNav || 0),
      );
    } catch (fallbackError) {
      price = new BN(0);
    }
  }

  // Build final result
  const status = onchainBaskt.status;
  const account = (onchainBaskt.account || onchainBaskt) as OnchainBasktAccount;

  const result = {
    _id: basktMetadata?._id,
    basktId: basktId,
    name: basktMetadata?.name || '',
    creator: basktMetadata?.creator || '',
    rebalancePeriod: basktMetadata?.rebalancePeriod,
    txSignature: basktMetadata?.txSignature,
    assets,
    totalAssets: assets.length,
    price: price.toNumber(),
    change24h: 0,
    aum: 0,
    sparkline: [],
    account: {
      ...account,
      creationTime: account.creationTime.toString(),
      lastRebalanceTime: account.lastRebalanceTime.toString(),
      baselineNav: account.baselineNav.toString(),
      currentAssetConfigs: account.currentAssetConfigs.map((asset: any) => ({
        ...asset,
        weight: asset.weight.toString(),
        baselinePrice: asset.baselinePrice.toString(),
      })),
      oracle: {
        ...account.oracle,
        price: account.oracle.price.toString(),
        publishTime: account.oracle.publishTime.toString(),
      },
      isActive: status['active'],
    },
    creationDate: basktMetadata?.creationDate || new Date().toISOString(),
    priceHistory: generateNavHistory(onchainBaskt.currentAssetConfigs, new BN(1e6)),
    performance: {
      daily: 2.5,
      weekly: 5.2,
      monthly: 12.8,
      year: 45.6,
    },
  };

  return result;
}



export const getRouter = {
  getBasktMetadataById,
  getBasktMetadataByName,
  getAllBaskts,
  getBasktNAV,
  getTradingData,
};
