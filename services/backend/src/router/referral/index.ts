import { router } from '../../trpc/trpc';
import { sendReferralEmail, trackReferralUsage } from './mutation';
import { generateReferralCode, getUserReferralData } from './query';

export const referralRouter = router({
  generate: generateReferralCode,
  getUserData: getUserReferralData,
  trackUsage: trackReferralUsage,
  sendEmail: sendReferralEmail,
});
