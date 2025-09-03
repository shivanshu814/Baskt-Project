import { useCallback, useState } from 'react';
import { trpc } from '../../lib/api/trpc';
import { UseTrackReferralReturn } from '../../types/referral';

export function postTrackReferral(): UseTrackReferralReturn {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const trackReferralMutation = trpc.referral.trackUsage.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSuccess(true);
        setError(null);
        console.log('Referral tracked successfully:', data);
      } else {
        setError(data.error || 'Failed to track referral usage');
        setSuccess(false);
      }
    },
    onError: (err) => {
      console.error('Error tracking referral:', err);
      setError(err.message || 'Failed to track referral usage');
      setSuccess(false);
    },
  });

  const trackReferral = useCallback(
    async (referralCode: string, userAddress: string) => {
      try {
        setError(null);
        setSuccess(false);

        await trackReferralMutation.mutateAsync({
          referralCode,
          userAddress,
          inviteType: 'code',
        });
      } catch (err) {
        console.error('Error tracking referral:', err);
        setError('Failed to track referral usage');
        setSuccess(false);
      }
    },
    [trackReferralMutation],
  );

  return {
    trackReferral,
    error,
    success,
  };
}
