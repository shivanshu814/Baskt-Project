import { Types } from 'mongoose';


export interface BasktRebalanceHistory {
  _id?: Types.ObjectId;
  baskt: Types.ObjectId;
  basktId: string;
  txSignature: string;
  
  // Previous state (before rebalance)
  previousBaselineNav: string;
  previousRebalanceIndex: number;
  previousAssetConfigs: {
    assetId: string;
    weight: string;
    direction: boolean;
    baselinePrice: string;
  }[];
  
  // New state (after rebalance)
  newBaselineNav: string;
  newRebalanceIndex: number;
  newAssetConfigs: {
    assetId: string;
    weight: string;
    direction: boolean;
    baselinePrice: string;
  }[];
  
  // Rebalance fee information
  rebalanceFeePerUnit?: string;
  
  // Performance metrics
  navChange: string;
  navChangePercentage: number;
  
  createdAt?: Date;
  updatedAt?: Date;
}
