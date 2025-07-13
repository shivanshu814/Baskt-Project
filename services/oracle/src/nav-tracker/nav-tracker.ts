import { AssetPrice } from '../config/sequelize';
import { AssetPriceData } from './types';
import { querierClient } from '../config/client';
import dotenv from 'dotenv';

dotenv.config();

const TRACKING_INTERVAL_MINUTES = parseInt(process.env.TRACKING_INTERVAL_MINUTES || '5');

class NavTracker {
  constructor() {
    // Initialize querier client
  }

  private async getAllBaskts(): Promise<any[]> {
    try {
      const result = await querierClient.baskt.getAllBaskts();
      if (!result.success) {
        console.error('Failed to fetch Baskts:', result.error || result.message || 'Unknown error');
        return [];
      }
      return result.data || [];
    } catch (err) {
      console.error('Error fetching Baskts:', err);
      return [];
    }
  }

  private async storeNavData(navData: AssetPriceData[]): Promise<void> {
    try {
      if (!navData.length) return;
      await AssetPrice.bulkCreate(navData as any[]);
      console.log(`Stored ${navData.length} NAV records`);
    } catch (err) {
      console.error('Error storing NAV data:', err);
    }
  }

  async trackNav(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Starting NAV tracking...`);
    try {
      // Initialize the querier client
      await querierClient.init();
      
      const baskts = await this.getAllBaskts();
      console.log(`Found ${baskts.length} Baskts`);

      if (!baskts.length) {
        console.log('No Baskts found, skipping NAV tracking');
        return;
      }

      const navData: AssetPriceData[] = [];
      const now = new Date();

      for (const b of baskts) {
        if(b === null || !b) continue;
        const nav = b.price;
        if (nav !== null) {
          navData.push({ asset_id: b.basktId, price: nav, time: now });
          console.log(`NAV for ${b.basktId}: ${nav}`);
        } else {
          console.log(`Failed to get NAV for ${b.basktId}`);
        }
      }

      await this.storeNavData(navData);
      console.log(
        `NAV tracking completed. Processed ${baskts.length} Baskts, stored ${navData.length} records.`,
      );
    } catch (err) {
      console.error('Error in NAV tracking process:', err);
    }
  }
}

async function main() {
  console.log('Starting NAV Tracker...');
  console.log(`Tracking interval: ${TRACKING_INTERVAL_MINUTES} minutes`);

  const tracker = new NavTracker();

  // run immediately
  await tracker.trackNav();

  // schedule to run every X minutes
  setInterval(async () => {
    await tracker.trackNav();
  }, TRACKING_INTERVAL_MINUTES * 60 * 1000);

  console.log(`NAV Tracker scheduled to run every ${TRACKING_INTERVAL_MINUTES} minutes`);
}

main().catch((error) => {
  console.error('Error starting NAV Tracker:', error);
  process.exit(1);
});
