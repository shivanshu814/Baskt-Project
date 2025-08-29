import { PRICE_PRECISION } from '@baskt/sdk';
import BN from 'bn.js';
import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/';
import logger from '../../utils/logger';

export const getVaultData = publicProcedure.query(async () => {
  try {
    const [poolResult, assetsResult, withdrawQueueStatsResult, assetExposureResult] =
      await Promise.all([
        querier.pool.getLiquidityPool(),
        querier.asset.getAllAssets(),
        querier.withdrawQueue.getWithdrawQueueStats(),
        querier.metrics.getOpenInterestForAllAssets(),
      ]);

    if (
      !poolResult.success ||
      !poolResult.data ||
      !assetsResult.success ||
      !assetsResult.data ||
      !withdrawQueueStatsResult.success ||
      !withdrawQueueStatsResult.data ||
      !assetExposureResult.success ||
      !assetExposureResult.data
    ) {
      logger.error('Failed to fetch vault data');
      return {
        success: false,
        error: 'Failed to fetch vault data',
      };
    }

    const poolData = poolResult.data;
    const totalValueLocked = new BN(poolData.totalLiquidity.toString());
    const totalShares = new BN(poolData.totalShares.toString());

    const blpPrice = totalShares.gt(new BN(0))
      ? totalValueLocked
          .mul(new BN(PRICE_PRECISION))
          .div(totalShares)
          .div(PRICE_PRECISION)
          .toString()
      : '0';

    const apr = poolData.fees.latestApr;
    const fees = poolData.fees.totalFeesCollected.toString();

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

    const assetExposures = assetsResult.data.map((asset) => {
      const assetExposure = assetExposureResult.data?.[asset.assetAddress];
      const longExposure = Number(assetExposure?.longOpenInterest || 0);
      const shortExposure = Number(assetExposure?.shortOpenInterest || 0);
      const netExposure = longExposure - shortExposure;
      const totalExposure = longExposure + shortExposure;

      return {
        longExposure,
        shortExposure,
        longExposurePercentage: totalExposure > 0 ? (longExposure / totalExposure) * 100 : 0,
        shortExposurePercentage: totalExposure > 0 ? (shortExposure / totalExposure) * 100 : 0,
        netExposure,
        isLong: netExposure > 0,
        logo: asset.logo || '',
        name: asset.name || asset.ticker || '',
      };
    });

    const baseResponse = {
      poolData: enhancedPoolData,
      apr: Number(apr.toFixed(6)),
      allocation: {
        totalValueLocked: Number(totalValueLocked.toString()),
        allocationData: assetExposures,
      },
      statistics: {
        fees: Number(fees),
        blpPrice: Number(blpPrice),
        totalSupply: Number(
          new BN(poolData.totalShares.toString()).div(new BN(PRICE_PRECISION)).toString(),
        ),
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
