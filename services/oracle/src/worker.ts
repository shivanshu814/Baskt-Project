import { Worker } from 'bullmq';
import { pricingQueue, connection } from './config/queue';
import { AssetMetadataModel } from '@baskt/types';
import { fetchAssetPrices } from './pricing';

import { AssetPrice } from './config/sequelize';

// Worker instance with concurrency control
const pricingWorker = new Worker(
  pricingQueue.name,
  async (job) => {
    console.log(`Processing job: ${job.name} ${job.data._id}`);

    const oracleConfig = job.data as AssetMetadataModel;

    try {
      const prices = await fetchAssetPrices([oracleConfig.priceConfig]);

      await AssetPrice.create({
        asset_id: (oracleConfig as any)._id,
        price: prices[0].priceUSD,
        time: new Date(),
      });

      console.log(`Storing ${oracleConfig.name} prices:`, prices[0].priceUSD);
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
