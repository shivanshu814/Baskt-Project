import { useUser } from '@baskt/ui';
import { useCallback, useState } from 'react';
import { trpc } from '../../lib/api/trpc';
import { UseReferralCodeReturn } from '../../types/referral';

export function getReferralCode(): UseReferralCodeReturn {
  const { userAddress } = useUser();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { isLoading, refetch } = trpc.referral.generate.useQuery(
    { userAddress: userAddress || '' },
    {
      enabled: !!userAddress && !referralCode,
      onSuccess: (data) => {
        if (data.success && data.referralCode) {
          setReferralCode(data.referralCode);
          setError(null);
        } else {
          setError(data.error || 'Failed to generate referral code');
        }
      },
      onError: (err) => {
        setError(err.message || 'Failed to generate referral code');
      },
    },
  );

  const generateCode = useCallback(async () => {
    if (!userAddress) {
      setError('User address not available');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setReferralCode(null);
      await refetch();
    } catch (err) {
      setError('Failed to generate referral code');
    } finally {
      setIsGenerating(false);
    }
  }, [userAddress, refetch]);

  return {
    referralCode,
    isLoading,
    error,
    generateCode,
    isGenerating,
  };
}
