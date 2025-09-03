import { useUser } from '@baskt/ui';
import { trpc } from '../../lib/api/trpc';
import { UseUserReferralDataReturn } from '../../types/referral';

export function getReferralData(): UseUserReferralDataReturn {
  const { userAddress } = useUser();

  const {
    data: queryResult,
    isLoading,
    error,
    refetch,
  } = trpc.referral.getUserData.useQuery(
    { userAddress: userAddress || '' },
    {
      enabled: !!userAddress,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  );

  return {
    data: queryResult?.data ?? null,
    isLoading,
    error: (error?.message || queryResult?.error) ?? null,
    refetch,
  };
}
