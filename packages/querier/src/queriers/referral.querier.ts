import { ReferralMetadataModel } from '../models/mongodb';
import {
  GenerateReferralCodeParams,
  GenerateReferralCodeResult,
  TrackReferralUsageParams,
  TrackReferralUsageResult,
} from '../types/referral';

export class ReferralQuerier {
  /**
   * Generate a unique referral code
   * The code is created only once per user and never changes
   */
  async generateReferralCode(
    params: GenerateReferralCodeParams,
  ): Promise<GenerateReferralCodeResult> {
    try {
      const { userAddress } = params;

      const existingReferral = await ReferralMetadataModel.findOne({
        userAddress: userAddress,
      });

      if (existingReferral) {
        return {
          success: true,
          referralCode: existingReferral.referralID,
        };
      }

      const referralCode = this.createUniqueReferralCode();

      const referralData = {
        referralID: referralCode,
        userAddress: userAddress,
        rewardsValue: 0,
        referralDetails: [],
        referralRate: 10,
        leaderboard: {},
        isReferred: false,
      };

      const newReferral = new ReferralMetadataModel(referralData);
      await newReferral.save();

      // Update all leaderboard ranks since new user joined
      await this.updateAllLeaderboardRanks();

      return {
        success: true,
        referralCode,
      };
    } catch (error) {
      console.error('Error generating referral code:', error);
      return {
        success: false,
        error: 'Failed to generate referral code',
      };
    }
  }

  /**
   * Track referral code usage
   */
  async trackReferralUsage(params: TrackReferralUsageParams): Promise<TrackReferralUsageResult> {
    try {
      const { referralCode, userAddress, inviteType = 'code' } = params;

      const existingUserReferral = await ReferralMetadataModel.findOne({
        'referralDetails.address': userAddress,
      });

      if (existingUserReferral) {
        return {
          success: false,
          error: 'User has already used a referral code before',
        };
      }

      const userReferralRecord = await ReferralMetadataModel.findOne({
        userAddress: userAddress,
      });

      const referral = await ReferralMetadataModel.findOne({
        referralID: referralCode,
      });

      if (!referral) {
        return {
          success: false,
          error: 'Referral code not found',
        };
      }

      if (referral.userAddress === userAddress) {
        return {
          success: false,
          error: 'You cannot use your own referral code',
        };
      }

      referral.referralDetails.push({
        address: userAddress,
        claimed: true,
        points: 10,
        claimedAt: new Date(),
        inviteType,
      });

      referral.rewardsValue += 10;

      await referral.save();

      // Create user referral record if it doesn't exist and mark as referred
      if (userReferralRecord) {
        userReferralRecord.isReferred = true;
        await userReferralRecord.save();
      } else {
        // Create new referral record for the user who used the code
        const newUserReferralData = {
          referralID: this.createUniqueReferralCode(),
          userAddress: userAddress,
          rewardsValue: 0,
          referralDetails: [],
          referralRate: 10,
          leaderboard: {},
          isReferred: true, // Mark as referred since they used someone's code
        };

        const newUserReferral = new ReferralMetadataModel(newUserReferralData);
        await newUserReferral.save();

        // Set initial leaderboard rank for new user
        await this.updateLeaderboardRank(userAddress);
      }

      // Update leaderboard ranks for all users since rewards changed
      await this.updateAllLeaderboardRanks();

      return {
        success: true,
        ownerAddress: referral.userAddress,
        pointsEarned: 10,
      };
    } catch (error) {
      console.error('Error tracking referral usage:', error);
      return {
        success: false,
        error: 'Failed to track referral usage',
      };
    }
  }

  /**
   * Get complete referral data for a user
   */
  async getUserReferralData(userAddress: string): Promise<any> {
    try {
      const referralData = await ReferralMetadataModel.findOne({
        userAddress: userAddress,
      }).lean();

      return referralData;
    } catch (error) {
      console.error('Error fetching user referral data:', error);
      return null;
    }
  }

  /**
   * Update leaderboard rank for a user
   */
  async updateLeaderboardRank(userAddress: string): Promise<void> {
    try {
      const allUsers = await ReferralMetadataModel.find({})
        .sort({ rewardsValue: -1 })
        .select('userAddress rewardsValue')
        .lean();

      const userRank = allUsers.findIndex((user) => user.userAddress === userAddress) + 1;

      await ReferralMetadataModel.updateOne(
        { userAddress: userAddress },
        {
          $set: {
            'leaderboard.rank': userRank > 0 ? userRank : null,
          },
        },
      );

      console.log(`Updated leaderboard rank for ${userAddress}: ${userRank}`);
    } catch (error) {
      console.error('Error updating leaderboard rank:', error);
    }
  }

  /**
   * Update leaderboard ranks for all users (for existing data migration)
   */
  async updateAllLeaderboardRanks(): Promise<void> {
    try {
      const allUsers = await ReferralMetadataModel.find({})
        .sort({ rewardsValue: -1 })
        .select('userAddress rewardsValue')
        .lean();

      for (let i = 0; i < allUsers.length; i++) {
        const user = allUsers[i];
        const rank = i + 1;

        await ReferralMetadataModel.updateOne(
          { userAddress: user.userAddress },
          {
            $set: {
              'leaderboard.rank': rank,
            },
          },
        );

        console.log(`Updated rank for ${user.userAddress}: ${rank}`);
      }

      console.log(`Updated leaderboard ranks for ${allUsers.length} users`);
    } catch (error) {
      console.error('Error updating all leaderboard ranks:', error);
    }
  }

  private createUniqueReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }
}
