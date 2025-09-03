import { z } from 'zod';
import { emailService } from '../../services/email.service';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/';
import logger from '../../utils/logger';

export const trackReferralUsage = publicProcedure
  .input(
    z.object({
      referralCode: z.string(),
      userAddress: z.string(),
      inviteType: z.enum(['email', 'code']).optional().default('code'),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const result = await querier.referral.trackReferralUsage(input);
      return result;
    } catch (error) {
      logger.error('Error tracking referral usage:', error);
      return {
        success: false,
        error: 'Failed to track referral usage',
      };
    }
  });

export const sendReferralEmail = publicProcedure
  .input(
    z.object({
      referrerAddress: z.string(),
      inviteeEmail: z.string().email(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const { referrerAddress, inviteeEmail } = input;

      const referrerData = await querier.referral.getUserReferralData(referrerAddress);

      if (!referrerData) {
        return { success: false, error: 'Referrer not found' };
      }

      if (!referrerData.referralID) {
        return { success: false, error: 'Referrer has no referral code' };
      }

      const referralLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?via=${
        referrerData.referralID
      }`;

      const emailSent = await emailService.sendReferralInvitation({
        referrerName: 'Baskt User',
        referrerAddress,
        referralCode: referrerData.referralID,
        referralLink,
        inviteeEmail,
      });

      if (!emailSent) {
        return { success: false, error: 'Failed to send email' };
      }

      logger.info(`Referral email sent successfully`, {
        referrerAddress,
        inviteeEmail,
        referralCode: referrerData.referralID,
      });

      return {
        success: true,
        message: 'Referral email sent successfully',
        referralCode: referrerData.referralID,
        referralLink,
      };
    } catch (error) {
      logger.error('Error sending referral email:', error);
      return { success: false, error: 'Failed to send referral email' };
    }
  });
