import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/querier';

export const getLiquidityPool = publicProcedure.query(async () => {
  try {
    const result = await querier.pool.getLiquidityPool();
    return result;
  } catch (error) {
    console.error('Error fetching liquidity pool:', error);
    return {
      success: false,
      error: 'Failed to fetch liquidity pool data',
    };
  }
});

export const getPoolDeposits = publicProcedure.query(async () => {
  try {
    const result = await querier.pool.getPoolDeposits();
    return result;
  } catch (error) {
    console.error('Error fetching pool deposits:', error);
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
