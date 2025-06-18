import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { AssetMetadataModel, BasktMetadataModel } from '../../utils/models';
import { sdkClient } from '../../utils';
import { PublicKey } from '@solana/web3.js';
import { getAssetFromAddress } from '../asset/query';
import { calculateNav, WEIGHT_PRECISION } from '@baskt/sdk';
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
    const baskts = await BasktMetadataModel.find().sort({ createdAt: -1 });
    const onchainBaskts = await sdkClientInstance.getAllBaskts();

    if (!baskts || !onchainBaskts || baskts.length === 0 || onchainBaskts.length === 0) {
      return { success: false, data: [] };
    }

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

          return await convertToBasktInfo(basktConfig.account, basktMetadata);
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
  return convertToBasktInfo(onchainBaskt, basktMetadata);
}

// convert to baskt info
async function convertToBasktInfo(onchainBaskt: any, basktMetadata: any) {
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

  const basktId =
    basktMetadata?.basktId?.toString() ||
    onchainBaskt.basktId?.toString() ||
    onchainBaskt.account?.basktId?.toString();

  let price = new BN(0);
  const formattedAssets = assets.map(
    (asset) =>
      ({
        assetId: new PublicKey(asset.id),
        direction: asset.direction,
        weight: new BN(asset.weight).mul(WEIGHT_PRECISION).divn(100),
        baselinePrice: new BN(asset.priceRaw),
      } as OnchainAssetConfig),
  );
  try {
    if (assets.length > 0 && assets.every((asset) => asset && asset.price > 0)) {
      price = calculateNav(
        onchainBaskt.currentAssetConfigs.map((asset: any) => ({
          ...asset,
        })),
        formattedAssets,
        new BN(onchainBaskt.baselineNav || 0),
      );
    }
  } catch (error) {
    console.error('Error calculating NAV:', error);
    price = new BN(0);
  }

  const account = (onchainBaskt.account || onchainBaskt) as OnchainBasktAccount;

  return {
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
}

export const getRouter = {
  getBasktMetadataById,
  getAllBaskts,
  getBasktNAV,
  getTradingData,
};
