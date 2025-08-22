import { ObjectId } from 'mongoose';
import { AssetPriceProviderConfig } from '@baskt/types';
import BN  from 'bn.js';

export interface AssetMetadata {
  _id?: ObjectId;
  ticker: string;
  name: string;
  assetAddress: string; // Pubkey as string
  permissions: {
    allowLongs: boolean;
    allowShorts: boolean;
  };
  allTimeLongVolume: BN;
  allTimeShortVolume: BN;
  isActive: boolean;
  listingTime: number; // Unix timestamp
  // Additional metadata fields for UI
  priceConfig: AssetPriceProviderConfig;
  logo: string;
  basktIds: string[];
  coingeckoId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

