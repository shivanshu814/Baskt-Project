import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { querier } from '../../utils/querier';
import { generateNavHistory } from '../../fakers/price';
import { BN } from 'bn.js';

// get baskt metadata by id
const getBasktMetadataById = publicProcedure
  .input(z.object({ basktId: z.string() }))
  .query(async ({ input }) => {
    try {
      const result = await querier.baskt.getBasktById(input.basktId);
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
const getAllBaskts = publicProcedure.query(async () => {
  try {
    const result = await querier.baskt.getAllBaskts({ withConfig: true });
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

    const basktInfo = await querier.baskt.getBasktById(basktId);
    if (!basktInfo || !basktInfo.success || !basktInfo.data) {
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

    const priceHistory = generateNavHistory(
      (basktInfo.data.account as any)?.currentAssetConfigs || [],
      new BN(1e6),
    );

    const filteredData = priceHistory.daily
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
      const result = await querier.baskt.getBasktByName(input.basktName, { withConfig: true });
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

export const getRouter = {
  getBasktMetadataById,
  getBasktMetadataByName,
  getAllBaskts,
  getBasktNAV,
  getTradingData,
};
