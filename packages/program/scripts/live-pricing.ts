import dotenv from 'dotenv';
dotenv.config();

import assetConfig from './assets.json';
import { AssetMetadataModel, connectMongoDB } from '../../querier/dist';

const lastPrice: Record<string, number> = {};

const deviationPercent = parseInt(process.argv[2]) || 3;

async function updatePrices() {
  console.log('Updating prices for assets');
  const prices = [];
  for (const a of assetConfig) {    
    let  deviation = Math.random() * deviationPercent * lastPrice[a.ticker] / 100;
    if (Math.random() < 0.5) {
      deviation = -deviation;
    }
    const price = (lastPrice[a.ticker]) + deviation;
    prices.push({
      ticker: a.ticker,
      price: price,
      timestamp: Date.now(),
    });
    lastPrice[a.ticker] = price;
  }

  // Prepare bulk operations
  const bulkOps = prices.map((price) => ({
    updateOne: {
      filter: { ticker: price.ticker },
      update: {
        $set: {
          priceRaw: price.price,
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
  console.log("Starting live pricing");
  for (const a of assetConfig) {
    lastPrice[a.ticker] = a.price * 1e6;
  }
  await updatePrices();  
  setInterval(() => {
    updatePrices();
  }, 1 * 1000);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
