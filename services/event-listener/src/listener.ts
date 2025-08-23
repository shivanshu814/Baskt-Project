// Event Engine Listener Entrypoint
// Wires up adapters and handlers using the enhanced observer pattern with events storage

import { ObserverRouter } from './observer-router';
import { initSolanaAdapter } from './adapters/solana';
import registerAllHandlers from './handlers/solana';
import { querierClient } from './utils/config';

/**
 * Initialize the event engine with all adapters and handlers
 */
export async function initEventEngine(): Promise<void> {
  try {
    console.log('[event-listener] Initializing enhanced event engine...');

    // Initialize the querier client (handles MongoDB connection internally)
    await querierClient.init();
    console.log('[event-listener] Querier client initialized');

    // Create the observer router
    const router = new ObserverRouter();
    console.log('[event-listener] Observer router created');

    // Set the events storage service from querier client
    router.setEventsStorage(querierClient.eventsStorage);
    console.log('[event-listener] Events storage service initialized');

    // Register all handlers
    registerAllHandlers(router);
    console.log('[event-listener] All handlers registered');

    // Initialize all adapters
    await Promise.all([initSolanaAdapter(router)]);
    console.log('[event-listener] All adapters initialized');

    // Set up graceful shutdown
    process.on('SIGINT', async () => {
      console.log('[event-listener] Received SIGINT, shutting down gracefully...');
      await gracefulShutdown();
    });

    process.on('SIGTERM', async () => {
      console.log('[event-listener] Received SIGTERM, shutting down gracefully...');
      await gracefulShutdown();
    });

    console.log('[event-listener] Enhanced event engine initialized successfully');
  } catch (error) {
    console.error('[event-listener] Failed to initialize enhanced event engine:', error);
    throw error;
  }
}

/**
 * Graceful shutdown function
 */
async function gracefulShutdown(): Promise<void> {
  try {
    console.log('[event-listener] Starting graceful shutdown...');
    
    // Shutdown querier client
    await querierClient.shutdown();
    console.log('[event-listener] Querier client shutdown');
    
    console.log('[event-listener] Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('[event-listener] Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Initialize the enhanced event engine
initEventEngine().catch((error) => {
  console.error('[event-listener] Enhanced event engine initialization failed:', error);
  process.exit(1);
});
