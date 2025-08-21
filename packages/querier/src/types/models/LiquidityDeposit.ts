import BN from "bn.js";
import { ObjectId } from "mongoose";

export interface LiquidityDeposit {
  _id?: ObjectId;
  provider: string;
  liquidityPool: string;
  depositAmount: BN;
  feeAmount: BN;
  sharesMinted: BN;
  timestamp: number;
  transactionSignature: string;
  netDeposit: BN;
  createdAt?: Date;
  updatedAt?: Date;
}
