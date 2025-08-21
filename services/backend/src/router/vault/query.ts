import { PRICE_PRECISION } from '@baskt/ui';
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
        feeStatsResult,
        positionsResult,
        basktsResult,
        assetsResult,
        ...conditionalResults
      ] = await Promise.all([
        querier.pool.getLiquidityPool(),
        querier.feeEvent.getFeeEventStatsOnly(),
        querier.position.getPositions({ isActive: true }),
        querier.baskt.getAllBaskts({
          withPerformance: false,
          hidePrivateBaskts: false,
        }),
        querier.asset.getAllAssets(),
        ...(userAddress
          ? [
              querier.withdrawQueue.getUserWithdrawQueueItems(userAddress),
              querier.withdrawQueue.getWithdrawQueueStats(userAddress),
              querier.pool.getUserDeposits(userAddress),
              querier.pool.getUserWithdrawals(userAddress),
            ]
          : []),
        ...(fullData
          ? [
              querier.withdrawQueue.getWithdrawQueue(),
              querier.withdrawQueue.getWithdrawQueueStats(),
              querier.pool.getAllUsersDeposits(),
              querier.pool.getAllUsersWithdrawals(),
            ]
          : []),
      ]);

      if (!poolResult.success || !poolResult.data) {
        logger.error('Failed to fetch liquidity pool data');
        return {
          success: false,
          error: 'Failed to fetch liquidity pool data',
        };
      }

      const poolData = poolResult.data;
      const totalValueLocked = parseFloat(poolData.totalLiquidity.toString()) / PRICE_PRECISION;

      let apr = 0;
      let fees = 0;

      if (feeStatsResult.success && feeStatsResult.data) {
        const totalFeesRaw = feeStatsResult.data.totalFees;
        const totalFees = parseFloat(totalFeesRaw.toString()) / PRICE_PRECISION;

        if (totalValueLocked > 0 && totalFees > 0) {
          const dailyFeeRate = totalFees / totalValueLocked / 30;
          const annualizedRate = dailyFeeRate * 365;
          apr = Math.min(annualizedRate, 25);
        } else {
          logger.warn('APR calculation skipped - invalid inputs:', {
            totalValueLocked,
            totalFees,
            feeStatsData: feeStatsResult.data,
          });
        }

        fees = Number(totalFees.toFixed(6));
      } else {
        logger.warn('Fee stats call failed or no data');
      }

      const assetExposures = calculateAssetExposures(
        positionsResult.success && positionsResult.data ? positionsResult.data : [],
        assetsResult.success && assetsResult.data ? assetsResult.data : [],
        basktsResult.success && basktsResult.data ? basktsResult.data : [],
      );

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

        recentFeeData:
          feeStatsResult.success && feeStatsResult.data
            ? {
                totalFees: feeStatsResult.data.totalFees.toString(),
                totalFeesToBlp: feeStatsResult.data.totalFeesToBlp?.toString() || '0',
                eventCount: feeStatsResult.data.totalEvents || 0,
                timeWindowDays: 30,
              }
            : {
                totalFees: '0',
                totalFeesToBlp: '0',
                eventCount: 0,
                timeWindowDays: 30,
              },

        feeStats:
          feeStatsResult.success && feeStatsResult.data
            ? {
                totalEvents: feeStatsResult.data.totalEvents || 0,
                totalFees: feeStatsResult.data.totalFees || 0,
                totalFeesToTreasury: feeStatsResult.data.totalFeesToTreasury || 0,
                totalFeesToBlp: feeStatsResult.data.totalFeesToBlp || 0,
                eventTypeBreakdown: feeStatsResult.data.eventTypeBreakdown || [],
              }
            : null,
      };

      const baseResponse = {
        poolData: enhancedPoolData,
        apr: Number(apr.toFixed(6)),
        allocation: {
          totalValueLocked,
          allocationData: assetExposures,
        },
        statistics: {
          fees: Number(fees.toFixed(6)),
          blpPrice:
            totalValueLocked > 0 && parseFloat(poolData.totalShares.toString()) > 0
              ? Number(
                  (
                    totalValueLocked /
                    (parseFloat(poolData.totalShares.toString()) / PRICE_PRECISION)
                  ).toFixed(6),
                )
              : 1.0,
          totalSupply: Number(
            (parseFloat(poolData.totalShares.toString()) / PRICE_PRECISION).toFixed(6),
          ),
        },
      };

      if (userAddress) {
        const userResults = conditionalResults.slice(0, 4);
        const [withdrawQueueResult, withdrawStatsResult, userDepositsResult] = userResults;

        const withdrawStats =
          withdrawStatsResult?.success &&
          withdrawStatsResult.data &&
          'totalQueueItems' in withdrawStatsResult.data
            ? withdrawStatsResult.data
            : { totalQueueItems: 0, averageProcessingTime: 0 };

        const withdrawRequests =
          withdrawQueueResult?.success &&
          withdrawQueueResult.data &&
          Array.isArray(withdrawQueueResult.data)
            ? withdrawQueueResult.data.map((item: any) => ({
                amount: parseFloat(item.lpAmount) / PRICE_PRECISION,
                status: item.status,
                requestedAt: item.requestedAt,
                userAddress: item.providerAddress,
              }))
            : [];

        const userTotalDeposits =
          userDepositsResult?.success &&
          userDepositsResult.data &&
          'totalDeposits' in userDepositsResult.data
            ? userDepositsResult.data.totalDeposits || 0
            : 0;

        const userTotalShares =
          userDepositsResult?.success &&
          userDepositsResult.data &&
          'totalShares' in userDepositsResult.data
            ? userDepositsResult.data.totalShares || 0
            : 0;

        const totalPendingWithdrawals = withdrawRequests.reduce(
          (sum: number, req: any) => sum + req.amount,
          0,
        );
        const netWithdrawals = userTotalShares - totalPendingWithdrawals;

        return {
          success: true,
          data: {
            ...baseResponse,
            userDepositData: { totalDeposits: userTotalDeposits },
            userWithdrawalData: { totalWithdrawals: netWithdrawals },
            userWithdraw: {
              totalWithdrawalsInQueue: withdrawStats.totalQueueItems,
              totalWithdrawalsInCompleted: withdrawRequests.filter(
                (req: any) => req.status === 'completed',
              ).length,
              withdrawRequests,
            },
          },
        };
      }

      if (fullData) {
        const fullDataResults = conditionalResults.slice(0, 4);
        const [
          withdrawQueueResult,
          withdrawStatsResult,
          allUsersDepositsResult,
          allUsersWithdrawalsResult,
        ] = fullDataResults;

        const withdrawStats =
          withdrawStatsResult?.success &&
          withdrawStatsResult.data &&
          'totalQueueItems' in withdrawStatsResult.data
            ? withdrawStatsResult.data
            : { totalQueueItems: 0, averageProcessingTime: 0 };

        const withdrawRequests =
          withdrawQueueResult?.success &&
          withdrawQueueResult.data &&
          Array.isArray(withdrawQueueResult.data)
            ? withdrawQueueResult.data.map((item: any) => ({
                amount: parseFloat(item.lpAmount) / PRICE_PRECISION,
                status: item.status,
                requestedAt: item.requestedAt,
                userAddress: item.providerAddress,
              }))
            : [];

        const totalInWithdrawQueue = withdrawRequests.reduce(
          (sum: number, req: any) => sum + req.amount,
          0,
        );

        const usersDepositData =
          allUsersDepositsResult?.success &&
          allUsersDepositsResult.data &&
          Array.isArray(allUsersDepositsResult.data)
            ? allUsersDepositsResult.data
            : [];

        const usersWithdrawalData =
          allUsersWithdrawalsResult?.success &&
          allUsersWithdrawalsResult.data &&
          Array.isArray(allUsersWithdrawalsResult.data)
            ? allUsersWithdrawalsResult.data
            : [];

        return {
          success: true,
          data: {
            ...baseResponse,
            deposit: {
              totalDeposits: totalValueLocked,
              usersDepositData,
            },
            withdraw: {
              totalWithdrawals: totalValueLocked - totalInWithdrawQueue,
              totalWithdrawalsInQueue: withdrawStats.totalQueueItems,
              totalWithdrawalsInCompleted: withdrawRequests.filter(
                (req: any) => req.status === 'completed',
              ).length,
              usersWithdrawalData,
              withdrawRequests,
            },
          },
        };
      }

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
