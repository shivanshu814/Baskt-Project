import { calculateCurrentWeights } from '@baskt/sdk';
import { PositionStatus } from '@baskt/types';
import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/';
import logger from '../../utils/logger';

// get baskt metadata by id
const getBasktMetadataByAddress = publicProcedure
  .input(z.object({ basktId: z.string(), withPerformance: z.boolean().default(false) }))
  .query(async ({ input }) => {
    try {
      const result = await querier.baskt.getBasktByAddress(input.basktId, {
        withPerformance: input.withPerformance,
      });
      return result;
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
const getAllBaskts = publicProcedure
  .input(
    z.object({
      withPerformance: z.boolean().default(false),
      hidePrivateBaskts: z.boolean().default(false),
    }),
  )
  .query(async ({ input }) => {
    try {
      const result = await querier.baskt.getAllBaskts({
        withPerformance: input.withPerformance,
        hidePrivateBaskts: input.hidePrivateBaskts,
      });
      return result;
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
      console.log('[Backend] getBasktNAV input:', input);
      const result = await querier.baskt.getBasktNAV(input.basktId);
      console.log('[Backend] getBasktNAV result:', {
        success: result?.success,
        hasData: !!result?.data,
        message: (result as any)?.message,
      });
      return result;
    } catch (error) {
      console.error('Error fetching baskt NAV:', error);
      return {
        success: false,
        message: 'Failed to fetch baskt NAV',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

// get batch baskt nav for multiple baskts
const getBatchBasktNAV = publicProcedure
  .input(z.object({ basktIds: z.array(z.string()) }))
  .query(async ({ input }) => {
    try {
      console.log('[Backend] getBatchBasktNAV input:', input);

      if (!input.basktIds || input.basktIds.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No baskt IDs provided',
        };
      }

      const navPromises = input.basktIds.map(async (basktId) => {
        try {
          const result = await querier.baskt.getBasktNAV(basktId);
          return {
            basktId,
            success: result.success,
            nav: result.success ? result.data?.nav : null,
            error: result.success ? null : result.message,
          };
        } catch (error) {
          return {
            basktId,
            success: false,
            nav: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const navResults = await Promise.all(navPromises);

      console.log('[Backend] getBatchBasktNAV result:', {
        success: true,
        count: navResults.length,
      });

      return {
        success: true,
        data: navResults,
        message: `Successfully fetched NAV data for ${navResults.length} baskts`,
      };
    } catch (error) {
      console.error('Error fetching batch baskt NAV:', error);
      return {
        success: false,
        message: 'Failed to fetch batch baskt NAV',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

// get baskt metadata by name
const getBasktMetadataByName = publicProcedure
  .input(z.object({ basktName: z.string(), withPerformance: z.boolean().default(false) }))
  .query(async ({ input }) => {
    try {
      logger.info('[Backend] getBasktMetadataByName input:', input);
      const result = await querier.baskt.getBasktByUID(input.basktName, {
        withPerformance: input.withPerformance,
      });
      logger.info('[Backend] getBasktMetadataByName result:', {
        success: result?.success,
        hasData: !!result?.data,
        message: (result as any)?.message,
      });
      return result;
    } catch (error) {
      logger.error('Error fetching baskt metadata:', error);
      return {
        success: false,
        message: 'Failed to fetch baskt metadata',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

// get trading data using real nav-tracker data
const getTradingData = publicProcedure
  .input(
    z.object({
      basktId: z.string(),
    }),
  )
  .query(async ({ input }) => {
    const { basktId } = input;

    try {
      const result = await querier.price.getBasktNavHistory(basktId);

      if (!result.success || !result.data) {
        return {
          success: false,
          data: [],
          message: result.message || 'Failed to fetch baskt NAV history',
        };
      }

      const fourHourData = result.data
        .filter((item) => item.time && item.price)
        .reduce((acc, item) => {
          const fourHourTimestamp = Math.floor((item.time || 0) / (4 * 60 * 60)) * (4 * 60 * 60);
          const price = item.price || 0;

          if (!acc[fourHourTimestamp]) {
            acc[fourHourTimestamp] = {
              time: fourHourTimestamp,
              values: [],
              count: 0,
              min: price,
              max: price,
            };
          }

          acc[fourHourTimestamp].values.push(price);
          acc[fourHourTimestamp].count++;
          acc[fourHourTimestamp].min = Math.min(acc[fourHourTimestamp].min, price);
          acc[fourHourTimestamp].max = Math.max(acc[fourHourTimestamp].max, price);

          return acc;
        }, {} as Record<number, { time: number; values: number[]; count: number; min: number; max: number }>);

      const allData = Object.values(fourHourData)
        .map((interval) => ({
          time: interval.time,
          value: interval.values.reduce((sum, val) => sum + val, 0) / interval.count,
          min: interval.min,
          max: interval.max,
          count: interval.count,
        }))
        .sort((a, b) => a.time - b.time);

      const latestNavResult = await querier.baskt.getBasktNAV(basktId);
      let finalData = allData;

      if (latestNavResult.success && latestNavResult.data) {
        const currentTime = Math.floor(Date.now() / 1000);
        const latestNavValue = latestNavResult.data.nav;
        const lastDataPoint = allData[allData.length - 1];

        const isRecent = lastDataPoint && currentTime - lastDataPoint.time < 600;
        const isSimilarValue =
          lastDataPoint && Math.abs(lastDataPoint.value - latestNavValue) < 0.01;

        if (!isRecent || !isSimilarValue) {
          const latestPoint = {
            time: currentTime,
            value: latestNavValue / 1e6,
            min: latestNavValue,
            max: latestNavValue,
            count: 1,
          };

          finalData = [...allData, latestPoint];
        }
      }

      return {
        success: true,
        data: finalData,
        dataSource: 'nav-tracker',
        message: '4-hour aggregated NAV data from nav-tracker service with latest NAV appended',
      };
    } catch (error) {
      console.error('Error fetching baskt NAV history:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch baskt NAV history',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

// get explore page baskts
const getExplorePageBaskts = publicProcedure
  .input(
    z.object({
      userAddress: z.string().optional(),
      withPerformance: z.boolean().default(true),
      dataType: z
        .enum(['baskts', 'publicBaskts', 'trendingBaskts', 'yourBaskts', 'combinedBaskts'])
        .default('combinedBaskts'),
      includeCurrentWeights: z.boolean().default(true),
    }),
  )
  .query(async ({ input }) => {
    try {
      logger.info('[Backend] getExplorePageBaskts triggered');

      const basktsResult = await querier.baskt.getAllBaskts({
        withPerformance: input.withPerformance,
        hidePrivateBaskts: false,
      });

      if (!basktsResult.success || !basktsResult.data) {
        return {
          success: false,
          message: 'Failed to fetch baskts',
          data: null,
        };
      }

      const rawBaskts = basktsResult.data;
      const basktIds = rawBaskts.map((b) => b.basktId?.toString() || '').filter(Boolean);

      let batchNavData = null;
      if (basktIds.length > 0) {
        const navPromises = basktIds.map(async (basktId) => {
          try {
            const result = await querier.baskt.getBasktNAV(basktId);
            return {
              basktId,
              success: result.success,
              nav: result.success ? result.data?.nav : null,
              error: result.success ? null : result.message,
            };
          } catch (error) {
            return {
              basktId,
              success: false,
              nav: null,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        });

        const navResults = await Promise.all(navPromises);
        batchNavData = {
          success: true,
          data: navResults,
          message: `Successfully fetched NAV data for ${navResults.length} baskts`,
        };
      }

      const oiPromises = rawBaskts.map(async (baskt) => {
        try {
          const oiResult = await querier.metrics.getOpenInterestForBaskt({
            basktId: baskt.basktId?.toString() || '',
            positionStatus: PositionStatus.OPEN,
          });
          return {
            basktId: baskt.basktId?.toString(),
            totalOI: oiResult.success ? oiResult.data?.totalOpenInterest || 0 : 0,
          };
        } catch (error) {
          return {
            basktId: baskt.basktId?.toString(),
            totalOI: 0,
          };
        }
      });

      const oiResults = await Promise.all(oiPromises);

      const basktsWithNav = rawBaskts.map((baskt) => {
        let currentNav = parseFloat(baskt.baselineNav?.toString() || '0') || 0;

        if (batchNavData?.success && 'data' in batchNavData && batchNavData.data) {
          const navData = batchNavData.data.find(
            (nav: any) => nav.basktId === baskt.basktId?.toString(),
          );
          if (navData?.success && navData.nav) {
            currentNav = navData.nav;
          }
        }

        const oiData = oiResults.find((oi) => oi.basktId === baskt.basktId?.toString()) || {
          totalOI: 0,
        };

        let currentWeights: number[] = [];
        if (input.includeCurrentWeights && baskt?.assets && baskt.assets.length > 0) {
          try {
            currentWeights = calculateCurrentWeights(baskt.assets);
          } catch (error) {
            logger.error('Error calculating current weights using SDK:', error);
            currentWeights = baskt.assets.map((asset: any) => asset.weight);
          }
        } else {
          currentWeights = baskt.assets.map((asset: any) => asset.weight);
        }

        const assets = (baskt?.assets || []).map((asset: any, index: number) => {
          const currentWeight = currentWeights[index] || asset?.weight || 0;

          return {
            id: asset?.id,
            assetAddress: asset?.assetAddress,
            logo: asset?.logo,
            name: asset?.name,
            ticker: asset?.ticker,
            priceProvider: asset?.priceConfig?.provider || {},
            baselinePrice: asset?.baselinePrice || '',
            direction: asset?.direction || false,
            weight: asset?.weight || 0,
            price: asset?.price || null,
            currentWeight: input.includeCurrentWeights ? currentWeight : undefined,
          };
        });

        const rebalancePeriod = baskt?.rebalancePeriod || 0;
        const rebalancingMode = rebalancePeriod === 0 ? 'Manual' : 'Automatic';
        const rebalancingPeriod = rebalancePeriod === 0 ? 'Manual' : rebalancePeriod;

        return {
          baskt: {
            name: baskt?.name || '',
            basktId: baskt?.basktId || '',
            creator: baskt?.creator || '',
            status: baskt?.status || '',
            isPublic: baskt?.isPublic || false,
            totalAssets: assets.length,
          },
          rebalance: {
            rebalancePeriod: rebalancePeriod,
            rebalancingMode: rebalancingMode,
            rebalancingPeriod: rebalancingPeriod,
            lastRebalanceTime: baskt?.lastRebalanceTime || 0,
          },
          assets: assets,
          metrics: {
            performance: baskt?.performance || { daily: 0, weekly: 0, monthly: 0, year: 0 },
            openInterest: oiData.totalOI,
            currentNav: currentNav,
            baselineNav: baskt?.baselineNav || '0',
          },
        };
      });

      const publicBaskts = basktsWithNav.filter((b) => b.baskt.isPublic);

      const trendingBaskts = publicBaskts.filter((baskt) => {
        const dailyPerformance = baskt.metrics?.performance?.daily || 0;
        return dailyPerformance > 4.0;
      });

      const yourBaskts = input.userAddress
        ? basktsWithNav.filter((b) => b.baskt.creator?.toString() === input.userAddress)
        : [];

      const combinedBaskts = input.userAddress
        ? Array.from(
            new Map(
              [...publicBaskts, ...yourBaskts].map((baskt) => [
                baskt.baskt.basktId?.toString(),
                baskt,
              ]),
            ).values(),
          )
        : publicBaskts;

      let resultData = null;
      let message = '';

      switch (input.dataType) {
        case 'baskts':
          resultData = basktsWithNav;
          message = `Successfully fetched baskts`;
          break;

        case 'publicBaskts':
          resultData = publicBaskts;
          message = `Successfully fetched public baskts`;
          break;

        case 'trendingBaskts':
          resultData = trendingBaskts;
          message = `Successfully fetched trending baskts`;
          break;

        case 'yourBaskts':
          if (!input.userAddress) {
            return {
              success: false,
              message: 'User address required for yourBaskts',
              data: null,
            };
          }
          resultData = yourBaskts;
          message = `Successfully fetched user baskts`;
          break;

        case 'combinedBaskts':
        default:
          resultData = combinedBaskts;
          message = `Successfully fetched combined baskts`;
          break;
      }

      return {
        success: true,
        data: resultData,
        message,
        userAddress: input.userAddress,
      };
    } catch (error) {
      logger.error('Error fetching explore page baskts:', error);
      return {
        success: false,
        message: 'Failed to fetch explore page baskts',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      };
    }
  });

export const getRouter = {
  getBasktMetadataByAddress,
  getBasktMetadataByName,
  getAllBaskts,
  getBasktNAV,
  getBatchBasktNAV,
  getTradingData,
  getExplorePageBaskts,
};
