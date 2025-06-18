// // Using type-only import to avoid runtime dependency when MongoDB is not used
// import type { MongoClient, ChangeStream, ChangeStreamDocument } from 'mongodb';
// import type { ObserverRouter, EventSource } from '../observer-router';

// // MongoDB connection configuration
// const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
// const DB_NAME = process.env.MONGO_DB_NAME || 'baskt';

// // Map of collection names to event types
// const MONGO_EVENT_MAP: Record<string, string[]> = {
//   'prices': ['price.updated', 'price.inserted'],
//   'assets': ['asset.created', 'asset.updated'],
//   'baskts': ['baskt.metadata.updated'],
//   // Add more collections and events as needed
// };

// // Cache for active change streams
// const changeStreams: Record<string, ChangeStream> = {};

// interface MongoChangeEvent {
//   operationType: 'insert' | 'update' | 'replace' | 'delete' | string;
//   fullDocument?: Record<string, unknown>;
//   documentKey?: Record<string, unknown>;
//   updateDescription?: Record<string, unknown>;
//   [key: string]: unknown;
// }

// /**
//  * Initialize MongoDB adapter and listen for change stream events
//  * @param router The ObserverRouter instance to emit events to
//  */
// export async function initMongoAdapter(router: ObserverRouter): Promise<void> {
//   try {
//     // Dynamically import MongoDB to avoid requiring it when not used
//     const { MongoClient } = await import('mongodb');

//     const client = new MongoClient(MONGO_URI);
//     await client.connect();
//     router.logger('[mongo-adapter] Connected to MongoDB');

//     const db = client.db(DB_NAME);

//     // Set up change streams for each collection
//     for (const [collectionName, eventTypes] of Object.entries(MONGO_EVENT_MAP)) {
//       const collection = db.collection(collectionName);

//       // Create a change stream
//       const changeStream = collection.watch();
//       changeStreams[collectionName] = changeStream;

//       // Listen for changes
//       changeStream.on('change', (change: ChangeStreamDocument<unknown>) => {
//         // Determine event type based on operation type
//         const mongoEvent = change as MongoChangeEvent;
//         let eventType: string | null = null;

//         switch (mongoEvent.operationType) {
//           case 'insert':
//             eventType = eventTypes.find(e => e.includes('.inserted') || e.includes('.created')) || null;
//             break;
//           case 'update':
//           case 'replace':
//             eventType = eventTypes.find(e => e.includes('.updated')) || null;
//             break;
//           case 'delete':
//             eventType = eventTypes.find(e => e.includes('.deleted') || e.includes('.removed')) || null;
//             break;
//           // Add more cases as needed
//         }

//         if (eventType) {
//           // Emit the event to the router
//           router.emit({
//             source: 'mongo' as EventSource,
//             type: eventType,
//             payload: {
//               ...mongoEvent,
//               collectionName,
//               timestamp: new Date(),
//             },
//           });
//         }
//       });

//       router.logger(`[mongo-adapter] Watching collection: ${collectionName}`);
//     }

//     // Handle process termination
//     process.on('SIGINT', async () => {
//       router.logger('[mongo-adapter] Closing MongoDB connection');
//       for (const stream of Object.values(changeStreams)) {
//         await stream.close();
//       }
//       await client.close();
//       process.exit(0);
//     });

//     return Promise.resolve();

//   } catch (error) {
//     router.logger(`[mongo-adapter] Error initializing MongoDB adapter: ${error}`);
//     throw error;
//   }
// }
