import { querierClient } from '../config/client';
import { AssetPriceDBValue } from '@baskt/types';
import { AssetPrice } from '@baskt/querier';

// Configuration
const PRICE_PRECISION = 1e6; // 1e6 precision for prices
const MIN_PRICE = 0;
const MAX_PRICE = 1000;
const DAYS_BACK = 45; // Generate data for the past year
const PRICE_VOLATILITY = 0.5; // 50% daily price volatility for realistic price movements


/**
 * Generate a realistic price based on a base price with some volatility
 */
function generateRealisticPrice(basePrice: number, volatility: number = PRICE_VOLATILITY): string {
  // Add some random volatility to make price movements realistic
  const change = (Math.random() - 0.5) * 2 * volatility; // -volatility to +volatility
  const newPrice = basePrice * (1 + change);
  
  // Ensure price stays within bounds
  const clampedPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, newPrice));
  
  // Round to 1e6 precision
  return (clampedPrice * PRICE_PRECISION).toString();
}

/**
 * Generate mock price data for the given asset IDs going back a year
 */
function generateMockHistoricalPriceData(assetIds: string[]): AssetPriceDBValue[] {
  const now = new Date();
  const mockData: AssetPriceDBValue[] = [];
  
  for (const assetId of assetIds) {
    // Start with a random base price for each asset
    let basePrice = 100;
    
    // Generate daily prices going back DAYS_BACK days
    for (let daysBack = DAYS_BACK; daysBack >= 0; daysBack--) {
      const date = new Date(now);
      date.setDate(date.getDate() - daysBack);
      
      // Generate realistic price movement
      const price = generateRealisticPrice(basePrice);
      
      mockData.push({
        assetId,
        price,
        time: date.getTime()
      });
    }
  }

  return mockData;
}

/**
 * Store the generated price data to the database
 */
async function storePriceData(priceData: AssetPriceDBValue[]): Promise<void> {
  try {
    if (!priceData.length) return;
    
    await AssetPrice.bulkCreate(priceData.map(n => ({
      asset_id: n.assetId,
      price: n.price,
      time: n.time
    })));
    
    console.log(`Successfully stored ${priceData.length} mock price records`);
  } catch (err) {
    console.error('Error storing mock price data:', err);
    throw err;
  }
}

/**
 * Main function to generate and store mock historical price data
 */
export async function generateAndStoreMockData(assetIds?: string[]): Promise<void> {
  try {
    // Initialize the querier client
    await querierClient.init();
    
    // Get all baskts if no specific asset IDs provided
    const baskts = await querierClient.baskt.getAllBaskts();
    const targetAssetIds = assetIds || baskts.data?.map(b => b.basktId.toString()) || [];
    
    if (!targetAssetIds.length) {
      console.log('No asset IDs found, skipping mock data generation');
      return;
    }
    
    console.log(`[${new Date().toISOString()}] Starting mock historical price data generation...`);
    console.log(`Target asset IDs: ${targetAssetIds.join(', ')}`);
    console.log(`Generating ${DAYS_BACK + 1} days of data for each asset`);
    
    // Generate mock historical price data
    const mockPriceData = generateMockHistoricalPriceData(targetAssetIds);
    
    // Log sample of generated data for verification
    console.log(`Generated ${mockPriceData.length} total price records`);
    console.log('Sample of generated prices:');
    
    // Show first few records for each asset
    targetAssetIds.slice(0, 3).forEach(assetId => {
      const assetData = mockPriceData.filter(d => d.assetId === assetId);
      if (assetData.length > 0) {
        console.log(`  ${assetId}: ${assetData[0].price} (latest), ${assetData[assetData.length - 1].price} (oldest)`);
      }
    });
    
    // Store the data
    await storePriceData(mockPriceData);
    
    console.log(`Mock historical price data generation completed successfully.`);
    console.log(`Processed ${targetAssetIds.length} assets, stored ${mockPriceData.length} records.`);
    console.log(`Data covers ${DAYS_BACK + 1} days from today back to ${new Date(Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000).toISOString()}`);
    
  } catch (err) {
    console.error('Error in mock historical price data generation process:', err);
    throw err;
  }
}

// Standalone execution function
async function main() {
  try {
    // You can pass custom asset IDs here, or use all available baskts
    // await generateAndStoreMockData(['custom_id_1', 'custom_id_2']);
    await generateAndStoreMockData();
    
    console.log('Mock historical price data generation script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Mock historical price data generation script failed:', error);
    process.exit(1);
  }
}

main(); 