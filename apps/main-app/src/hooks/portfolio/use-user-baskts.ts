import { useBasktClient } from '@baskt/ui';
import { useMemo } from 'react';
import { trpc } from '../../lib/api/trpc';

export function useUserBaskts() {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();

  const basktsQuery = trpc.baskt.getAllBaskts.useQuery(
    { withPerformance: true },
    {
      refetchInterval: 30 * 1000,
    },
  );

  const userBaskts = useMemo(() => {
    const baskts = (basktsQuery.data as any)?.data || [];

    if (!userAddress) return [];

    return baskts.filter(
      (baskt: any) =>
        baskt.creator &&
        baskt.creator.toLowerCase() === userAddress.toLowerCase() &&
        baskt.name &&
        baskt.name.trim() !== '',
    );
  }, [basktsQuery.data, userAddress]);

  return {
    userBaskts,
    isLoading: basktsQuery.isLoading,
    isError: basktsQuery.isError,
    error: basktsQuery.error,
  };
}
