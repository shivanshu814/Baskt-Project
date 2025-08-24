import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/';
import logger from '../../utils/logger';

export const getLiquidityPool = publicProcedure.query(async () => {
  try {
    logger.info('Getting liquidity pool data');

    const poolResult = await querier.pool.getLiquidityPool();

    if (!poolResult.success || !poolResult.data) {
      return {
        success: false,
        error: 'Failed to fetch liquidity pool data',
      };
    }

    const poolData = poolResult.data;

    // Get pool analytics (APR and fee data) from FeeEventQuerier
    const analyticsResult = await querier.feeEvent.getPoolAnalytics(
      poolData.totalLiquidity,
      30, // 30 days window
    );

    return {
      success: true,
      data: {
        ...poolData,
        // Add analytics data or default values
        apr: analyticsResult.success && analyticsResult.data ? analyticsResult.data.apr : '0.00',
        totalFeesEarned:
          analyticsResult.success && analyticsResult.data
            ? analyticsResult.data.totalFees.toString()
            : '0.00',
        recentFeeData:
          analyticsResult.success && analyticsResult.data
            ? analyticsResult.data.recentFeeData
            : {
                totalFees: '0.00',
                totalFeesToBlp: '0.00',
                eventCount: 0,
                timeWindowDays: 30,
              },
      },
    };
  } catch (error) {
    logger.error('Error fetching liquidity pool with fee data:', error);
    return {
      success: false,
      error: 'Failed to fetch liquidity pool data',
    };
  }
});



export const getPoolDeposits = publicProcedure.query(async () => {
  try {
    const depositsResult = await querier.pool.getPoolDeposits();
    return depositsResult;
  } catch (error) {
    logger.error('Error fetching pool deposits:', error);
    return {
      success: false,
      error: 'Failed to fetch pool deposits',
    };
  }
});

export const getRouter = {
  getLiquidityPool,
  getPoolDeposits,
};
