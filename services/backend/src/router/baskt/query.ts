import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/querier';

// get baskt metadata by id
const getBasktMetadataById = publicProcedure
  .input(z.object({ basktId: z.string(), withPerformance: z.boolean().default(false) }))
  .query(async ({ input }) => {
    try {
      const result = await querier.baskt.getBasktById(input.basktId, {
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
  .input(z.object({ withPerformance: z.boolean().default(false) }))
  .query(async ({ input }) => {
    try {
      const result = await querier.baskt.getAllBaskts({
        withConfig: true,
        withPerformance: input.withPerformance,
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
      console.log('🔍 Fetching baskt NAV for:', input.basktId);
      const result = await querier.baskt.getBasktNAV(input.basktId);
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

// get baskt metadata by name
const getBasktMetadataByName = publicProcedure
  .input(z.object({ basktName: z.string(), withPerformance: z.boolean().default(false) }))
  .query(async ({ input }) => {
    try {
      const result = await querier.baskt.getBasktByName(input.basktName, {
        withConfig: true,
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

export const getRouter = {
  getBasktMetadataById,
  getBasktMetadataByName,
  getAllBaskts,
  getBasktNAV,
  getTradingData,
};
