import { Queue, Worker } from 'bullmq';
import { managerQueue, connection, rebalanceQueue } from '../config/queue';
import { connectMongoDB, disconnectMongoDB } from '../config/mongo';
import mongoose from 'mongoose';
import { BasktMetadataModel as BasktMetadataModelType } from '@baskt/types';
import { basktClient, querierClient } from '../config/client';
import { PublicKey } from '@solana/web3.js';
import { BasktMetadataSchema } from '@baskt/querier';
import { DataBus, STREAMS } from '@baskt/data-bus';
import { RebalanceRequestEvent } from '@baskt/types';
import { BN } from 'bn.js';

// Initialize DataBus for publishing events
const dataBus = new DataBus({
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  signingKey: process.env.DATABUS_SIGNING_KEY || 'dev-signing-key',
});

// NAV deviation threshold (0.5%)
const NAV_DEVIATION_THRESHOLD = 0.005;

async function getRebalanceConfigs() {
  const BasktMetadataModel = mongoose.model<BasktMetadataModelType>(
    'BasktMetadata',
    BasktMetadataSchema,
  );

  const baskets = await BasktMetadataModel.find({});
  console.log(`Found ${baskets.length} baskets in database`);

  if (baskets.length === 0) {
    console.log('No baskets found in database.');
    return [];
  }

  return baskets;
}

async function calculateNavDeviation(currentNav: number, baselineNav: number): number {
  // Calculate percentage deviation between current and baseline NAV  
  if (baselineNav === 0) {
    return 0; // Avoid division by zero
  }
  
  const deviation = Math.abs((currentNav - baselineNav) / baselineNav);
  return deviation;
}

async function scheduleRebalanceConfigs() {
  console.log(`\n[${new Date().toLocaleTimeString()}] 🔍 Checking baskets for rebalance...`);

  const rebalanceConfigs = await getRebalanceConfigs();

  if (rebalanceConfigs.length === 0) {
    return;
  }

  console.log(`Checking ${rebalanceConfigs.length} baskets for rebalance timing...`);
  console.log('─'.repeat(50));

  const jobPromises = rebalanceConfigs.map(async (config) => {
    try {
      const baskt = await basktClient.getBasktRaw(new PublicKey(config.basktId), 'confirmed');
      if (!baskt) {
        console.log(`❌ ${config.basktId} - Not found on blockchain`);
        return;
      }

      // Read rebalance period from on-chain data
      const rebalancePeriodSeconds = baskt.rebalancePeriod.toNumber();
      if (rebalancePeriodSeconds === 0) {
        console.log(`⏭️ ${config.basktId} - No rebalance period configured (0 seconds)`);
        return;
      }

      const lastRebalanceTime = baskt.lastRebalanceTime.toNumber();
      const currentTimeSeconds = Math.floor(Date.now() / 1000);
      const nextRebalanceTime = lastRebalanceTime + rebalancePeriodSeconds;

      // Check 1: lastTimeRebalanced + rebalancePeriod < currentTimeInSeconds
      if (currentTimeSeconds < nextRebalanceTime) {
        const timeUntilNext = Math.round((nextRebalanceTime - currentTimeSeconds) / 60);
        console.log(`⏳ ${config.basktId} - Next rebalance in ${timeUntilNext} minutes (period: ${rebalancePeriodSeconds}s)`);
        return;
      }

      // Get current NAV from querier
      const navResult = await querierClient.baskt.getBasktNAV(config.basktId);
      if (!navResult.success || !navResult.data) {
        console.log(`❌ ${config.basktId} - Failed to get current NAV`);
        return;
      }

      // Check 2: is current baskt NAV and baseline NAV < 0.5%
      const currentNav = navResult.data.nav;
      const baselineNav = baskt.baselineNav.toNumber() / 1e6; // Convert from u64 representation to decimal
      const navDeviation = await calculateNavDeviation(currentNav, baselineNav);
      
      console.log(`📊 ${config.basktId} - NAV deviation: ${(navDeviation * 100).toFixed(2)}% (current: ${currentNav.toFixed(2)}, baseline: ${baselineNav.toFixed(2)})`);
      
      if (navDeviation < NAV_DEVIATION_THRESHOLD) {
        console.log(`⏭️ ${config.basktId} - NAV deviation below threshold (${(NAV_DEVIATION_THRESHOLD * 100).toFixed(1)}%), skipping rebalance`);
        return;
      }

      // Create rebalance request event
      const rebalanceRequest: RebalanceRequestEvent = {
        basktId: new PublicKey(config.basktId),
        creator: baskt.creator,
        timestamp: new BN(Date.now()),
        rebalanceRequestFee: new BN(0), // Fee will be handled by the execution engine
      };

      // Emit STREAMS.rebalance.requested
      const txSignature = `cron-job-${config.basktId}-${Date.now()}`;
      await dataBus.publish(STREAMS.rebalance.requested, {
        rebalanceRequest,
        timestamp: Date.now().toString(),
        txSignature,
      });

      console.log(`✅ ${config.basktId} - Rebalance requested (period: ${rebalancePeriodSeconds}s, deviation: ${(navDeviation * 100).toFixed(2)}%)`);
    } catch (error) {
      console.log(
        `❌ ${config.basktId} - Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  await Promise.all(jobPromises);
  console.log('─'.repeat(50));
}

async function resetJobs(queue: Queue) {
  const existingJobs = await queue.getRepeatableJobs();
  for (const job of existingJobs) {
    await queue.removeRepeatableByKey(job.key);
  }
}

(async () => {
  await connectMongoDB();
  await dataBus.connect();
  await querierClient.init();

  await resetJobs(managerQueue);
  await resetJobs(rebalanceQueue);

  const managerWorker = new Worker(
    managerQueue.name,
    async (job) => {
      console.log(
        `[${new Date().toLocaleTimeString()}] Manager worker processing job: ${job.name}`,
      );
      await scheduleRebalanceConfigs();
    },
    { connection },
  );

  managerWorker.on('error', (error) => {
    console.error('Manager worker error:', error);
  });

  managerWorker.on('completed', (job) => {
    console.log(`[${new Date().toLocaleTimeString()}] Manager job completed: ${job.name}`);
  });

  await scheduleRebalanceConfigs();

  await managerQueue.add(
    'checkRebalanceJobs',
    {},
    {
      repeat: { every: 60 * 60 * 1000 }, // 1 hour
    },
  );
  console.log('Rebalance manager started, checking every 1 hour.');
})();
