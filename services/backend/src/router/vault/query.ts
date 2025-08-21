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
      const poolResult = await querier.pool.getLiquidityPool();
      if (!poolResult.success || !poolResult.data) {
        logger.error('Failed to fetch liquidity pool data');
        return {
          success: false,
          error: 'Failed to fetch liquidity pool data',
        };
      }

      const poolData = poolResult.data;

      let apr = 0;
      let fees = 0;

      try {
        const feeStatsResult = await querier.feeEvent.getFeeEventStatsOnly();

        if (feeStatsResult.success && feeStatsResult.data) {
          const totalFeesToBlp = feeStatsResult.data.totalFeesToBlp / 1_000_000;
          const totalLiquidityUSDC = parseFloat(poolData.totalLiquidity.toString()) / 1_000_000;

          const dailyFeeRate = totalFeesToBlp / totalLiquidityUSDC / 30;
          const annualizedRate = dailyFeeRate * 365;
          apr = Math.min(annualizedRate, 25);

          fees = feeStatsResult.data.totalFees / 1_000_000;
        } else {
          logger.warn('Fee stats call failed');
        }
      } catch (error) {
        logger.error('Error fetching fee stats:', error);
      }

      const positionsResult = await querier.position.getPositions({ isActive: true });

      const basktsResult = await querier.baskt.getAllBaskts({
        withPerformance: false,
        hidePrivateBaskts: false,
      });

      const assetsResult = await querier.asset.getAllAssets();

      const assetExposures = calculateAssetExposures(
        positionsResult.success && positionsResult.data ? positionsResult.data : [],
        assetsResult.success && assetsResult.data ? assetsResult.data : [],
        basktsResult.success && basktsResult.data ? basktsResult.data : [],
      );

      const totalValueLocked = parseFloat(poolData.totalLiquidity.toString()) / 1_000_000;

      // Scenario 1: User-specific data
      if (userAddress) {
        const withdrawQueueResult = await querier.withdrawQueue.getUserWithdrawQueueItems(
          userAddress,
        );
        const withdrawStatsResult = await querier.withdrawQueue.getWithdrawQueueStats(userAddress);

        const userDepositsResult = await querier.pool.getUserDeposits(userAddress);
        const userWithdrawalsResult = await querier.pool.getUserWithdrawals(userAddress);

        const withdrawStats =
          withdrawStatsResult.success && withdrawStatsResult.data
            ? withdrawStatsResult.data
            : { totalQueueItems: 0, averageProcessingTime: 0 };

        const withdrawRequests =
          withdrawQueueResult.success && withdrawQueueResult.data
            ? withdrawQueueResult.data.map((item) => ({
                amount: parseFloat(item.lpAmount) / 1_000_000,
                status: item.status,
                requestedAt: item.requestedAt,
                userAddress: item.providerAddress,
              }))
            : [];

        let userTotalDeposits = 0;
        let userTotalShares = 0;
        if (userDepositsResult.success && userDepositsResult.data) {
          userTotalDeposits = userDepositsResult.data.totalDeposits || 0;
          userTotalShares = userDepositsResult.data.totalShares || 0;
        }

        let userTotalWithdrawals = 0;
        if (userWithdrawalsResult.success && userWithdrawalsResult.data) {
          userTotalWithdrawals =
            userWithdrawalsResult.data.reduce(
              (sum, withdrawal) => sum + parseFloat(withdrawal.remainingLp || '0'),
              0,
            ) / 1_000_000;
        }

        const totalPendingWithdrawals = withdrawRequests.reduce((sum, req) => sum + req.amount, 0);
        const netWithdrawals = userTotalShares - totalPendingWithdrawals;

        return {
          success: true,
          data: {
            apr,
            allocation: {
              totalValueLocked,
              allocationData: assetExposures,
            },
            userDepositData: {
              totalDeposits: userTotalDeposits,
            },
            userWithdrawalData: {
              totalWithdrawals: netWithdrawals,
            },
            userWithdraw: {
              totalWithdrawalsInQueue: withdrawStats.totalQueueItems,
              totalWithdrawalsInCompleted: withdrawRequests.filter(
                (req) => req.status === 'completed',
              ).length,
              withdrawRequests,
            },
            statistics: {
              fees,
              blpPrice:
                totalValueLocked > 0 && parseFloat(poolData.totalShares.toString()) > 0
                  ? totalValueLocked / (parseFloat(poolData.totalShares.toString()) / 1_000_000)
                  : 1,
              totalSupply: parseFloat(poolData.totalShares.toString()) / 1_000_000,
            },
          },
        };
      }

      // Scenario 2: Full data with all users breakdown
      if (fullData) {
        const withdrawQueueResult = await querier.withdrawQueue.getWithdrawQueue();
        const withdrawStatsResult = await querier.withdrawQueue.getWithdrawQueueStats();

        const allUsersDepositsResult = await querier.pool.getAllUsersDeposits();
        const allUsersWithdrawalsResult = await querier.pool.getAllUsersWithdrawals();

        const withdrawStats =
          withdrawStatsResult.success && withdrawStatsResult.data
            ? withdrawStatsResult.data
            : { totalQueueItems: 0, averageProcessingTime: 0 };

        const withdrawRequests =
          withdrawQueueResult.success && withdrawQueueResult.data
            ? withdrawQueueResult.data.map((item) => ({
                amount: parseFloat(item.lpAmount) / 1_000_000,
                status: item.status,
                requestedAt: item.requestedAt,
                userAddress: item.providerAddress,
              }))
            : [];

        const totalInWithdrawQueue = withdrawRequests.reduce((sum, req) => sum + req.amount, 0);

        const usersDepositData =
          allUsersDepositsResult.success && allUsersDepositsResult.data
            ? allUsersDepositsResult.data
            : [];

        const usersWithdrawalData =
          allUsersWithdrawalsResult.success && allUsersWithdrawalsResult.data
            ? allUsersWithdrawalsResult.data
            : [];

        return {
          success: true,
          data: {
            apr,
            allocation: {
              totalValueLocked,
              allocationData: assetExposures,
            },
            deposit: {
              totalDeposits: totalValueLocked,
              usersDepositData,
            },
            withdraw: {
              totalWithdrawals: totalValueLocked - totalInWithdrawQueue,
              totalWithdrawalsInQueue: withdrawStats.totalQueueItems,
              totalWithdrawalsInCompleted: withdrawRequests.filter(
                (req) => req.status === 'completed',
              ).length,
              usersWithdrawalData,
              withdrawRequests,
            },
            statistics: {
              fees,
              blpPrice:
                totalValueLocked > 0 && parseFloat(poolData.totalShares.toString()) > 0
                  ? totalValueLocked / (parseFloat(poolData.totalShares.toString()) / 1_000_000)
                  : 1,
              totalSupply: parseFloat(poolData.totalShares.toString()) / 1_000_000,
            },
          },
        };
      }

      return {
        success: true,
        data: {
          apr,
          allocation: {
            totalValueLocked,
            allocationData: assetExposures,
          },
          statistics: {
            fees,
            blpPrice:
              totalValueLocked > 0 && parseFloat(poolData.totalShares.toString()) > 0
                ? totalValueLocked / (parseFloat(poolData.totalShares.toString()) / 1_000_000)
                : 1,
            totalSupply: parseFloat(poolData.totalShares.toString()) / 1_000_000,
          },
        },
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
          const positionValue =
            (parseFloat(position.size || '0') * parseFloat(position.entryPrice || '0')) /
            1_000_000_000_000;
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
        const positionValue =
          (parseFloat(position.size || '0') * parseFloat(position.entryPrice || '0')) /
          1_000_000_000_000;

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
