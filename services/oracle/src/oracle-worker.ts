import { Worker } from 'bullmq';
import { pricingQueue, connection } from './config/queue';
import { AssetMetadataModel as AssetMetadataModelType, AssetMetadataSchema } from '@baskt/types';
import { fetchAssetPrices } from './pricing';
import { connectMongoDB } from './config/mongo';
import { AssetPrice } from './config/sequelize';
import { Op } from 'sequelize';
import mongoose from 'mongoose';

//TODO: We need to store strings as stuff for all numbers
//TODO: This is broken for 24h window

const AssetMetadataModel = mongoose.model('AssetMetadata', AssetMetadataSchema);

// Worker instance with concurrency control
const pricingWorker = new Worker(
  pricingQueue.name,
  async (job) => {
    console.log(`Processing job: ${job.name} ${job.data._id}`);

    await connectMongoDB();

    const oracleConfig = job.data as AssetMetadataModelType;

    try {
      const prices = await fetchAssetPrices([oracleConfig.priceConfig]);

      await AssetPrice.create({
        asset_id: (oracleConfig as any)._id,
        price: prices[0].priceUSD,
        time: new Date(),
      });
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const oldestPrice = await AssetPrice.findOne({
        where: {
          asset_id: (oracleConfig as any)._id,
          time: {
            [Op.gte]: twentyFourHoursAgo,
          },
        },
        order: [['time', 'ASC']],
      });

      const priceChange24h =
        BigInt(prices[0].priceUSD) -
        BigInt((oldestPrice?.get('price') as number) || prices[0].priceUSD);

      await AssetMetadataModel.updateOne(
        { _id: (oracleConfig as any)._id },
        {
          $set: {
            priceMetrics: {
              price: prices[0].priceUSD.toString(),
              change24h: priceChange24h.toString(),
              timestamp: new Date().getTime(),
            },
          },
        },
      );

      console.log(`Storing ${oracleConfig.name} prices:`, prices[0].priceUSD, priceChange24h);
    } catch (error) {
      console.error(`Error fetching prices for ${oracleConfig.name}:`, error);
    }
  },
  {
    concurrency: 5, // Process up to 5 jobs in parallel
    connection,
  },
);

console.log('Pricing worker started, waiting for jobs...');
