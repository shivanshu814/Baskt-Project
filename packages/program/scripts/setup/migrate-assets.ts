import { getProvider } from '../utils';
import { BaseClient } from '../../../sdk/src/base-client';
import mongoose from 'mongoose';
import { AssetMetadataSchema } from '../../../querier/src/types/models';
import dotenv from 'dotenv';

// Configuration - Hardcoded values
const config: MigrationConfig = {
  sourceMongoUri: 'mongodb+srv://server:L7NdahgkanJVrBBY@basktbeta.jozlje1.mongodb.net/?retryWrites=true&w=majority&appName=BasktBeta',
  targetMongoUri: 'mongodb+srv://server:L7NdahgkanJVrBBY@cluster0.rjadk4r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    rpcUrl: 'https://fabled-indulgent-seed.solana-devnet.quiknode.pro/19abbec85e908d5bdf453cc6bf35fb6d8d559b80/',
    walletPath: process.env.ANCHOR_WALLET,
  };

dotenv.config();


interface MigrationConfig {
  sourceMongoUri: string;
  targetMongoUri: string;
  rpcUrl: string;
  walletPath?: string;
}

interface AssetMetadata {
  _id: any; // Changed to any to handle ObjectId
  ticker: string;
  name: string;
  assetAddress: string;
  priceConfig: {
    provider: {
      id: string;
      chain?: string; // Made optional to match schema
      name: string;
    };
    twp: {
      seconds: number;
    };
    updateFrequencySeconds: number;
    units: number;
  };
  coingeckoId?: string;
  logo: string;
  createdAt?: Date;
  basktIds?: string[];
}

class AssetMigrationClient extends BaseClient {
  private walletPublicKey: any;

  constructor(connection: any, provider: any, userPublicKey?: any, anchorProvider?: any) {
    super(connection,   {
        sendAndConfirmLegacy: (tx) => {
          return anchorProvider.sendAndConfirm(tx);
        },
        sendAndConfirmV0: (tx) => {
          return anchorProvider.sendAndConfirm(tx);
        },
      }, userPublicKey, anchorProvider);
    this.walletPublicKey = userPublicKey;
  }

  getPublicKey(): any {
    return this.walletPublicKey;
  }
}




async function getAssetMetadataFromSource(sourceModel: any): Promise<AssetMetadata[]> {
  try {
    const assets = await sourceModel.find({}).lean();
    console.log(`📊 Found ${assets.length} assets in source database`);
    return assets as AssetMetadata[];
  } catch (error) {
    console.error('❌ Error fetching assets from source:', error);
    throw error;
  }
}

async function checkAssetExistsInTarget(targetModel: any, ticker: string): Promise<boolean> {
  try {
    const existingAsset = await targetModel.findOne({ ticker }).lean();
    return !!existingAsset;
  } catch (error) {
    console.error('❌ Error checking asset existence in target:', error);
    throw error;
  }
}

async function migrateAssetToTarget(targetModel: any, asset: AssetMetadata): Promise<boolean> {
  try {
    // Remove _id to create new document
    const { _id, ...assetData } = asset;
    
    const newAsset = new targetModel({
      ...assetData,
      createdAt: new Date(), // Set new creation date
    });
    
    await newAsset.save();
    console.log(`✅ Migrated asset ${asset.ticker} to target database`);
    return true;
  } catch (error) {
    console.error(`❌ Error migrating asset ${asset.ticker} to target:`, error);
    return false;
  }
}

async function addAssetToBlockchain(client: AssetMigrationClient, asset: AssetMetadata): Promise<boolean> {
  try {
    // Check if asset already exists on blockchain
    const existingAsset = await client.getAssetByTicker(asset.ticker);
    if (existingAsset) {
      console.log(`⚠️  Asset ${asset.ticker} already exists on blockchain, skipping...`);
      return true;
    }

    // Add asset to blockchain
    const permissions = {
      allowLongs: true,
      allowShorts: true,
    };

    const result = await client.addAsset(asset.ticker, permissions);
    console.log(`✅ Added asset ${asset.ticker} to blockchain. TX: ${result.txSignature}`);
    return true;
  } catch (error) {
    console.error(`❌ Error adding asset ${asset.ticker} to blockchain:`, error);
    return false;
  }
}

async function main() {

  console.log('🚀 Starting asset migration process...');
  console.log('📋 Configuration:');
  console.log(`   Source DB: basktbeta.jozlje1.mongodb.net (beta.prod)`);
  console.log(`   Target DB: cluster0.rjadk4r.mongodb.net (dev)`);
  console.log(`   RPC URL: Solana Devnet`);

  try {
    // Connect to both databases
    const sourceConnection = await mongoose.createConnection(config.sourceMongoUri);
    const targetConnection = await mongoose.createConnection(config.targetMongoUri);




    // Create models for each connection
    const sourceModel = sourceConnection.model('AssetMetadata', AssetMetadataSchema);    
    console.log(sourceModel);

    const targetModel = targetConnection.model('AssetMetadata', AssetMetadataSchema);
    console.log(targetModel);


    // Initialize blockchain client
    const { provider, wallet } = getProvider(config.rpcUrl);
    const client = new AssetMigrationClient(provider.connection, provider, wallet.publicKey, provider);

    // Get all assets from source database
    console.log('\n📥 Fetching assets from source database...');
    const assets = await getAssetMetadataFromSource(sourceModel);

    if (assets.length === 0) {
      console.log('ℹ️  No assets found in source database');
      return;
    }

    console.log(`\n🔄 Starting migration of ${assets.length} assets...`);
    console.log('='.repeat(80));

    let migratedCount = 0;
    let blockchainCount = 0;
    let skippedCount = 0;

    // Process assets one by one
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      console.log(`\n📦 Processing asset ${i + 1}/${assets.length}: ${asset.ticker}`);
      console.log(`   Name: ${asset.name}`);
      console.log(`   Address: ${asset.assetAddress}`);

      try {
                // Check if asset already exists in target database
        const existsInTarget = await checkAssetExistsInTarget(targetModel, asset.ticker);
        
        if (existsInTarget) {
          console.log(`   ⚠️  Asset ${asset.ticker} already exists in target database, but will still try to add to blockchain...`);
        } else {
          // Migrate to target database only if it doesn't exist
          const dbSuccess = await migrateAssetToTarget(targetModel, asset);
          if (!dbSuccess) {
            console.log(`   ❌ Failed to migrate ${asset.ticker} to database, skipping blockchain...`);
            continue;
          }
          console.log(`   ✅ Migrated asset ${asset.ticker} to target database`);
        }

        migratedCount++;

        // Add to blockchain
        const blockchainSuccess = await addAssetToBlockchain(client, asset);
        if (blockchainSuccess) {
          blockchainCount++;
        }

        // Add delay between operations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`   ❌ Error processing asset ${asset.ticker}:`, error);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 Migration Summary:');
    console.log(`   Total assets processed: ${assets.length}`);
    console.log(`   Successfully migrated to DB: ${migratedCount}`);
    console.log(`   Successfully added to blockchain: ${blockchainCount}`);
    console.log(`   Skipped (already exists): ${skippedCount}`);
    console.log(`   Failed: ${assets.length - migratedCount - skippedCount}`);
    console.log('='.repeat(80));

    // Close connections
    await sourceConnection.close();
    await targetConnection.close();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Migration terminated');
  process.exit(0);
});

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
}); 