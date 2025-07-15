import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { querier } from '../../utils/querier';

const createBasktSchema = z.object({
  basktId: z.string(),
  name: z.string().min(1).max(30),
  creator: z.string(),
  assets: z.array(z.string()),
  rebalancePeriod: z.object({
    value: z.number().min(1),
    unit: z.enum(['day', 'hour']),
  }),
  txSignature: z.string(),
});

// create baskt metadata
const createBasktMetadata = publicProcedure.input(createBasktSchema).mutation(async ({ input }) => {
  try {
    const result = await querier.metadata.createBaskt(input);
    return result;
  } catch (error) {
    console.error('Error creating baskt metadata:', error);
    return {
      success: false,
      message: 'Failed to create baskt metadata',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

export const mutationRouter = {
  createBasktMetadata,
};
