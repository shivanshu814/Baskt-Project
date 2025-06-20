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

// update an asset's price config
export const updateAssetPriceConfig = publicProcedure
  .input(
    z.object({
      assetId: z.string(),
      priceConfig: z.object({
        provider: z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          chain: z.string().optional().default(''),
        }),
      }),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const { assetId, priceConfig } = input;
      const asset = await AssetMetadataModel.findById(assetId);

      if (!asset) {
        return { success: false, message: 'Asset not found' };
      }

      asset.priceConfig.provider = priceConfig.provider;
      await asset.save();

      return { success: true, data: asset };
    } catch (error) {
      console.error('Error updating asset price config:', error);
      return { success: false, message: 'Failed to update asset price config' };
    }
  });

// delete an asset
export const deleteAsset = publicProcedure
  .input(z.object({ assetId: z.string() }))
  .mutation(async ({ input }) => {
    try {
      const { assetId } = input;
      const result = await AssetMetadataModel.findByIdAndDelete(assetId);

      if (!result) {
        return { success: false, message: 'Asset not found' };
      }

      return { success: true, message: 'Asset deleted successfully' };
    } catch (error) {
      console.error('Error deleting asset:', error);
      return { success: false, message: 'Failed to delete asset' };
    }
  });
