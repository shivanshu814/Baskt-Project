import { querierClient } from '../config/client';
import { BaseJob } from 'src/job';
import { AssetPriceDBValue } from '@baskt/types';
import { AssetPrice, BasktMetadataModel, CombinedBaskt } from '@baskt/querier';

const TRACKING_INTERVAL_MINUTES = parseInt(process.env.TRACKING_INTERVAL_MINUTES || '5');

export class BasktPerformanceTracker extends BaseJob {
  constructor() {
    super('baskt-performance-tracker', TRACKING_INTERVAL_MINUTES * 60);
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

  async run(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Starting Baskt performance tracking...`);
    try {
      // Initialize the querier client
      await querierClient.init();
      
      const baskts = await this.getAllBaskts();
      console.log(`Found ${baskts.length} Baskts`);

      if (!baskts.length) {
        console.log('No Baskts found, skipping NAV tracking');
        return;
      }

      // Create a map of current prices for each baskt
      const currentPrices = new Map<string, number>();
      baskts.forEach(baskt => {
        if (baskt.price !== null) {
          currentPrices.set(baskt.basktId.toString(), baskt.price);
        }
      });

      const basktPerformanceData = await querierClient.price.getBatchAssetPerformanceOptimized(
        baskts.map(b => b.basktId.toString()),
        currentPrices
      );

      if (!basktPerformanceData) {
        console.log('No Baskt performance data found');
        return;
      }
      for(const baskt of baskts) {
        const basktId = baskt.basktId.toString();
        const performance = basktPerformanceData.get(basktId);
        
        await querierClient.metadata.updateBaskt(basktId, { stats: {
            change24h: performance?.daily ?? 0,
            change7d: performance?.weekly ?? 0,
            change30d: performance?.monthly ?? 0,
            change365d: performance?.year ?? 0,
          }
        });
      }
      console.log(
        `Baskt performance tracking completed. Processed ${baskts.length} Baskts, stored ${basktPerformanceData.size} records.`,
      );

    } catch (err) {
      console.error('Error in NAV tracking process:', err);
    }
  }
}