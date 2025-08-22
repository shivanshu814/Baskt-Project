import BN from "bn.js";
import { ObjectId } from "mongoose";

export interface LiquidityPoolMetadata {
  _id?: ObjectId;
  totalLiquidity: BN;
  lpMint: BN;   
  totalShares: BN;
  lastUpdateTimestamp: number;
  depositFeeBps: number;
  withdrawalFeeBps: number;
  bump: number;
  poolAuthorityBump: number;
  pendingLpTokens: BN;
  withdrawQueueHead: number;
  withdrawQueueTail: number;
  fees: {
    totalFeesCollected: BN;
    feesCollected30d: BN;
    feesCollected7d: BN;
    latestApr: number;
    lastTimeAprCalculated?: Date;
  };
  poolAddress: string;
  createdAt?: Date;
  updatedAt?: Date;
}
