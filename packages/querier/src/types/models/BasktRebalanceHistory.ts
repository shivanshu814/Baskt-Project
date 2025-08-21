import { Types } from 'mongoose';
import BN from 'bn.js';


export interface BasktRebalanceHistory {
  _id?: Types.ObjectId;
  baskt: Types.ObjectId;
  basktId: string;
  txSignature: string;
  
  // Previous state (before rebalance)
  previousBaselineNav: BN;
  previousRebalanceIndex: BN;
  previousAssetConfigs: {
    assetId: string;
    weight: number;
    direction: boolean;
    baselinePrice: BN;
  }[];
  
  // New state (after rebalance)
  newBaselineNav: BN;
  newRebalanceIndex: BN;
  newAssetConfigs: {
    assetId: string;
    weight: number;
    direction: boolean;
    baselinePrice: BN;
  }[];
  
  // Rebalance fee information
  rebalanceFeePerUnit?: number;
  
  // Performance metrics
  navChange: BN;
  navChangePercentage: number;
  
  createdAt?: Date;
  updatedAt?: Date;
}
