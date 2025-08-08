import mongoose from 'mongoose';

export interface AuthorizedWalletModel {
  walletAddress: string;
  authorizedAt: Date;
  accessCodeUsed: string;
  lastLoginAt?: Date;
  isActive: boolean;
  _id?: string;
}

export const AuthorizedWalletSchema = new mongoose.Schema<AuthorizedWalletModel>({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  authorizedAt: {
    type: Date,
    default: Date.now,
  },
  accessCodeUsed: {
    type: String,
    required: true,
    trim: true,
  },
  lastLoginAt: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

AuthorizedWalletSchema.index({ isActive: 1 });
AuthorizedWalletSchema.index({ authorizedAt: 1 });
