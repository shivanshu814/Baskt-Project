import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { querier } from '../../utils/querier';

// get baskt metadata by id
const getBasktMetadataById = publicProcedure
  .input(z.object({ basktId: z.string(), withPerformance: z.boolean().default(false) }))
  .query(async ({ input }) => {
    try {
      const result = await querier.baskt.getBasktById(input.basktId, { withPerformance: input.withPerformance });
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
const getAllBaskts = publicProcedure.input(z.object({ withPerformance: z.boolean().default(false) })).query(async ({ input }) => {
  try {
    const result = await querier.baskt.getAllBaskts({ withConfig: true, withPerformance: input.withPerformance });
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
    const result = await querier.baskt.getBasktByName(input.basktName, { withConfig: true, withPerformance: input.withPerformance });
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

      const dailyData = result.data
        .filter((item) => item.time && item.price)
        .reduce((acc, item) => {
          const dayTimestamp = Math.floor((item.time || 0) / (24 * 60 * 60)) * (24 * 60 * 60);
          const price = item.price || 0;

          if (!acc[dayTimestamp]) {
            acc[dayTimestamp] = {
              time: dayTimestamp,
              values: [],
              count: 0,
              min: price,
              max: price,
            };
          }

          acc[dayTimestamp].values.push(price);
          acc[dayTimestamp].count++;
          acc[dayTimestamp].min = Math.min(acc[dayTimestamp].min, price);
          acc[dayTimestamp].max = Math.max(acc[dayTimestamp].max, price);

          return acc;
        }, {} as Record<number, { time: number; values: number[]; count: number; min: number; max: number }>);

      const allData = Object.values(dailyData)
        .map((day) => ({
          time: day.time,
          value: day.values.reduce((sum, val) => sum + val, 0) / day.count,
          min: day.min,
          max: day.max,
          count: day.count,
        }))
        .sort((a, b) => a.time - b.time);

      return {
        success: true,
        data: allData,
        dataSource: 'nav-tracker',
        message: 'All NAV data from nav-tracker service',
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
