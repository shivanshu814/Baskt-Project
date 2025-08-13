import { sequelizeConnection, AssetPrice } from '../config/sequelize';
import dotenv from 'dotenv';
import { Op } from 'sequelize';

dotenv.config();

// Same assets configuration as the download script
const ASSETS = [
  {
    ticker: 'BTC',
    coingeckoId: 'bitcoin',
    assetId: 'bitcoin-btc'
  },
  {
    ticker: 'ETH',
    coingeckoId: 'ethereum',
    assetId: 'ethereum-eth'
  },
  {
    ticker: 'SOL',
    coingeckoId: 'solana',
    assetId: 'solana-sol'
  },
  {
    ticker: 'USDC',
    coingeckoId: 'usd-coin',
    assetId: 'usd-coin-usdc'
  },
  {
    ticker: 'USDT',
    coingeckoId: 'tether',
    assetId: 'tether-usdt'
  }
];

interface VerificationResult {
  ticker: string;
  assetId: string;
  totalRecords: number;
  expectedRecords: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  missingHours: number;
  completeness: number; // percentage
  gaps: Array<{
    start: Date;
    end: Date;
    missingHours: number;
  }>;
}

function generateExpectedHours(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays * 24; // 24 hours per day
}

function findGapsInData(dataPoints: Array<{ time: Date }>): Array<{ start: Date; end: Date; missingHours: number }> {
  const gaps: Array<{ start: Date; end: Date; missingHours: number }> = [];
  
  if (dataPoints.length < 2) return gaps;

  // Sort data points by time
  const sortedData = dataPoints.sort((a, b) => a.time.getTime() - b.time.getTime());
  
  for (let i = 0; i < sortedData.length - 1; i++) {
    const current = sortedData[i].time;
    const next = sortedData[i + 1].time;
    
    // Calculate expected time for next hour
    const expectedNext = new Date(current.getTime() + 60 * 60 * 1000);
    
    // If there's a gap larger than 1 hour, it's a missing period
    if (next.getTime() - current.getTime() > 90 * 60 * 1000) { // Allow 90 minutes tolerance
      const gapStart = new Date(current.getTime() + 60 * 60 * 1000);
      const gapEnd = new Date(next.getTime() - 60 * 60 * 1000);
      const missingHours = Math.floor((gapEnd.getTime() - gapStart.getTime()) / (60 * 60 * 1000)) + 1;
      
      gaps.push({
        start: gapStart,
        end: gapEnd,
        missingHours
      });
    }
  }
  
  return gaps;
}

async function verifyAssetData(asset: typeof ASSETS[0], days: number = 30): Promise<VerificationResult> {
  console.log(`\n=== Verifying ${asset.ticker} (${asset.assetId}) ===`);
  
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  
  // Fetch all data points for this asset in the date range
  const dataPoints = await AssetPrice.findAll({
    where: {
      asset_id: asset.assetId,
      time: {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      }
    },
    order: [['time', 'ASC']],
    raw: true
  }) as unknown as Array<{ asset_id: string; price: string; time: Date }>;

  const totalRecords = dataPoints.length;
  const expectedRecords = generateExpectedHours(startDate, endDate);
  const missingHours = expectedRecords - totalRecords;
  const completeness = totalRecords > 0 ? (totalRecords / expectedRecords) * 100 : 0;
  
  // Find gaps in the data
  const gaps = findGapsInData(dataPoints.map(dp => ({ time: dp.time })));

  const result: VerificationResult = {
    ticker: asset.ticker,
    assetId: asset.assetId,
    totalRecords,
    expectedRecords,
    dateRange: { start: startDate, end: endDate },
    missingHours,
    completeness,
    gaps
  };

  // Display results
  console.log(`📊 Data Summary for ${asset.ticker}:`);
  console.log(`   Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  console.log(`   Total Records: ${totalRecords}`);
  console.log(`   Expected Records: ${expectedRecords}`);
  console.log(`   Missing Hours: ${missingHours}`);
  console.log(`   Completeness: ${completeness.toFixed(2)}%`);
  
  if (gaps.length > 0) {
    console.log(`   ⚠️  Found ${gaps.length} data gaps:`);
    gaps.forEach((gap, index) => {
      console.log(`      Gap ${index + 1}: ${gap.start.toISOString()} to ${gap.end.toISOString()} (${gap.missingHours} hours missing)`);
    });
  } else {
    console.log(`   ✅ No significant gaps found`);
  }

  // Show some sample data points
  if (dataPoints.length > 0) {
    console.log(`   📅 Sample data points:`);
    console.log(`      First: ${dataPoints[0].time.toISOString()} - $${dataPoints[0].price}`);
    console.log(`      Last:  ${dataPoints[dataPoints.length - 1].time.toISOString()} - $${dataPoints[dataPoints.length - 1].price}`);
  }

  return result;
}

async function verifyAllAssets(days: number = 30): Promise<VerificationResult[]> {
  console.log('🔍 Starting historical data verification...');
  console.log(`Checking ${days} days of data for ${ASSETS.length} assets`);
  
  // Test database connection
  try {
    await sequelizeConnection.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return [];
  }

  const results: VerificationResult[] = [];
  
  for (const asset of ASSETS) {
    try {
      const result = await verifyAssetData(asset, days);
      results.push(result);
    } catch (error) {
      console.error(`❌ Error verifying ${asset.ticker}:`, error);
    }
  }

  // Summary report
  console.log('\n📋 SUMMARY REPORT');
  console.log('=================');
  
  const totalExpected = results.reduce((sum, r) => sum + r.expectedRecords, 0);
  const totalActual = results.reduce((sum, r) => sum + r.totalRecords, 0);
  const totalMissing = results.reduce((sum, r) => sum + r.missingHours, 0);
  const overallCompleteness = totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;

  console.log(`Overall Completeness: ${overallCompleteness.toFixed(2)}%`);
  console.log(`Total Expected Records: ${totalExpected}`);
  console.log(`Total Actual Records: ${totalActual}`);
  console.log(`Total Missing Hours: ${totalMissing}`);

  console.log('\n📊 Per-Asset Breakdown:');
  results.forEach(result => {
    const status = result.completeness >= 95 ? '✅' : result.completeness >= 80 ? '⚠️' : '❌';
    console.log(`${status} ${result.ticker}: ${result.completeness.toFixed(2)}% (${result.totalRecords}/${result.expectedRecords})`);
  });

  return results;
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const days = args[0] ? parseInt(args[0]) : 30;
  
  if (isNaN(days) || days <= 0) {
    console.error('Please provide a valid number of days (e.g., node verify-historical-data.js 30)');
    process.exit(1);
  }

  try {
    await verifyAllAssets(days);
  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  } finally {
    await sequelizeConnection.close();
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { verifyAllAssets, verifyAssetData, VerificationResult }; 