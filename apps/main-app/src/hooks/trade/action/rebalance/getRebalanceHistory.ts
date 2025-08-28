import { useEffect, useRef, useState } from 'react';
import { trpc } from '../../../../lib/api/trpc';
import { RebalanceHistoryItem } from '../../../../types/baskt/rebalance';

export function useGetRebalanceHistory(basktId: string) {
  const [rebalanceHistory, setRebalanceHistory] = useState<RebalanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const autoRefetchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    data: rebalanceHistoryData,
    isLoading: isHistoryLoading,
    error: historyError,
    refetch: refetchHistory,
  } = trpc.baskt.getBasktRebalanceHistory.useQuery(
    { basktId, limit: 50 },
    {
      enabled: !!basktId,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 30 * 1000,
      retry: 3,
      retryDelay: 2000,
    },
  );

  const {
    data: latestRebalanceData,
    isLoading: isLatestLoading,
    error: latestError,
    refetch: refetchLatest,
  } = trpc.baskt.getLatestBasktRebalance.useQuery(
    { basktId },
    {
      enabled: !!basktId,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 30 * 1000,
      retry: 3,
      retryDelay: 2000,
    },
  );

  useEffect(() => {
    if (rebalanceHistoryData?.success && rebalanceHistoryData.data) {
      setRebalanceHistory(rebalanceHistoryData.data);
      setError(null);
    } else if (rebalanceHistoryData && !rebalanceHistoryData.success) {
      setError(new Error(rebalanceHistoryData.message || 'Failed to fetch rebalance history'));
    }
  }, [rebalanceHistoryData]);

  useEffect(() => {
    if (latestError) {
      console.error('Latest rebalance fetch error:', latestError);
    }
  }, [latestError]);

  useEffect(() => {
    setLoading(isHistoryLoading || isLatestLoading);
  }, [isHistoryLoading, isLatestLoading]);

  useEffect(() => {
    if (latestRebalanceData?.success && latestRebalanceData.data) {
      if (autoRefetchTimerRef.current) {
        clearTimeout(autoRefetchTimerRef.current);
      }

      autoRefetchTimerRef.current = setTimeout(() => {
        refetchHistory();
        refetchLatest();
      }, 20000);
    }

    return () => {
      if (autoRefetchTimerRef.current) {
        clearTimeout(autoRefetchTimerRef.current);
      }
    };
  }, [latestRebalanceData, refetchHistory, refetchLatest]);

  return {
    rebalanceHistory,
    latestRebalance: latestRebalanceData?.success ? latestRebalanceData.data : null,
    loading,
    error,
    refetch: () => {
      refetchHistory();
      refetchLatest();
    },
  };
}
