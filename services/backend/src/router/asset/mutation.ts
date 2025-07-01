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
        units: z.number().positive().default(1),
      }),
      coingeckoId: z.string().optional(),
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
      if (input.coingeckoId) {
        asset.set('coingeckoId', input.coingeckoId);
      }
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
      name: z.string().min(1).optional(),
      logo: z.string().min(1).optional(),
      priceConfig: z.object({
        provider: z.object({
          id: z.string().min(1).optional(),
          name: z.string().min(1).optional(),
          chain: z.string().optional(),
        }).optional(),
        twp: z.object({
          seconds: z.number().positive().optional(),
        }).optional(),
        updateFrequencySeconds: z.number().positive().optional(),
        units: z.number().positive().optional(),
      }).optional(),
      coingeckoId: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const { assetId, name, logo, priceConfig, coingeckoId } = input;
      const asset = await AssetMetadataModel.findById(assetId);

      if (!asset) {
        return { success: false, message: 'Asset not found' };
      }

      // Only update fields that are provided
      if (name) {
        asset.name = name;
      }
      
      if (logo) {
        asset.logo = logo;
      }
      
      if (coingeckoId) {
        asset.set('coingeckoId', coingeckoId);
      }
      
      if (priceConfig) {
        // Update provider fields if provided
        if (priceConfig.provider) {
          if (priceConfig.provider.name) {
            asset.priceConfig.provider.name = priceConfig.provider.name;
          }
          if (priceConfig.provider.id) {
            asset.priceConfig.provider.id = priceConfig.provider.id;
          }
          if (priceConfig.provider.chain) {
            asset.priceConfig.provider.chain = priceConfig.provider.chain;
          }
        }
        
        // Update TWP if provided
        if (priceConfig.twp?.seconds) {
          if (!asset.priceConfig.twp) asset.priceConfig.twp = { seconds: 60 };
          asset.priceConfig.twp.seconds = priceConfig.twp.seconds;
        }
        
        // Update update frequency if provided
        if (priceConfig.updateFrequencySeconds) {
          asset.priceConfig.updateFrequencySeconds = priceConfig.updateFrequencySeconds;
        }
        
        // Update units if provided
        if (priceConfig.units) {
          (asset.priceConfig as any).units = priceConfig.units;
        }
      }
      
      await asset.save();

      return { success: true, data: asset };
    } catch (error) {
      console.error('Error updating asset:', error);
      return { success: false, message: 'Failed to update asset' };
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
