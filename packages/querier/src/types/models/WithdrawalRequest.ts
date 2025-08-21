import { ObjectId } from "mongoose";
import { WithdrawRequestStatus } from "@baskt/types";
import BN from "bn.js";

export interface WithdrawalRequest {
  _id?: ObjectId;
  
  // Core fields matching the schema
  requestId: number;
  withdrawalProcessAddress: string;
  provider: string;
  requestedLpAmount: BN;
  remainingLp: BN;
  providerUsdcAccount: string;
  status: WithdrawRequestStatus;
  
  // Request details
  requestedAt: {
    ts: number;
    tx?: string;
  };
  bump: number;
  
  // Processing details
  processedAt?: {
    tx?: string;
    processedTs?: number;
  };
  
  // Processing history for partial processing
  processingHistory?: Array<{
    ts: number;
    tx: string;
    amountProcessed: BN;
    lpTokensBurned: BN;
  }>;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}
