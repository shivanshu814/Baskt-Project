import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { AssetMetadataModel, AssetMetadataSchema } from '@baskt/types';

dotenv.config();

// Define connection URLs (these can be passed as environment variables or command line args)
const SOURCE_DB_URL =
  'mongodb+srv://server:L7NdahgkanJVrBBY@basktbeta.jozlje1.mongodb.net/?retryWrites=true&w=majority&appName=BasktBeta';
const TARGET_DB_URL =
  'mongodb+srv://server:L7NdahgkanJVrBBY@cluster0.rjadk4r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Create mongoose connections
const sourceConnection = mongoose.createConnection(SOURCE_DB_URL);
console.log('Connected to source database');
const targetConnection = mongoose.createConnection(TARGET_DB_URL);
console.log('Connected to target database');

// Register the AssetMetadata model with both connections
const SourceAssetMetadata = sourceConnection.model<AssetMetadataModel>(
  'AssetMetadata',
  AssetMetadataSchema,
);
const TargetAssetMetadata = targetConnection.model<AssetMetadataModel>(
  'AssetMetadata',
  AssetMetadataSchema,
);

async function migrateAssetMetadata() {
  try {
    console.log('Starting asset metadata migration...');

    await sourceConnection.db?.admin().ping();
    await targetConnection.db?.admin().ping();

    console.log('Pinged both databases successfully');

    // Fetch all asset metadata from source database
    const assets = await SourceAssetMetadata.find({});
    console.log(`Found ${assets.length} assets in source database`);

    if (assets.length === 0) {
      console.log('No assets found in source database. Exiting...');
      return;
    }

    // Clear existing data in target collection (optional - comment out if not needed)
    await TargetAssetMetadata.deleteMany({});
    console.log('Cleared existing assets in target database');

    // Insert all assets into target database
    const insertResult = await TargetAssetMetadata.insertMany(assets);
    console.log(`Successfully migrated ${insertResult.length} assets to target database`);

    // Log some sample data for verification
    console.log('Sample migrated assets:');
    const sampleAssets = await TargetAssetMetadata.find().limit(3).lean();
    console.log(JSON.stringify(sampleAssets, null, 2));
  } catch (error) {
    console.error('Error during asset metadata migration:', error);
  } finally {
    // Close both connections
    await sourceConnection.close();
    await targetConnection.close();
    console.log('Database connections closed');
  }
}

// Run the migration
migrateAssetMetadata()
  .then(() => console.log('Asset metadata migration completed'))
  .catch((error) => console.error('Migration failed:', error));
