import mongoose from 'mongoose';

export interface AccessCodeModel {
  code: string;
  isUsed: boolean;
  usedBy?: string;
  createdAt: Date;
  expiresAt: Date;
  description?: string;
  _id?: string;
}

export const AccessCodeSchema = new mongoose.Schema<AccessCodeModel>({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedBy: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
});

AccessCodeSchema.index({ isUsed: 1 });
AccessCodeSchema.index({ expiresAt: 1 });
