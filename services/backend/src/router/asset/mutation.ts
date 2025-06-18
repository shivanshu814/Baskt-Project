import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { AssetMetadataModel } from '../../utils/models';

// create an asset
export const createAsset = publicProcedure
  .input(
    z.object({
      ticker: z.string().min(1),
      name: z.string().min(1),
      assetAddress: z.string().min(1),
      logo: z.string().min(1),
      priceConfig: z.object({
        provider: z.object({
          id: z.string().min(1),
          chain: z.string().min(0).optional().default(''),
          name: z.string().min(1),
        }),
        twp: z.object({
          seconds: z.number().positive(),
        }),
        updateFrequencySeconds: z.number().positive(),
      }),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const existingAsset = await AssetMetadataModel.findOne({ ticker: input.ticker });
      if (existingAsset) {
        return { success: false, message: 'Ticker already exists' };
      }
      const asset = new AssetMetadataModel({
        ...input,
      });
      await asset.save();
      return { success: true, data: asset };
    } catch (error) {
      console.error('Error creating asset:', error);
      return { success: false, message: 'Failed to create asset' };
    }
  });

// update an assets basktIds
export const updateAssetBasktIds = publicProcedure
  .input(z.object({ assetId: z.string(), basktId: z.string() }))
  .mutation(async ({ input }) => {
    try {
      const asset = await AssetMetadataModel.findById(input.assetId);
      if (!asset) {
        return { success: false, message: 'Asset not found' };
      }
      if (!asset.basktIds) asset.basktIds = [];
      if (!asset.basktIds.includes(input.basktId)) {
        asset.basktIds.push(input.basktId);
        await asset.save();
      }
      return { success: true, data: asset };
    } catch (error) {
      console.error('Error updating asset basktIds:', error);
      return { success: false, message: 'Failed to update asset basktIds' };
    }
  });
