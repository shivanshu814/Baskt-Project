import { ObjectId } from "mongoose";

export interface LiquidityPoolMetadata {
  _id?: ObjectId;
  totalLiquidity: string;
  lpMint: string;
  totalShares: string;
  lastUpdateTimestamp: number;
  depositFeeBps: number;
  withdrawalFeeBps: number;
  bump: number;
  poolAuthorityBump: number;
  pendingLpTokens: string;
  withdrawQueueHead: number;
  withdrawQueueTail: number;
  poolAddress: string;
  createdAt?: Date;
  updatedAt?: Date;
}
