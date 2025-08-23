import { ObjectId } from "mongoose";
import { RebalanceRequestStatus } from "./schemas/RebalanceRequestSchema";

export interface RebalanceRequestMetadata { 
    _id?: ObjectId;
    baskt: ObjectId;
    basktId: string;
    creator: string;
    rebalanceRequestFee: number;
    timestamp: number;
    txSignature: string;
    status: RebalanceRequestStatus;
    createdAt?: Date;
    updatedAt?: Date;
}