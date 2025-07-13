import { createQuerier } from '@baskt/querier';
import { SDKClient } from './index';

// Create a single SDK client instance
const sdkClient = new SDKClient();

// Create a single Querier instance with the SDK client
export const querier = createQuerier(sdkClient);

// Initialize the querier (this should be called once on app startup)
export const initializeQuerier = async () => {
  try {
    await querier.init();
    console.log('Backend Querier initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Backend Querier:', error);
    throw error;
  }
};

// Shutdown function for cleanup
export const shutdownQuerier = async () => {
  try {
    await querier.shutdown();
    console.log('Backend Querier shutdown successfully');
  } catch (error) {
    console.error('Error during Backend Querier shutdown:', error);
    throw error;
  }
}; 