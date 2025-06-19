import { useEffect, useState } from 'react';
import { trpc } from '../../utils/trpc';
import { OrderAction } from '@baskt/types';
import { HistoryItem } from '../../types/history';

export const useHistory = (filters?: {
  basktId?: string;
  userId?: string;
  status?: string;
  action?: OrderAction;
  limit?: number;
  offset?: number;
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data,
    isLoading: queryLoading,
    error: queryError,
  } = trpc.history.getHistory.useQuery(
    {
      basktId: filters?.basktId,
      userId: filters?.userId,
      status: filters?.status,
      action: filters?.action,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    },
    {
      refetchInterval: 10000,
    },
  );

  useEffect(() => {
    setIsLoading(queryLoading);
    setError(queryError?.message || null);

    if (data && 'success' in data) {
      if (data.success && 'data' in data) {
        const historyData = data.data as HistoryItem[];
        setHistory(historyData);
        if ('total' in data) {
          setTotalCount(data.total as number);
        } else {
          setTotalCount(historyData.length);
        }
      } else if (!data.success && 'message' in data) {
        setError(data.message);
      }
    }
  }, [data, queryLoading, queryError]);

  return {
    history,
    totalCount,
    isLoading,
    error,
    refetch: () => {},
  };
};
