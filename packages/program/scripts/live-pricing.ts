import dotenv from 'dotenv';
dotenv.config();

import assetConfig from './assets.json';
import { AssetMetadataModel } from '../../../services/backend/src/utils/models';
import { connectMongoDB } from '../../../services/backend/src/config/mongo';

async function updatePrices() {
  console.log('Updating prices for assets');

  const prices = assetConfig.map((a) => ({
    ticker: a.ticker,
    price: (Math.random() * a.price * 1e9).toString(),
    timestamp: Date.now(),
  }));

  // Prepare bulk operations
  const bulkOps = prices.map((price) => ({
    updateOne: {
      filter: { ticker: price.ticker },
      update: {
        $set: {
          priceMetrics: {
            price: price.price,
            change24h: 0,
            timestamp: price.timestamp,
          },
        },
      },
    },
  }));

  // Execute bulk update
  await AssetMetadataModel.bulkWrite(bulkOps);

  console.log(`Updated prices for ${prices.length} assets`);
}

async function main() {
  await connectMongoDB();
  await updatePrices();
  setInterval(() => {
    updatePrices();
  }, 30 * 1000);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
