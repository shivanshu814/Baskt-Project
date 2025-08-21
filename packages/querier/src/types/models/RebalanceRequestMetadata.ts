import { ObjectId } from "mongoose";

export interface RebalanceRequestMetadata { 
    _id?: ObjectId;
    baskt: ObjectId;
    basktId: string;
    creator: string;
    rebalanceRequestFee: number;
    timestamp: number;
    txSignature: string;
    createdAt?: Date;
    updatedAt?: Date;
}