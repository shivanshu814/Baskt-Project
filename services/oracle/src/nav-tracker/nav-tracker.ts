import axios from 'axios';
import { AssetPrice } from '../config/sequelize';
import { BasktResponse, NavResponse, AssetPriceData } from './types';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const TRACKING_INTERVAL_MINUTES = parseInt(process.env.TRACKING_INTERVAL_MINUTES || '5');

class NavTracker {
  private backendUrl: string;

  constructor(backendUrl: string = BACKEND_URL) {
    this.backendUrl = backendUrl;
  }

  private async getAllBaskts(): Promise<any[]> {
    try {
      const res = await axios.get<BasktResponse>(`${this.backendUrl}/trpc/baskt.getAllBaskts`);
      if (!res.data?.result?.data?.success) {
        console.error(
          'Failed to fetch Baskts:',
          res.data?.result?.data?.message || 'Unknown error',
        );
        return [];
      }
      return res.data.result.data.data;
    } catch (err) {
      console.error('Error fetching Baskts:', err);
      return [];
    }
  }

  private async getBasktNav(basktId: string): Promise<number | null> {
    try {
      const input = encodeURIComponent(JSON.stringify({ basktId }));
      const res = await axios.get<NavResponse>(
        `${this.backendUrl}/trpc/baskt.getBasktMetadataById?input=${input}`,
      );
      if (!res.data?.result?.data?.success) {
        console.error(
          `Failed to fetch NAV for Baskt ${basktId}:`,
          res.data?.result?.data?.message || 'Unknown error',
        );
        return null;
      }
      return res.data.result.data.data.price;
    } catch (err) {
      console.error(`Error fetching NAV for Baskt ${basktId}:`, err);
      return null;
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
      const baskts = await this.getAllBaskts();
      console.log(`Found ${baskts.length} Baskts`);

      if (!baskts.length) {
        console.log('No Baskts found, skipping NAV tracking');
        return;
      }

      const navData: AssetPriceData[] = [];
      const now = new Date();

      for (const b of baskts) {
        const nav = await this.getBasktNav(b.basktId);
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
