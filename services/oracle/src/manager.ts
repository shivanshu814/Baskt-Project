import mongoose from 'mongoose';
import { OracleConfigSchema} from '@baskt/types';
import { Queue, Worker } from 'bullmq';
import { pricingQueue, managerQueue, connection } from './config/queue';
import { connectMongoDB } from './config/mongo';

async function getOracleConfigs() {
  const OracleConfigModel = mongoose.model('OracleConfig', OracleConfigSchema);
  const oracleConfigs = await OracleConfigModel.find({});
  return oracleConfigs;
}


async function scheduleOracleConfigs() {
  const oracleConfigs = await getOracleConfigs();

  for (const oracleConfig of oracleConfigs) {
    await pricingQueue.add(oracleConfig.oracleName, oracleConfig, {
      repeat: {
        every: oracleConfig.priceConfig.updateFrequencySeconds * 1000,
      },
    });
    console.log(`Scheduled job: ${oracleConfig.oracleName}, every ${oracleConfig.priceConfig.updateFrequencySeconds / 60} mins`);
  }
}
// Function to reset scheduled jobs
async function resetJobs(queue: Queue) {
  console.log('Resetting jobs...', queue.name);
  // Remove existing repeatable jobs
  const existingJobs = await queue.getRepeatableJobs();
  for (const job of existingJobs) {
    await queue.removeRepeatableByKey(job.key);
    console.log(`Removed job: ${job.key}`);
  }
  console.log('Removed existing jobs.');
}


// Schedule Manager Job itself every hour
(async () => {
  await connectMongoDB();

  await resetJobs(managerQueue)
  await resetJobs(pricingQueue);

  const managerWorker = new Worker(managerQueue.name, async () => {
    console.log('Running manager job to reset pricing jobs...');
    await resetJobs(pricingQueue);
    await scheduleOracleConfigs();
    console.log('Manager job completed.');
  }, { connection });
  

  await managerQueue.add('resetPricingJobs', {}, {
    repeat: { every: parseInt(process.env.MANAGER_REPEAST_MS ?? "3600000")} // every hour
  });


  console.log('Manager queue initialized, runs hourly.');
})();
