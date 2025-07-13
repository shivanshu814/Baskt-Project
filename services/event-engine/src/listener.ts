// Event Engine Listener Entrypoint
// Wires up adapters and handlers using the observer pattern

import { ObserverRouter } from './observer-router';
import { initSolanaAdapter } from './adapters/solana';
import registerAllHandlers from './handlers/solana';
import { querierClient } from './utils/config';

/**
 * Initialize the event engine with all adapters and handlers
 */
export async function initEventEngine(): Promise<void> {
  try {
    // Initialize the querier client
    await querierClient.init();

    // Create the observer router
    const router = new ObserverRouter();

    // Register all handlers
    registerAllHandlers(router);

    // Add more handlers here as needed
    // router.register(otherHandler.source, otherHandler.type, otherHandler.handler);

    // Initialize all adapters
    await Promise.all([initSolanaAdapter(router)]);

    console.log('Event engine initialized successfully');
  } catch (error) {
    console.error('Failed to initialize event engine:', error);
    throw error;
  }
}

initEventEngine().catch((error) => {
  console.error('Event engine initialization failed:', error);
  process.exit(1);
});
