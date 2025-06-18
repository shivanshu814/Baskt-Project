// Current Implementation vs. Sequelize
// The current PostgreSQL adapter uses:

// Direct pg client connection
// LISTEN/NOTIFY mechanism for real-time updates
// JSON payloads for event data
// This approach is fundamentally different from using Sequelize:

// LISTEN/NOTIFY - The current adapter listens for PostgreSQL notifications, which requires triggers to be set up in the database to emit notifications when data changes.
// Sequelize - Your Sequelize setup defines models and allows for querying/watching data through an ORM.
// Recommended Approach
// Based on your requirements to allow handlers to specify tables and columns to watch, I recommend a hybrid approach:

// Option 1: Enhanced PostgreSQL Adapter with Dynamic Channels
// typescript
// CopyInsert
// import type { Client as PgClient } from 'pg';
// import type { ObserverRouter } from '../observer-router';
// import { EventSource } from '../types';

// // PostgreSQL connection configuration
// const PG_CONNECTION_STRING =
//   process.env.PG_CONNECTION_STRING || 'postgresql://postgres:postgres@localhost:5432/baskt';

// // Define the notification interface
// interface PgNotification {
//   channel: string;
//   payload?: string;
// }

// // Registry for handlers to register their interest in specific tables/columns
// export const tableWatchRegistry: Record<string, {
//   tableName: string;
//   columnName: string;
//   eventName: string;
// }[]> = {};

// /**
//  * Register a table and column to watch for changes
//  * @param tableName The table to watch
//  * @param columnName The column to watch for changes
//  * @param eventName The event name to emit when changes occur
//  */
// export function registerTableWatch(tableName: string, columnName: string, eventName: string): void {
//   const channelName = `${tableName}_${columnName}_watch`;

//   if (!tableWatchRegistry[channelName]) {
//     tableWatchRegistry[channelName] = [];
//   }

//   tableWatchRegistry[channelName].push({
//     tableName,
//     columnName,
//     eventName
//   });
// }

// /**
//  * Initialize PostgreSQL adapter and listen for NOTIFY events
//  * @param router The ObserverRouter instance to emit events to
//  */
// export async function initPgAdapter(router: ObserverRouter): Promise<void> {
//   try {
//     // Dynamically import pg to avoid requiring it when not used
//     const { Client } = await import('pg');

//     const client = new Client(PG_CONNECTION_STRING);
//     await client.connect();
//     router.logger('[pg-adapter] Connected to PostgreSQL/TimescaleDB');

//     // Set up triggers and listeners for each registered table/column
//     for (const [channelName, watchers] of Object.entries(tableWatchRegistry)) {
//       // Create a trigger function if it doesn't exist
//       await client.query(`
//         CREATE OR REPLACE FUNCTION notify_${channelName}() RETURNS TRIGGER AS $$
//         BEGIN
//           PERFORM pg_notify('${channelName}', json_build_object(
//             'table', TG_TABLE_NAME,
//             'action', TG_OP,
//             'data', row_to_json(NEW)
//           )::text);
//           RETURN NEW;
//         END;
//         $$ LANGUAGE plpgsql;
//       `);

//       // For each watcher, create a trigger on the table
//       for (const watcher of watchers) {
//         // Create trigger on the table
//         await client.query(`
//           DROP TRIGGER IF EXISTS ${channelName}_trigger ON ${watcher.tableName};
//           CREATE TRIGGER ${channelName}_trigger
//           AFTER INSERT OR UPDATE OF ${watcher.columnName}
//           ON ${watcher.tableName}
//           FOR EACH ROW
//           EXECUTE FUNCTION notify_${channelName}();
//         `);
//       }

//       // Listen for notifications on this channel
//       await client.query(`LISTEN ${channelName}`);
//       router.logger(`[pg-adapter] Listening on channel: ${channelName}`);
//     }

//     // Set up notification handler
//     client.on('notification', (notification: PgNotification) => {
//       const { channel, payload } = notification;
//       const watchers = tableWatchRegistry[channel];

//       if (watchers && payload) {
//         try {
//           // Parse the JSON payload
//           const parsedPayload = JSON.parse(payload);

//           // Emit events for each watcher
//           for (const watcher of watchers) {
//             router.emit({
//               source: EventSource.POSTGRES,
//               name: watcher.eventName,
//               payload: {
//                 ...parsedPayload,
//                 timestamp: new Date(),
//               },
//             });
//           }
//         } catch (error) {
//           router.logger(`[pg-adapter] Error processing notification from ${channel}: ${error}`);
//         }
//       }
//     });

//     // Handle connection errors
//     client.on('error', (error: Error) => {
//       router.logger(`[pg-adapter] PostgreSQL connection error: ${error.message}`);
//       // Attempt to reconnect
//       setTimeout(() => initPgAdapter(router), 5000);
//     });

//     // Handle process termination
//     process.on('SIGINT', async () => {
//       router.logger('[pg-adapter] Closing PostgreSQL connection');
//       await client.end();
//       process.exit(0);
//     });

//     return Promise.resolve();

//   } catch (error) {
//     router.logger(`[pg-adapter] Error initializing PostgreSQL adapter: ${error}`);
//     // Attempt to reconnect
//     setTimeout(() => initPgAdapter(router), 5000);
//     return Promise.resolve();
//   }
// }
// Option 2: Sequelize-Based Adapter
// If you prefer using Sequelize (which might be easier since you already have models defined):

// typescript
// CopyInsert
// import { Sequelize, Model } from 'sequelize';
// import { ObserverRouter } from '../observer-router';
// import { EventSource } from '../types';

// // Registry for handlers to register their interest in specific models
// export const modelWatchRegistry: Record<string, {
//   modelName: string;
//   eventName: string;
//   interval: number; // polling interval in ms
//   lastCheckedTimestamp?: Date;
// }[]> = {};

// // Store the sequelize instance
// let sequelizeInstance: Sequelize | null = null;

// /**
//  * Register a model to watch for changes
//  * @param modelName The model to watch
//  * @param eventName The event name to emit when changes occur
//  * @param interval Polling interval in milliseconds
//  */
// export function registerModelWatch(modelName: string, eventName: string, interval = 5000): void {
//   if (!modelWatchRegistry[modelName]) {
//     modelWatchRegistry[modelName] = [];
//   }

//   modelWatchRegistry[modelName].push({
//     modelName,
//     eventName,
//     interval,
//     lastCheckedTimestamp: new Date()
//   });
// }

// /**
//  * Initialize Sequelize adapter and set up polling for changes
//  * @param router The ObserverRouter instance to emit events to
//  * @param sequelize The Sequelize instance to use
//  */
// export async function initSequelizeAdapter(router: ObserverRouter, sequelize: Sequelize): Promise<void> {
//   try {
//     sequelizeInstance = sequelize;

//     // Test the connection
//     await sequelize.authenticate();
//     router.logger('[sequelize-adapter] Connected to database');

//     // Set up polling for each registered model
//     for (const [modelName, watchers] of Object.entries(modelWatchRegistry)) {
//       for (const watcher of watchers) {
//         // Start polling for this watcher
//         startPolling(router, watcher);
//       }
//     }

//     // Handle process termination
//     process.on('SIGINT', async () => {
//       router.logger('[sequelize-adapter] Closing database connection');
//       await sequelize.close();
//       process.exit(0);
//     });

//     return Promise.resolve();
//   } catch (error) {
//     router.logger(`[sequelize-adapter] Error initializing adapter: ${error}`);
//     // Attempt to reconnect
//     setTimeout(() => initSequelizeAdapter(router, sequelize), 5000);
//     return Promise.resolve();
//   }
// }

// /**
//  * Start polling for changes to a model
//  * @param router The ObserverRouter instance
//  * @param watcher The watcher configuration
//  */
// function startPolling(
//   router: ObserverRouter,
//   watcher: {
//     modelName: string;
//     eventName: string;
//     interval: number;
//     lastCheckedTimestamp?: Date;
//   }
// ): void {
//   if (!sequelizeInstance) {
//     router.logger('[sequelize-adapter] Sequelize instance not initialized');
//     return;
//   }

//   const poll = async () => {
//     try {
//       const model = sequelizeInstance.model(watcher.modelName);
//       if (!model) {
//         router.logger(`[sequelize-adapter] Model ${watcher.modelName} not found`);
//         return;
//       }

//       // Find records updated since last check
//       const updatedRecords = await model.findAll({
//         where: {
//           updatedAt: {
//             [Sequelize.Op.gt]: watcher.lastCheckedTimestamp
//           }
//         }
//       });

//       // Update the timestamp
//       watcher.lastCheckedTimestamp = new Date();

//       // Emit events for each updated record
//       for (const record of updatedRecords) {
//         router.emit({
//           source: EventSource.POSTGRES,
//           name: watcher.eventName,
//           payload: {
//             data: record.toJSON(),
//             timestamp: new Date()
//           }
//         });
//       }
//     } catch (error) {
//       router.logger(`[sequelize-adapter] Error polling for ${watcher.modelName}: ${error}`);
//     }

//     // Schedule the next poll
//     setTimeout(poll, watcher.interval);
//   };

//   // Start polling
//   poll();
// }
// Usage with Your AssetPrice Model
// With either approach, you could use it with your AssetPrice model like this:

// Using Option 1 (PostgreSQL LISTEN/NOTIFY):
// typescript
// CopyInsert
// // In your handler setup code
// import { registerTableWatch } from '../adapters/pg';

// // Register interest in price changes
// registerTableWatch('asset_prices', 'price', 'asset.price.updated');

// // Then in your handler
// export default {
//   source: EventSource.POSTGRES,
//   type: 'asset.price.updated',
//   handler: async (event: ObserverEvent) => {
//     const { data } = event.payload;
//     console.log(`Price updated for asset ${data.asset_id}: ${data.price}`);
//     // Handle the price update
//   }
// };
// Using Option 2 (Sequelize):
// typescript
// CopyInsert
// // In your handler setup code
// import { registerModelWatch } from '../adapters/sequelize';

// // Register interest in price changes
// registerModelWatch('asset_prices', 'asset.price.updated', 10000); // Check every 10 seconds

// // Then in your handler
// export default {
//   source: EventSource.POSTGRES,
//   type: 'asset.price.updated',
//   handler: async (event: ObserverEvent) => {
//     const { data } = event.payload;
//     console.log(`Price updated for asset ${data.asset_id}: ${data.price}`);
//     // Handle the price update
//   }
// };
// Recommendation
// Since you're already using Sequelize for your TimescaleDB interaction, I recommend Option 2 (Sequelize-based adapter). It will be more consistent with your existing code and easier to maintain. The LISTEN/NOTIFY approach (Option 1) is more efficient for real-time updates but requires more database setup with triggers.

// Would you like me to implement one of these approaches for your project?
