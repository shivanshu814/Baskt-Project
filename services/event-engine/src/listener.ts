import { eventsQueue, connection as redis } from './utilts/queue';
import { EVENT_MAPPINGS, PROGRAM_ID, solanaConnection } from './utilts/const';


console.log('event engine initialized and listening for logs...');

solanaConnection.onLogs(
  PROGRAM_ID,
  async (logs, logCtx) => {
    for (const logLine of logs.logs) {
      for (const [eventName, jobName] of Object.entries(EVENT_MAPPINGS)) {
        if (logLine.includes(`Program log: Event: ${eventName}`)) {
          const jsonMatch = logLine.match(/{.*}/);
          if (!jsonMatch) {
            console.warn(`unable to parse JSON payload from ${eventName}:`, logLine);
            continue;
          }

          try {
            const eventData = JSON.parse(jsonMatch[0]);
            await eventsQueue.add(jobName, {
              tx: (logCtx as any).signature,
              ...eventData,
              received_at: Date.now(),
            });
          } catch (err) {
            console.error(`failed to parse JSON from ${eventName}:`, err);
          }
        }
      }
    }
  },
  'confirmed',
);

