import { ObjectId } from "mongoose";

export enum EventProcessStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface SolanaEventsMetadata { 
  _id?: string;
  eventName: string;
  payload: string; // JSON string of the event data
  eventTx: string; // transaction signature
  processStatus: EventProcessStatus;
  error?: string; // error message if processing failed
  createdAt?: Date;
  updatedAt?: Date;
}
