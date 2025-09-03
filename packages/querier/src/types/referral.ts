import { Types } from 'mongoose';

export interface ReferralMetadata {
  _id?: Types.ObjectId | string;
  referralID: string;
  userAddress: string;
  rewardsValue: number;
  referralDetails: ReferralDetail[];
  referralRate: number;
  leaderboard: {
    rank?: number;
  };
  isReferred: boolean;
}

export interface ReferralDetail {
  address: string;
  claimed: boolean;
  points: number;
  claimedAt?: Date;
  inviteType: 'email' | 'code';
}

export interface GenerateReferralCodeParams {
  userAddress: string;
}

export interface GenerateReferralCodeResult {
  success: boolean;
  referralCode?: string;
  error?: string;
}

export interface TrackReferralUsageParams {
  referralCode: string;
  userAddress: string;
  inviteType?: 'email' | 'code';
}

export interface TrackReferralUsageResult {
  success: boolean;
  ownerAddress?: string;
  pointsEarned?: number;
  error?: string;
}

export interface GetReferralCodeOwnerParams {
  referralCode: string;
}

export interface GetReferralCodeOwnerResult {
  success: boolean;
  ownerAddress?: string;
  referralCode?: string;
  totalRewards?: number;
  totalReferrals?: number;
  error?: string;
}
