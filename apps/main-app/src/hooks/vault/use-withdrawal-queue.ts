import { useEffect } from 'react';
import { trpc } from '../../lib/api/trpc';
import { UseWithdrawQueueProps, WithdrawQueueItem, WithdrawQueueStats } from '../../types/vault';

// fetch withdrawal queue items and stats
export const useWithdrawQueue = ({ userAddress, poolId }: UseWithdrawQueueProps) => {
  const {
    data: userQueueItems,
    refetch: refetchUserQueueItems,
    isLoading: isLoadingItems,
  } = trpc.pool.getUserWithdrawQueueItems.useQuery(
    { userAddress: userAddress || '', poolId: poolId || '' },
    {
      enabled: !!userAddress && !!poolId,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  );

  const {
    data: queueStats,
    refetch: refetchQueueStats,
    isLoading: isLoadingStats,
  } = trpc.pool.getWithdrawQueueStats.useQuery(
    { poolId: poolId || '', userAddress },
    {
      enabled: !!userAddress && !!poolId,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  );

  useEffect(() => {
    if (userAddress && poolId) {
      refetchUserQueueItems();
      refetchQueueStats();
    }
  }, [userAddress, poolId, refetchUserQueueItems, refetchQueueStats]);

  const getData = <T>(response: any): T | undefined => {
    return response?.success && 'data' in response ? response.data : undefined;
  };

  const processedUserQueueItems = getData<WithdrawQueueItem[]>(userQueueItems) || [];
  const processedQueueStats = getData<WithdrawQueueStats>(queueStats);

  return {
    userQueueItems: processedUserQueueItems,
    queueStats: processedQueueStats,
    isLoading: isLoadingItems || isLoadingStats,
    refetchUserQueueItems,
    refetchQueueStats,
    refetch: () => {
      refetchUserQueueItems();
      refetchQueueStats();
    },
  };
};
