import { BaseJob } from '../job';
import { querierClient } from '../config/client';
import { DataBus, STREAMS } from '@baskt/data-bus';
import { RebalanceRequestEvent } from '@baskt/types';
import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { CombinedBaskt, RebalanceRequestStatus } from '@baskt/querier';

// Check every hour by default
const REBALANCE_CHECK_INTERVAL_SECONDS = parseInt(process.env.REBALANCE_CHECK_INTERVAL_SECONDS || '3600');
const NAV_DEVIATION_THRESHOLD = parseFloat(process.env.NAV_DEVIATION_THRESHOLD || '0.005'); // 0.5%

export class RebalanceTracker extends BaseJob {
  private dataBus: DataBus;

  constructor() {
    super('rebalance-tracker', REBALANCE_CHECK_INTERVAL_SECONDS);
    
    // Initialize DataBus
    this.dataBus = new DataBus({
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      autoConnect: false
    });
  }

  private async getAllBaskts(): Promise<CombinedBaskt[]> {
    try {
      const result = await querierClient.baskt.getAllBaskts({
        hidePrivateBaskts: false
      });
      if (!result.success) {
        console.error('Failed to fetch Baskts:', result.error || result.message || 'Unknown error');
        return [];
      }
      console.log(`Found ${result.data?.length || 0} baskets`);
      return result.data || [];
    } catch (err) {
      console.error('Error fetching baskets:', err);
      return [];
    }
  }

  private calculateNavDeviation(currentNav: number, baselineNav: number): number {
    if (baselineNav === 0) {
      return 0; // Avoid division by zero
    }
    return Math.abs((currentNav - baselineNav) / baselineNav);
  }

  async run(): Promise<void> {
    console.log(`[${new Date().toISOString()}] 🔍 Starting rebalance check...`);
    
    try {
      // Initialize clients
      await querierClient.init();
      const baskts = await this.getAllBaskts();
      
      if (!baskts.length) {
        console.log('No baskets found, skipping rebalance check');
        return;
      }

      let rebalanceRequestCount = 0;

      for (const baskt of baskts) {
        try {
          // Skip if no rebalance period configured
          if (baskt.rebalancePeriod === 0) {
            console.log(`⏭️  ${baskt.basktId} - Skipping Manual rebalance`);
            continue;
          }

          const lastRebalanceTime = baskt.lastRebalanceTime || 0;
          const currentTimeSeconds = Math.floor(Date.now() / 1000);
          const nextRebalanceTime = lastRebalanceTime + baskt.rebalancePeriod;

          // Check 1: Time-based check
          if (currentTimeSeconds < nextRebalanceTime) {
            const timeUntilNext = Math.round((nextRebalanceTime - currentTimeSeconds) / 60);
            console.log(`⏳ ${baskt.basktId} - Next rebalance in ${timeUntilNext} minutes`);
            continue;
          }

          // Check 2: NAV deviation check
          const currentNav = baskt.price; // Current NAV from getAllBaskts
          const baselineNav = typeof baskt.baselineNav === 'string' 
            ? parseFloat(baskt.baselineNav) 
            : baskt.baselineNav.toNumber(); // Convert from BN/string to decimal
          
          const navDeviation = this.calculateNavDeviation(currentNav, baselineNav);
          
          console.log(`📊 ${baskt.basktId} - NAV deviation: ${(navDeviation * 100).toFixed(2)}% (current: ${currentNav.toFixed(2)}, baseline: ${baselineNav.toFixed(2)})`);
          
          if (navDeviation < NAV_DEVIATION_THRESHOLD) {
            console.log(`⏭️  ${baskt.basktId} - NAV deviation below threshold (${(NAV_DEVIATION_THRESHOLD * 100).toFixed(1)}%)`);
            continue;
          }

          // Both conditions met, emit rebalance request
          const rebalanceRequest: RebalanceRequestEvent = {
            basktId: new PublicKey(baskt.basktId),
            creator: new PublicKey(baskt.creator),
            timestamp: new BN(Date.now()),
            rebalanceRequestFee: new BN(0), // Fee handled by execution engine
          };

          // Generate a unique signature for this cron job request
          const txSignature = `cron-rebalance-${baskt.basktId}-${Date.now()}`;


          await querierClient.baskt.createRebalanceRequest({
            baskt: baskt._id!,
            creator: baskt.creator,
            timestamp: Date.now(),
            rebalanceRequestFee: 0,
            txSignature,
            status: RebalanceRequestStatus.Pending,
            basktId: baskt.basktId,
          });

          await this.dataBus.publish(STREAMS.rebalance.requested, {
            rebalanceRequest,
            timestamp: Date.now().toString(),
            txSignature,
          });

          console.log(`✅ ${baskt.basktId} - Rebalance requested (period: ${baskt.rebalancePeriod}s, deviation: ${(navDeviation * 100).toFixed(2)}%)`);
          rebalanceRequestCount++;

        } catch (error) {
          console.error(`❌ ${baskt.basktId} - Error:`, error instanceof Error ? error.message : error);
        }
      }

      console.log(`🏁 Rebalance check completed. Processed ${baskts.length} baskets, ${rebalanceRequestCount} rebalance requests sent.`);
      
    } catch (err) {
      console.error('❌ Error in rebalance check process:', err);
      throw err;
    }
  }
}