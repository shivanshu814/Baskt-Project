import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/querier';

// check if wallet is authorized
export const checkWalletAccess = publicProcedure
  .input(
    z.object({
      walletAddress: z.string(),
    }),
  )
  .query(async ({ input }) => {
    try {
      const result = await querier.access.checkWalletAccess(input);
      return result;
    } catch (error) {
      console.error('Error checking wallet access:', error);
      return {
        hasAccess: false,
        message: 'Error checking wallet access',
      };
    }
  });

// get all authorized wallets (for admin)
export const getAuthorizedWallets = publicProcedure.query(async () => {
  try {
    const result = await querier.access.getAuthorizedWallets();
    return result;
  } catch (error) {
    console.error('Error fetching authorized wallets:', error);
    return {
      success: false,
      error: 'Failed to fetch authorized wallets',
    };
  }
});

// get all access codes (for admin)
export const getAllAccessCodes = publicProcedure.query(async () => {
  try {
    const result = await querier.access.getAllAccessCodes();
    return result;
  } catch (error) {
    console.error('Error fetching access codes:', error);
    return {
      success: false,
      error: 'Failed to fetch access codes',
    };
  }
});
