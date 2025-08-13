import { querierClient } from '../config/client';
import { BaseJob } from 'src/job';
import { AssetPriceDBValue } from '@baskt/types';
import { AssetPrice, CombinedBaskt } from '@baskt/querier';

const TRACKING_INTERVAL_MINUTES = parseInt(process.env.TRACKING_INTERVAL_MINUTES || '5');

export class NavTracker extends BaseJob {
  constructor() {
    super('nav-tracker', TRACKING_INTERVAL_MINUTES * 60);
  }

  private async getAllBaskts(): Promise<CombinedBaskt[]> {
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

  private async storeNavData(navData: AssetPriceDBValue[]): Promise<void> {
    try {
      if (!navData.length) return;
      await AssetPrice.bulkCreate(navData.map(n => ({
        assetId: n.assetId,
        price: n.price,
        time: n.time
      })));
      console.log(`Stored ${navData.length} NAV records`);
    } catch (err) {
      console.error('Error storing NAV data:', err);
    }
  }

  async run(): Promise<void> {
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

      const navData: AssetPriceDBValue[] = [];
      const now = new Date();

      for (const b of baskts) {
        if(b === null || !b) continue;
        const nav = b.price;
        if (nav !== null) {
          navData.push({ assetId: b.basktId, price: nav.toString(), time: now.getTime() });
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