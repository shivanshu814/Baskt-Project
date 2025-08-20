import { ObjectId } from "mongoose";

export interface RebalanceRequestMetadata { 
    _id?: ObjectId;
    baskt: ObjectId;
    basktId: string;
    creator: string;
    rebalanceRequestFee: string;
    timestamp: number;
    txSignature: string;
    createdAt?: Date;
    updatedAt?: Date;
}