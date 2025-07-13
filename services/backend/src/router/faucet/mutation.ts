import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { querier } from '../../utils/querier';

// send usdc to a user
export const faucet = publicProcedure
  .input(
    z.object({
      recipient: z.string().min(32),
      amount: z.number().positive(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const result = await querier.faucet.sendUSDC(input);
      return result;
    } catch (error: any) {
      console.error('Faucet error:', error);
      return { success: false, error: error.message || 'Faucet failed' };
    }
  });

// automatic faucet when code is used - sends 100,000 USDC
export const autoFaucet = publicProcedure
  .input(
    z.object({
      recipient: z.string().min(32),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const result = await querier.faucet.autoFaucet(input);
      return result;
    } catch (error: any) {
      console.error('Auto faucet error:', error);
      return { success: false, error: error.message || 'Auto faucet failed' };
    }
  });
