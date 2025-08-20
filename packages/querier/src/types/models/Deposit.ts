import { ObjectId } from "mongoose";

export interface LiquidityDeposit {
  _id?: ObjectId;
  provider: string;
  liquidityPool: string;
  depositAmount: string;
  feeAmount: string;
  sharesMinted: string;
  timestamp: number;
  transactionSignature: string;
  netDeposit: string;
  createdAt?: Date;
  updatedAt?: Date;
}
