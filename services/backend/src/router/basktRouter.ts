import { z } from 'zod';
import { AssetMetadataModel, BasktMetadataModel } from '../utils/models';
import { sdkClient } from '../utils';
import { PublicKey } from '@solana/web3.js';
import { getAssetFromAddress } from './assetRouter';

// Schema for validating baskt creation request
const createBasktSchema = z.object({
  basktId: z.string(),
  name: z.string().min(1).max(30),
  description: z.string().min(1),
  creator: z.string(),
  categories: z.array(z.string()).min(1),
  risk: z.enum(['low', 'medium', 'high']),
  assets: z.array(z.string()),
  image: z.string().optional(),
  rebalancePeriod: z.object({
    value: z.number().min(1),
    unit: z.enum(['day', 'hour']),
  }),
  txSignature: z.string(),
});

const sdkClientInstance = sdkClient();

/**
 * Create a new baskt metadata
 */
export async function createBasktMetadata(basktData: z.infer<typeof createBasktSchema>) {
  try {
    // Create new BasktMetadata
    const newBasktMetadata = new BasktMetadataModel({
      ...basktData,
      creationDate: new Date(),
    });

    const savedBasktMetadata = await newBasktMetadata.save();

    return {
      success: true,
      data: savedBasktMetadata,
    };
  } catch (error) {
    console.error('Error creating baskt metadata:', error);
    return {
      success: false,
      message: 'Failed to create baskt metadata',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get baskt metadata by ID
 */
export async function getBasktMetadataById(basktId: string) {
  try {
    const basktInfo = await getBasktInfoFromAddress(basktId);
    if (!basktInfo) {
      return {
        success: false,
        message: 'Baskt metadata not found',
      };
    }

    return {
      success: true,
      data: basktInfo,
    };
  } catch (error) {
    console.error('Error fetching baskt metadata:', error);
    return {
      success: false,
      message: 'Failed to fetch baskt metadata',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all baskts
 */
export async function getAllBaskts() {
  try {
    const baskts = await BasktMetadataModel.find().exec();
    const allBaskts = await sdkClientInstance.getAllBaskts();

    const basktInfos = allBaskts.map((baskt) => {
      return convertToBasktInfo(
        baskt,
        baskts.find((b) => b.basktId === baskt.account.basktId.toString()),
      );
    });

    return {
      success: true,
      data: basktInfos,
    };
  } catch (error) {
    console.error('Error fetching baskts:', error);
    return {
      success: false,
      message: 'Failed to fetch baskts',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getBasktInfoFromAddress(basktId: string) {
  const basktMetadata = await BasktMetadataModel.findOne({ basktId }).exec();
  if (!basktMetadata) {
    return null;
  }
  const onchainBaskt = await sdkClientInstance.getBaskt(new PublicKey(basktId));
  if (!onchainBaskt) {
    return null;
  }
  return convertToBasktInfo(onchainBaskt, basktMetadata);
}

export async function convertToBasktInfo(onchainBaskt: any, basktMetadata: any) {
  const assets: any[] = [];
  for (const asset of onchainBaskt.currentAssetConfigs) {
    assets.push({
      ...(await getAssetFromAddress(asset.assetId.toString())),
      weightage: (asset.weight * 100) / 10_000,
      position: asset.direction ? 'long' : 'short',
    });
  }
  return {
    assets,
    name: basktMetadata.name,
    description: basktMetadata.description,
    price: 0,
    change24h: 0,
    category: 'PlaceHolder',
    risk: 'medium',
    totalAssets: 0,
    creator: basktMetadata.creator,
    id: basktMetadata.basktId.toString(),
    image: basktMetadata.image,
    creationDate: new Date().toISOString(),
    priceHistory: {
      daily: Array(24)
        .fill(0)
        .map((_, i) => ({
          date: new Date(Date.now() - (24 - i) * 3600000).toISOString(),
          price: 150 + Math.sin(i) * 5,
          volume: 1000000 + Math.random() * 500000,
        })),
      weekly: Array(7)
        .fill(0)
        .map((_, i) => ({
          date: new Date(Date.now() - (7 - i) * 86400000).toISOString(),
          price: 150 + Math.sin(i) * 10,
          volume: 2000000 + Math.random() * 1000000,
        })),
      monthly: Array(30)
        .fill(0)
        .map((_, i) => ({
          date: new Date(Date.now() - (30 - i) * 86400000).toISOString(),
          price: 150 + Math.sin(i) * 15,
          volume: 3000000 + Math.random() * 1500000,
        })),
      yearly: Array(12)
        .fill(0)
        .map((_, i) => ({
          date: new Date(Date.now() - (12 - i) * 2592000000).toISOString(),
          price: 150 + Math.sin(i) * 20,
          volume: 4000000 + Math.random() * 2000000,
        })),
    },
    performance: {
      day: 2.5,
      week: 5.2,
      month: 12.8,
      year: 45.6,
    },
  };
}

/**
 * Check if a baskt name already exists in the database
 * @param name The baskt name to check
 * @returns Promise<boolean> True if name exists, false otherwise
 */
export async function checkBasktNameExists(name: string): Promise<boolean> {
  try {
    const existingBaskt = await BasktMetadataModel.findOne({ name }).exec();
    return !!existingBaskt;
  } catch (error) {
    console.error('Error checking baskt name:', error);
    throw new Error('Failed to check baskt name');
  }
}
