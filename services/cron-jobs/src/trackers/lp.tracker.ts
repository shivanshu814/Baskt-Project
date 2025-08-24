import { BaseJob } from '../job';
import { querierClient } from '../config/client';
import { LiquidityPoolMetadata, LiquidityPoolModel } from '@baskt/querier';
import BN from 'bn.js';

interface PoolAPRData {
  apr: number;
  totalFeesEarned: string;
  recentFeeData: {
    totalFeesToBlp: string;
  };
}

const PRICE_UPDATE_FREQUENCY_SECONDS = parseInt(process.env.PRICE_UPDATE_FREQUENCY_SECONDS || '300');

export class LPTracker extends BaseJob {
  constructor() {
    super('lp-tracker', PRICE_UPDATE_FREQUENCY_SECONDS);
  }

  private async getLiquidityPool(): Promise<LiquidityPoolMetadata | null> {
    try {
      const poolResult = await querierClient.pool.getLiquidityPool();
      
      if (!poolResult.success || !poolResult.data) {
        console.error('Failed to fetch liquidity pool:', poolResult.error);
        return null;
      }
      
      console.log(`Found liquidity pool: ${poolResult.data.poolAddress}`);
      return poolResult.data;
    } catch (err) {
      console.error('Error fetching liquidity pool:', err);
      return null;
    }
  }

  private async calculatePoolAPR(pool: LiquidityPoolMetadata): Promise<PoolAPRData | null> {
    try {
      const analyticsResult = await querierClient.feeEvent.getPoolAnalytics(
        new BN(pool.totalLiquidity),
        30
      );

      if (!analyticsResult.success || !analyticsResult.data) {
        console.error(`Failed to get analytics for pool ${pool.poolAddress}:`, analyticsResult.error);
        return null;
      }

      this.logAnalyticsSummary(pool.poolAddress, analyticsResult.data);

      return {
        apr: analyticsResult.data.apr,
        totalFeesEarned: analyticsResult.data.totalFees.toString(),
        recentFeeData: {
          totalFeesToBlp: analyticsResult.data.recentFeeData.totalFeesToBlp.toString(),
        },
      };
    } catch (err) {
      console.error(`Error calculating APR for pool ${pool.poolAddress}:`, err);
      return null;
    }
  }

  private logAnalyticsSummary(poolAddress: string, analytics: any): void {
    console.log(`Pool ${poolAddress}: Analytics Summary`);
    console.log(`  30-day APR: ${analytics.apr}%`);
    console.log(`  30-day fees: ${analytics.recentFeeData.totalFeesToBlp}`);
    console.log(`  Event count (30d): ${analytics.recentFeeData.eventCount}`);
  }

  private async updatePoolAPR(pool: LiquidityPoolMetadata, aprData: PoolAPRData): Promise<boolean> {
    try {
      const updateResult = await LiquidityPoolModel.updateOne(
        { poolAddress: pool.poolAddress },
        {
          $set: {
            'fees.latestApr': aprData.apr,
            'fees.lastTimeAprCalculated': new Date(),
            'fees.feesCollected30d': aprData.recentFeeData.totalFeesToBlp,
            'fees.feesCollected7d': 0,
            'fees.totalFeesCollected': aprData.totalFeesEarned
          }
        }
      );

      if (updateResult.modifiedCount > 0) {
        console.log(`✅ Updated pool ${pool.poolAddress} with APR: ${aprData.apr}%`);
        return true;
      } else {
        console.warn(`⚠️  No changes made to pool ${pool.poolAddress}`);
        return false;
      }
    } catch (err) {
      console.error(`❌ Error updating pool ${pool.poolAddress}:`, err);
      return false;
    }
  }

  async run(): Promise<void> {
    const startTime = Date.now();
    console.log(`🚀 [${new Date().toISOString()}] Starting LP APR tracking...`);
    
    try {
      await querierClient.init();
      
      const pool = await this.getLiquidityPool();
      if (!pool) {
        console.log('❌ No liquidity pool found, skipping APR tracking');
        return;
      }

      console.log(`📋 Processing pool: ${pool.poolAddress}`);
      
      const aprData = await this.calculatePoolAPR(pool);
      if (!aprData) {
        console.log(`❌ Failed to calculate APR for pool ${pool.poolAddress}`);
        return;
      }
      
      if (aprData.apr > 0) {
        const updateSuccess = await this.updatePoolAPR(pool, aprData);
        if (updateSuccess) {
          console.log(`✅ Pool ${pool.poolAddress}: APR=${aprData.apr}%`);
        }
      } else {
        console.log(`⚠️  Pool ${pool.poolAddress}: No APR calculated (insufficient data)`);
      }

      const duration = Date.now() - startTime;
      console.log(`🏁 LP APR tracking completed in ${duration}ms`);
      
    } catch (err) {
      console.error('❌ Error in LP APR tracking process:', err);
      throw err;
    }
  }
}
