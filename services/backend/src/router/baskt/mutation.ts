import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { BasktMetadataModel, AssetMetadataModel } from '../../utils/models';
import { getAssetIdFromAddress } from '../asset/query';

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
    const existingBaskt = await BasktMetadataModel.findOne({ basktId: input.basktId });
    if (existingBaskt) {
      return {
        success: false,
        message: 'Baskt with this ID already exists',
        error: 'Duplicate basktId',
      };
    }

    const assetIds = await Promise.all(input.assets.map((asset) => getAssetIdFromAddress(asset)));

    const newBasktMetadata = new BasktMetadataModel({
      ...input,
      assets: assetIds,
      creationDate: new Date(),
    });

    const savedBasktMetadata = await newBasktMetadata.save();

    for (const assetId of assetIds) {
      const asset = await AssetMetadataModel.findById(assetId);
      if (asset) {
        if (!asset.basktIds) asset.basktIds = [];
        if (!asset.basktIds.includes(savedBasktMetadata.basktId)) {
          asset.basktIds.push(savedBasktMetadata.basktId);
          await asset.save();
        }
      }
    }

    return {
      success: true,
      data: savedBasktMetadata,
    };
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
