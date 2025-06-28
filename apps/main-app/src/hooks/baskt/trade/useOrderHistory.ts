import { useEffect, useState } from 'react';
import { trpc } from '../../../utils/trpc';
import { HistoryItem } from '@baskt/types';

export const useOrderHistory = (userAddress?: string, basktId?: string) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data,
    isLoading: queryLoading,
    error: queryError,
  } = trpc.history.getHistory.useQuery(
    {
      userId: userAddress,
      basktId: basktId,
      limit: 50,
      offset: 0,
    },
    {
      enabled: !!userAddress,
      refetchInterval: 30 * 1000, // 30 seconds
    },
  );

  useEffect(() => {
    setIsLoading(queryLoading);
    setError(queryError?.message || null);

    if (data && 'success' in data) {
      if (data.success && 'data' in data) {
        const historyData = data.data as HistoryItem[];
        setHistory(historyData);
      } else if (!data.success && 'message' in data) {
        setError(data.message);
      }
    }
  }, [data, queryLoading, queryError]);

  return {
    history,
    isLoading,
    error,
    refetch: () => {},
  };
};
