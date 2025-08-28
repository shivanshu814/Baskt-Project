import { trpc } from '../../../../lib/api/trpc';

export function usePositionHistory(basktId?: string, userAddress?: string) {
  const positionsQuery = trpc.history.getPositionHistory.useQuery(
    {
      basktId: basktId || undefined,
      userId: userAddress || undefined,
    },
    {
      enabled: !!userAddress,
      refetchInterval: 30 * 1000,
    },
  );

  return {
    history: positionsQuery.data?.success ? (positionsQuery.data as any).data || [] : [],
    isLoading: positionsQuery.isLoading,
    isError: positionsQuery.isError,
    error: positionsQuery.error,
  };
}
