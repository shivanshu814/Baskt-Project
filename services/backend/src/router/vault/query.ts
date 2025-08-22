import { PRICE_PRECISION } from '@baskt/sdk';
import BN from 'bn.js';
import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/';
import logger from '../../utils/logger';

export const getVaultData = publicProcedure
  .input(
    z.object({
      userAddress: z.string().optional(),
      fullData: z.boolean().optional(),
    }),
  )
  .query(async ({ input }) => {
    const { userAddress, fullData } = input;

    try {
      const [
        poolResult,
        assetsResult,
        withdrawQueueStatsResult,
        userDepositsResult,
      ] = await Promise.all([
        querier.pool.getLiquidityPool(),
        querier.asset.getAllAssets(),
        querier.withdrawQueue.getWithdrawQueueStats(),
        userAddress ? querier.pool.getUserDeposits(userAddress) : [],
      ]);

      if (!poolResult.success || !poolResult.data || !assetsResult.success || !assetsResult.data || !withdrawQueueStatsResult.success || !withdrawQueueStatsResult.data) {
        logger.error('Failed to fetch vault data');
        return {
          success: false,
          error: 'Failed to fetch vault data',
        };
      }

      const poolData = poolResult.data;
      const totalValueLocked = new BN(poolData.totalLiquidity.toString());
      const totalShares = new BN(poolData.totalShares.toString());

      const blpPrice = totalShares.gt(new BN(0)) ? totalValueLocked.mul(new BN(PRICE_PRECISION)).div(totalShares).div(PRICE_PRECISION).toString() : '0';



      let apr = poolData.fees.latestApr;
      let fees = poolData.fees.totalFeesCollected.toString();

      const enhancedPoolData = {
        totalLiquidity: poolData.totalLiquidity.toString(),
        totalShares: poolData.totalShares.toString(),
        depositFeeBps: poolData.depositFeeBps,
        withdrawalFeeBps: poolData.withdrawalFeeBps,
        minDeposit: poolData.minDeposit,
        lastUpdateTimestamp: poolData.lastUpdateTimestamp,
        lpMint: poolData.lpMint.toString(),
        tokenVault: poolData.tokenVault,
        bump: poolData.bump,
        poolAuthorityBump: poolData.poolAuthorityBump,
        pendingLpTokens: poolData.pendingLpTokens.toString(),
        withdrawQueueHead: poolData.withdrawQueueHead,
        withdrawQueueTail: poolData.withdrawQueueTail,
        poolAddress: poolData.poolAddress,

        apr: Number(apr.toFixed(6)),
        totalFeesEarned: fees.toString(),

      };

      const assetExpoures = assetsResult.data.map((asset) => {
        return {
          assetAddress: asset.assetAddress,
          assetName: asset.name,
          ticker: asset.ticker,
          longExposure: asset.exposure?.longOpenInterest,
          shortExposure: asset.exposure?.shortOpenInterest,
          nextExposure: asset.volume?.longVolume.sub(asset.volume?.shortVolume).toString(),
        }
      })

      const baseResponse = {
        poolData: enhancedPoolData,
        apr: Number(apr.toFixed(6)),
        allocation: {
          totalValueLocked: totalValueLocked.toString(),
          allocationData: assetExpoures,
        },
        statistics: {
          fees: Number(fees),
          blpPrice: blpPrice,
          totalSupply: new BN(poolData.totalShares.toString()).div(new BN(PRICE_PRECISION)).toString(),
        },
      };

      return {
        success: true,
        data: baseResponse,
      };
    } catch (error) {
      logger.error('Error fetching vault data:', error);
      return {
        success: false,
        error: 'Failed to fetch vault data',
      };
    }
  });

function calculateAssetExposures(positions: any[], assets: any[], baskts: any[]) {
  const assetMap = new Map();

  assets.forEach((asset) => {
    assetMap.set(asset.assetAddress, {
      asset: asset.name || asset.ticker,
      longExposure: 0,
      shortExposure: 0,
      longExposurePercentage: 0,
      shortExposurePercentage: 0,
      netExposure: 0,
      isLong: false,
      logo: asset.logo || '',
      name: asset.name || asset.ticker || '',
    });
  });

  const basktMap = new Map();
  baskts.forEach((baskt) => {
    basktMap.set(baskt.basktId || baskt.id, baskt);
  });

  positions.forEach((position) => {
    const basktId = position.basktId || position.basktAddress;
    const baskt = basktId ? basktMap.get(basktId) : null;

    let foundAsset = null;
    let matchedAssetId = null;

    if (baskt && baskt.currentAssetConfigs) {
      baskt.currentAssetConfigs.forEach((assetConfig: any) => {
        const assetId = assetConfig.assetId || assetConfig.assetObjectId;
        if (assetMap.has(assetId)) {
          const asset = assetMap.get(assetId);
          const positionValue = new BN(position.size || '0')
            .mul(new BN(position.entryPrice || '0'))
            .div(new BN(1e12))
            .toNumber();
          const assetWeight = assetConfig.weight / 10000;
          const assetValue = positionValue * assetWeight;

          if (assetConfig.direction) {
            asset.longExposure += assetValue;
          } else {
            asset.shortExposure += assetValue;
          }

          foundAsset = asset;
        }
      });
    }

    if (!foundAsset) {
      const possibleAssetIds = [
        position.assetId,
        position.basktId,
        position.assetAddress,
        position.asset,
        position.assetPublicKey,
        position.baseAsset,
        position.underlyingAsset,
      ].filter(Boolean);

      for (const assetId of possibleAssetIds) {
        if (assetMap.has(assetId)) {
          foundAsset = assetMap.get(assetId);
          matchedAssetId = assetId;
          break;
        }
      }

      if (foundAsset) {
        const positionValue = new BN(position.size || '0')
          .mul(new BN(position.entryPrice || '0'))
          .div(new BN(1e12))
          .toNumber();

        if (position.isLong) {
          foundAsset.longExposure += positionValue;
        } else {
          foundAsset.shortExposure += positionValue;
        }
      }
    }

    if (!foundAsset) {
      logger.error(`Asset mapping not found for position. BasktId: ${basktId}`);
    }
  });

  return Array.from(assetMap.values())
    .map((asset) => {
      const assetTotalExposure = asset.longExposure + asset.shortExposure;
      const longPercentage =
        assetTotalExposure > 0 ? (asset.longExposure / assetTotalExposure) * 100 : 0;
      const shortPercentage =
        assetTotalExposure > 0 ? (asset.shortExposure / assetTotalExposure) * 100 : 0;
      const netExposure = asset.longExposure - asset.shortExposure;

      return {
        longExposure: asset.longExposure * 10_000_000,
        shortExposure: asset.shortExposure * 10_000_000,
        longExposurePercentage: Math.round(longPercentage * 100) / 100,
        shortExposurePercentage: Math.round(shortPercentage * 100) / 100,
        netExposure: netExposure * 10_000_000,
        isLong: netExposure > 0,
        logo: asset.logo,
        name: asset.name,
      };
    })
    .filter((asset) => asset.longExposure > 0 || asset.shortExposure > 0);
}
