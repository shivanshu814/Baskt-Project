// import { Queue, Worker } from 'bullmq';
// import { managerQueue, connection, rebalanceQueue } from '../config/queue';
// import { connectMongoDB, disconnectMongoDB } from '../config/mongo';
// import mongoose from 'mongoose';
// import { BasktMetadataModel } from '@baskt/types';
// import { basktClient } from '../config/client';
// import { PublicKey } from '@solana/web3.js';
// import { BasktMetadataSchema } from '@baskt/querier';

// async function getRebalanceConfigs() {
//   const BasktMetadataModel = mongoose.model<BasktMetadataModel>(
//     'BasktMetadata',
//     BasktMetadataSchema,
//   );

//   const baskets = await BasktMetadataModel.find({});
//   console.log(`Found ${baskets.length} baskets in database`);

//   if (baskets.length === 0) {
//     console.log('No baskets found in database.');
//     return [];
//   }

//   return baskets;
// }

// async function scheduleRebalanceConfigs() {
//   console.log(`\n[${new Date().toLocaleTimeString()}] 🔍 Checking baskets for rebalance...`);

//   const rebalanceConfigs = await getRebalanceConfigs();

//   if (rebalanceConfigs.length === 0) {
//     return;
//   }

//   console.log(`Checking ${rebalanceConfigs.length} baskets for rebalance timing...`);
//   console.log('─'.repeat(50));

//   const jobPromises = rebalanceConfigs.map(async (config) => {
//     try {
//       const baskt = await basktClient.getBasktRaw(new PublicKey(config.basktId), 'confirmed');
//       if (!baskt) {
//         console.log(`❌ ${config.basktId} - Not found on blockchain`);
//         return;
//       }

//       // Read rebalance period from on-chain data
//       const rebalancePeriodSeconds = baskt.basktRebalancePeriod.toNumber();
//       if (rebalancePeriodSeconds === 0) {
//         console.log(`⏭️ ${config.basktId} - No rebalance period configured (0 seconds)`);
//         return;
//       }

//       const lastRebalanceTime = baskt.lastRebalanceTime.toNumber() * 1000;
//       const rebalancePeriodMs = rebalancePeriodSeconds * 1000; // Convert seconds to milliseconds
//       const nextRebalanceTime = lastRebalanceTime + rebalancePeriodMs;
//       const now = Date.now();

//       if (now >= nextRebalanceTime) {
//         const jobData = {
//           basktId: config.basktId,
//           rebalancePeriod: {
//             value: rebalancePeriodSeconds,
//             unit: 'second' as const,
//           },
//           lastRebalanceTime: lastRebalanceTime,
//         };

//         await rebalanceQueue.add(`rebalance-${config.basktId}`, jobData, {
//           jobId: `rebalance-${config.basktId}-${Date.now()}`,
//           removeOnComplete: true,
//           removeOnFail: true,
//         });

//         console.log(`✅ ${config.basktId} - Scheduled for rebalance (period: ${rebalancePeriodSeconds}s)`);
//       } else {
//         const timeUntilNext = Math.round((nextRebalanceTime - now) / 1000 / 60);
//         console.log(`⏳ ${config.basktId} - Next rebalance in ${timeUntilNext} minutes (period: ${rebalancePeriodSeconds}s)`);
//       }
//     } catch (error) {
//       console.log(
//         `❌ ${config.basktId} - Error: ${error instanceof Error ? error.message : String(error)}`,
//       );
//     }
//   });

//   await Promise.all(jobPromises);
//   console.log('─'.repeat(50));
// }



// async function resetJobs(queue: Queue) {
//   const existingJobs = await queue.getRepeatableJobs();
//   for (const job of existingJobs) {
//     await queue.removeRepeatableByKey(job.key);
//   }
// }

// (async () => {
//   await connectMongoDB();

//   await resetJobs(managerQueue);
//   await resetJobs(rebalanceQueue);

//   const managerWorker = new Worker(
//     managerQueue.name,
//     async (job) => {
//       console.log(
//         `[${new Date().toLocaleTimeString()}] Manager worker processing job: ${job.name}`,
//       );
//       await scheduleRebalanceConfigs();
//     },
//     { connection },
//   );

//   managerWorker.on('error', (error) => {
//     console.error('Manager worker error:', error);
//   });

//   managerWorker.on('completed', (job) => {
//     console.log(`[${new Date().toLocaleTimeString()}] Manager job completed: ${job.name}`);
//   });

//   await scheduleRebalanceConfigs();

//   await managerQueue.add(
//     'checkRebalanceJobs',
//     {},
//     {
//       repeat: { every: 60 * 60 * 1000 }, // 1 hour
//     },
//   );
//   console.log('Rebalance manager started, checking every 1 hour.');
// })();
