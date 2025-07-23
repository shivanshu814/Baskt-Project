import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  AssetMetadataModel,
  AssetMetadataSchema,
  BasktMetadataModel,
  BasktMetadataSchema,
  BasktStatus,
} from '@baskt/types';
import { TestClient } from '../../tests/utils/test-client';

dotenv.config();

const TARGET_DB_URL =
  'mongodb+srv://server:L7NdahgkanJVrBBY@cluster0.rjadk4r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const targetConnection = mongoose.createConnection(TARGET_DB_URL);
console.log('Connected to target database');

// Register the AssetMetadata model with both connections
const SourceBasktMetadata = targetConnection.model<BasktMetadataModel>(
  'BasktMetadata',
  BasktMetadataSchema,
);

process.env.ANCHOR_WALLET = '/Users/nshmadhani/.config/solana/id.json';
process.env.ANCHOR_PROVIDER_URL =
  'https://fabled-indulgent-seed.solana-devnet.quiknode.pro/19abbec85e908d5bdf453cc6bf35fb6d8d559b80/';

async function migrateBaskts() {
  try {
    console.log('Starting Baskt metadata migration...');

    const basktClient = new TestClient();

    const onchainBaskts = await basktClient.getAllBaskts();

    for (const baskt of onchainBaskts) {
      if (!baskt.account.status.active) {
        continue;
      }
      await SourceBasktMetadata.create({
        basktId: baskt.account.basktId,
        name: baskt.account.basktName,
        creator: baskt.account.creator,
        creationDate: new Date(baskt.account.creationTime.toNumber()),
        rebalancePeriod: {
          value: 24,
          unit: 'hour',
        },
        txSignature: 'pending',
        createdAt: new Date(baskt.account.creationTime.toNumber()),
        updatedAt: new Date(baskt.account.creationTime.toNumber()),
      });
    }

    await targetConnection.db?.admin().ping();
  } catch (error) {
    console.error('Error during baskt metadata migration:', error);
  } finally {
    // Close both connections
    await targetConnection.close();
    console.log('Database connections closed');
  }
}

// Run the migration
migrateBaskts()
  .then(() => console.log('Asset metadata migration completed'))
  .catch((error) => console.error('Migration failed:', error));
