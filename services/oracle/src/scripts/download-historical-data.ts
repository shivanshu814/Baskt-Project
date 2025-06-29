import axios from 'axios';
import { sequelizeConnection, AssetPrice } from '../config/sequelize';
import dotenv from 'dotenv';
import { Op } from 'sequelize';

dotenv.config();

// Define the assets to download historical data for
const ASSETS = [
  {
    ticker: 'BTC',
    coingeckoId: 'bitcoin',
    assetId: 'btc'
  },
];

const COINGECKO_API_KEY = process.env.COINGECKO_API;

interface CoinGeckoHistoricalData {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

async function fetchHistoricalData(
  coingeckoId: string,
  days: number = 30
): Promise<CoinGeckoHistoricalData | null> {
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  
  // Convert to Unix timestamps (seconds)
  const fromTimestamp = Math.floor(startDate.getTime() / 1000);
  const toTimestamp = Math.floor(endDate.getTime() / 1000);
  
  const url = `https://pro-api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart/range?vs_currency=usd&from=${fromTimestamp}&to=${toTimestamp}&interval=hourly`;
  
  const options = {
    method: 'GET',
    headers: { 
      accept: 'application/json', 
      'x-cg-pro-api-key': COINGECKO_API_KEY 
    }
  };

  try {
    console.log(`Fetching historical data for ${coingeckoId}...`);
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    console.log(`URL: ${url}`);
    
    const response = await axios.get(url, options);
    return response.data;
  } catch (error) {
    console.error(`Error fetching historical data for ${coingeckoId}:`, error);
    return null;
  }
}

async function storeHistoricalData(assetId: string, historicalData: CoinGeckoHistoricalData) {
  const { prices } = historicalData;
  
  console.log(`Storing ${prices.length} price points for ${assetId}...`);
  
  // Convert price data to database format
  const priceRecords = prices.map(([timestamp, price]) => ({
    asset_id: assetId,
    price: price.toString(),
    time: new Date(timestamp)
  }));

  // Check for existing data to avoid duplicates
  const existingData = await AssetPrice.findAll({
    where: {
      asset_id: assetId,
      time: {
        [Op.gte]: new Date(prices[0][0]), // From the earliest timestamp
        [Op.lte]: new Date(prices[prices.length - 1][0]) // To the latest timestamp
      }
    }
  });

  if (existingData.length > 0) {
    console.log(`Found ${existingData.length} existing records for ${assetId}, skipping...`);
    return;
  }

  // Store data in batches to avoid memory issues
  const batchSize = 1000;
  for (let i = 0; i < priceRecords.length; i += batchSize) {
    const batch = priceRecords.slice(i, i + batchSize);
    await AssetPrice.bulkCreate(batch, {
      ignoreDuplicates: true
    });
    console.log(`Stored batch ${Math.floor(i / batchSize) + 1} for ${assetId}`);
  }

  console.log(`Successfully stored ${priceRecords.length} price points for ${assetId}`);
}

async function downloadHistoricalDataForAsset(asset: typeof ASSETS[0], days: number = 30) {
  console.log(`\n=== Processing ${asset.ticker} (${asset.coingeckoId}) ===`);
  
  const historicalData = await fetchHistoricalData(asset.coingeckoId, days);
  
  if (!historicalData) {
    console.error(`Failed to fetch data for ${asset.ticker}`);
    return;
  }

  await storeHistoricalData(asset.assetId, historicalData);
}

async function downloadAllHistoricalData(days: number = 30) {
  console.log('Starting historical data download...');
  console.log(`Downloading ${days} days of hourly data for ${ASSETS.length} assets`);
  
  // Test database connection
  try {
    await sequelizeConnection.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return;
  }

  // Process each asset with a delay to respect rate limits
  for (const asset of ASSETS) {
    await downloadHistoricalDataForAsset(asset, days);
    
    // Add delay between requests to respect CoinGecko rate limits
    if (ASSETS.indexOf(asset) < ASSETS.length - 1) {
      console.log('Waiting 2 seconds before next request...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n=== Historical data download completed ===');
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const days = args[0] ? parseInt(args[0]) : 30;
  
  if (isNaN(days) || days <= 0) {
    console.error('Please provide a valid number of days (e.g., node download-historical-data.js 30)');
    process.exit(1);
  }

  try {
    await downloadAllHistoricalData(days);
  } catch (error) {
    console.error('Error during historical data download:', error);
    process.exit(1);
  } finally {
    await sequelizeConnection.close();
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { downloadAllHistoricalData, downloadHistoricalDataForAsset, ASSETS }; 