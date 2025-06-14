import { EVENT_MAPPINGS_HANDLER, PROGRAM_ID, solanaConnection } from './utils/const';
import { basktClient } from './utils/config';

console.log(
  'event engine initialized and listening for logs...',
  PROGRAM_ID,
  solanaConnection.rpcEndpoint,
);

const eventHandler = (handler: any) => (event: any, slot: number, signature: string) => {
  try {
    console.log('Adding event to queue', event, slot, signature);
    // eventsQueue.add(event, {
    //   event,
    //   slot,
    //   signature,
    // });
    handler(event, slot, signature);
  } catch (error) {
    console.error('Error adding event to queue', event, error);
  }
};

for (const [eventName, handler] of Object.entries(EVENT_MAPPINGS_HANDLER)) {
  console.log('Listening for event', eventName);
  basktClient.program.addEventListener(eventName as any, eventHandler(handler), 'confirmed');
}
