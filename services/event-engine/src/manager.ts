import { eventsQueue, eventsQueueName } from './config/queue';

async function resetJobs() {
  console.log(`resetting jobs for queue: ${eventsQueueName}`);
  const existingJobs = await eventsQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    await eventsQueue.removeRepeatableByKey(job.key);
    console.log(`Removed repeatable job: ${job.key}`);
  }
  console.log('Reset done.');
}

(async () => {
  console.log('manager initialized...');
  await resetJobs();
  console.log('nothing to reschedule (event-based system)');
})();
