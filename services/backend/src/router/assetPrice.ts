import { AssetPrice } from '../config/timescale';
import { Op } from 'sequelize';
import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';

export const assetPriceRouter = router({
  getAssetPrice: publicProcedure
    .input(
      z.object({
        assetId: z.string().min(1),
        startDate: z.number().min(1),
        endDate: z.number().min(1),
      }),
    )
    .query(async ({ input }) => {
      return getAssetPriceInternal(input.assetId, input.startDate, input.endDate);
    }),
});

async function getAssetPriceInternal(assetId: string, startDate: number, endDate: number) {
  try {
    const assetPriceRows = await AssetPrice.findAll({
      where: {
        asset_id: assetId,
        time: {
          [Op.gte]: new Date(startDate * 1000),
          [Op.lte]: new Date(endDate * 1000),
        },
      },
    });
    return assetPriceRows.map((row: any) => {
      const plain = row.toJSON();
      return formatAssetPrice(plain);
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw new Error('Failed to fetch assets');
  }
}

function formatAssetPrice(assetPrice: any) {
  return {
    time: assetPrice.time ? Math.floor(new Date(assetPrice.time).getTime() / 1000) : null,
    price:
      assetPrice.price && !isNaN(Number(assetPrice.price)) ? Number(assetPrice.price) / 1e9 : null,
    rawPrice: assetPrice.price,
  };
}
