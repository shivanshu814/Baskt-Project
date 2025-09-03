import mongoose from 'mongoose';

export const ReferralMetadataSchema = new mongoose.Schema(
  {
    referralID: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    userAddress: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    rewardsValue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    referralDetails: [
      {
        address: {
          type: String,
          required: true,
          trim: true,
        },
        claimed: {
          type: Boolean,
          required: true,
          default: false,
        },
        points: {
          type: Number,
          required: true,
          min: 0,
        },
        claimedAt: {
          type: Date,
          required: false,
        },
        inviteType: {
          type: String,
          required: true,
          enum: ['email', 'code'],
        },
      },
    ],
    referralRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    leaderboard: {
      rank: {
        type: Number,
        required: false,
        min: 1,
      },
    },
    isReferred: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    collection: 'referral_metadata',
  },
);

ReferralMetadataSchema.index({ referralID: 1 });
ReferralMetadataSchema.index({ rewardsValue: -1 });
ReferralMetadataSchema.index({ 'leaderboard.rank': 1 });
ReferralMetadataSchema.index({ isReferred: 1 });
