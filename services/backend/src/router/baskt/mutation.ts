import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { querier } from '../../utils/';
import { PublicKey } from '@solana/web3.js';
import mongoose, { ObjectId } from 'mongoose';
import { OnchainAssetConfig } from '@baskt/types';

const createBasktSchema = z.object({
  basktId: z.string(),
  name: z.string().min(1).max(30),
  txSignature: z.string(),
});

// create baskt metadata
// const createBasktMetadata = publicProcedure.input(createBasktSchema).mutation(async ({ input }) => {
//   try {
//     const basktAccount = await querier.getBasktClient().readWithRetry(async () => await querier.getBasktClient().getBasktRaw(new PublicKey(input.basktId), 'confirmed'));
//     const result = await querier.metadata.createBaskt({ 
//       basktId: input.basktId.toString(),
//       name: input.name,
//       uid: basktAccount.uid,
//       creator: basktAccount.creator.toString(),
//       creationTxSignature: input.txSignature,
//       currentAssetConfigs: basktAccount.currentAssetConfigs.map((asset: OnchainAssetConfig) => ({
//         assetId: asset.assetId.toString(),
//         direction: asset.direction,
//         weight: asset.weight.toNumber(),
//         baselinePrice: asset.baselinePrice.toString(),
//       })),
//       isPublic: false,
//       status: 'Pending',
//       openPositions: 0,
//       lastRebalanceTime: 0,
//       baselineNav: '0',
//       rebalancePeriod: 0,
//       config: {
//         openingFeeBps: 0,
//         closingFeeBps: 0,
//         liquidationFeeBps: 0,
//         minCollateralRatioBps: 0,
//         liquidationThresholdBps: 0,
//       },
//       fundingIndex: {
//         cumulativeIndex: 0,
//         lastUpdateTimestamp: 0,
//         currentRate: 0,
//       },
//       rebalanceFeeIndex: {
//         cumulativeIndex: 0,
//         lastUpdateTimestamp: 0,
//       },
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });
//     return result;
//   } catch (error) {
//     console.error('Error creating baskt metadata:', error);
//     return {
//       success: false,
//       message: 'Failed to create baskt metadata',
//       error: error instanceof Error ? error.message : 'Unknown error',
//     };
//   }
// });

export const mutationRouter = {
  // createBasktMetadata,
};
