import { PositionStatus } from '@baskt/types';
import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/';


export const getOpenInterestForAllAssets = publicProcedure.query(async () => {
    try {
      const result = await querier.metrics.getOpenInterestForAllAssets();
      return result;
    } catch (error) {
      console.error('Error fetching open interest for all assets:', error);
      return { success: false, error: 'Failed to fetch open interest for all assets' };
    }
  });
