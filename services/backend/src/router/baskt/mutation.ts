import { BasktCreatedMessage, logger, STREAMS } from '@baskt/data-bus';
import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils';
import { publishToDataBus } from '../../utils/databus';

const createBasktSchema = z.object({
  basktId: z.string(),
  basktName: z.string().min(1).max(30),
  txSignature: z.string(),
});

const createBasktMetadata = publicProcedure.input(createBasktSchema).mutation(async ({ input }) => {
  try {
    const basktAccount = await querier
      .getBasktClient()
      .readWithRetry(
        async () =>
          await querier.getBasktClient().getBasktRaw(new PublicKey(input.basktId), 'confirmed'),
        5,
        2000,
      );

    if (!basktAccount) {
      throw new Error('Failed to read baskt account after confirmation');
    }

    logger.info('Baskt transaction confirmed, publishing to databus', { basktId: input.basktId });

    const basketCreatedPayload: BasktCreatedMessage = {
      basktId: input.basktId,
      basktName: input.basktName,
      creator: basktAccount.creator.toString(),
      timestamp: new Date().toISOString(),
      txSignature: input.txSignature,
    };

    try {
      await publishToDataBus(STREAMS.baskt.created, basketCreatedPayload);

      logger.info('Basket created event published to databus', {
        basktId: input.basktId,
        stream: STREAMS.baskt.created,
      });
    } catch (dataBusError) {
      logger.error(
        'Failed to publish to DataBus, continuing without event publishing:',
        dataBusError,
      );
    }
  } catch (error) {
    logger.error('Error processing baskt creation:', error);
  }
});

export const mutationRouter = {
  createBasktMetadata,
};
