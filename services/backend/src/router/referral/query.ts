import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/';
import logger from '../../utils/logger';

export const generateReferralCode = publicProcedure
  .input(
    z.object({
      userAddress: z.string(),
    }),
  )
  .query(async ({ input }) => {
    try {
      const result = await querier.referral.generateReferralCode(input);
      return result;
    } catch (error) {
      logger.error('Error generating referral code:', error);
      return {
        success: false,
        error: 'Failed to generate referral code',
      };
    }
  });

export const getUserReferralData = publicProcedure
  .input(
    z.object({
      userAddress: z.string(),
    }),
  )
  .query(async ({ input }) => {
    try {
      const result = await querier.referral.getUserReferralData(input.userAddress);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      logger.error('Error fetching user referral data:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to fetch user referral data',
      };
    }
  });
