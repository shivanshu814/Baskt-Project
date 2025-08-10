import mongoose from 'mongoose';
import dotenv, { config } from 'dotenv';
import { AssetMetadataModel, AssetMetadataSchema } from '../../../querier/src/types/models';
import { getProvider } from '../utils';
import { TestClient } from '../../tests/utils/test-client';

dotenv.config();

// Define connection URLs (these can be passed as environment variables or command line args)
const  SOURCE_DB_URL=
  'mongodb+srv://server:L7NdahgkanJVrBBY@basktbeta.jozlje1.mongodb.net/?retryWrites=true&w=majority&appName=BasktBeta';
const  TARGET_DB_URL=
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

    const newAssets = assets;

    console.log('Migrating assets on chain...');

    const {  provider, wallet, program } = getProvider('https://fabled-indulgent-seed.solana-devnet.quiknode.pro/19abbec85e908d5bdf453cc6bf35fb6d8d559b80/');
    const client = new TestClient(program);

    console.log(program.programId.toBase58());

    for (const asset of newAssets) {
      const assetPDA = await client.getAssetPDA(asset.ticker);

      if(assetPDA.toBase58() === asset.assetAddress) {
        console.log(`Asset already exists on chain and in db`, asset.ticker, asset.assetAddress, assetPDA.toBase58());
        continue;
      } 
      asset.assetAddress = assetPDA.toBase58();

      try {
        const account = await client.getAsset(assetPDA);
        console.log(`Asset ${asset.ticker} ${asset.assetAddress} ${assetPDA.toBase58()} already exists on chain. will add to DB`);
        continue;
      } catch (error) {
        const addAssetTx = await client.addAsset(asset.ticker); 
        console.log(`Added asset ${asset.ticker} ${asset.assetAddress} to blockchain`, addAssetTx);
      }
    }
    
    // Insert all assets into target database
    const insertResult = await TargetAssetMetadata.insertMany(newAssets);
    console.log(`Successfully migrated ${insertResult.length} assets to target database`);
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
