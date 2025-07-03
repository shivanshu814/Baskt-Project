import { Worker } from 'bullmq';
import { pricingQueue, connection } from './config/queue';
import { AssetMetadataModel as AssetMetadataModelType, AssetMetadataSchema } from '@baskt/types';
import { fetchAssetPrices } from '@baskt/sdk';
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

    const priceDBID = oracleConfig.ticker;

    try {
      const prices = await fetchAssetPrices([oracleConfig.priceConfig]);
      const currentPrice = Number(prices[0].priceUSD);

      await AssetPrice.create({
        asset_id: priceDBID,
        price: currentPrice,
        time: new Date(),
      });

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get the oldest price from the last 24 hours
      const oldestPrice = await AssetPrice.findOne({
        where: {
          asset_id: priceDBID,
          time: {
            [Op.gte]: twentyFourHoursAgo,
          },
        },
        order: [['time', 'ASC']],
      });

      // Also get the price from exactly 24 hours ago if available
      const exactly24hAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const price24hAgo = await AssetPrice.findOne({
        where: {
          asset_id: priceDBID,
          time: {
            [Op.lte]: exactly24hAgo,
          },
        },
        order: [['time', 'DESC']],
      });

      let change24h = 0;
      let price24hAgoValue = currentPrice;

      if (price24hAgo) {
        price24hAgoValue = Number(price24hAgo.get('price'));
      } else if (oldestPrice) {
        price24hAgoValue = Number(oldestPrice.get('price'));
      }

      // Calculate percentage change
      if (price24hAgoValue > 0 && price24hAgoValue !== currentPrice) {
        change24h = ((currentPrice - price24hAgoValue) / price24hAgoValue) * 100;
      }

      await AssetMetadataModel.updateOne(
        { _id: (oracleConfig as any)._id },
        {
          $set: {
            priceMetrics: {
              price: currentPrice,
              change24h: change24h,
              timestamp: new Date().getTime(),
            },
          },
        },
      );
      console.log('Stored price, current price: ', currentPrice, 'SYMBOL', priceDBID);
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
