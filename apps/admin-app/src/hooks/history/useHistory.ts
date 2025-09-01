import { useEffect, useState } from 'react';
import { HistoryItem } from '../../types/history';
import { trpc } from '../../utils/trpc';

export const useHistory = (filters?: {
  basktId?: string;
  userId?: string;
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
  } = trpc.history.getPositionHistory.useQuery(
    {
      basktId: filters?.basktId,
      userId: filters?.userId,
    },
    {
      refetchInterval: 10 * 1000, // 10 seconds
    },
  );

  useEffect(() => {
    setIsLoading(queryLoading);
    setError(queryError?.message || null);

    if (data && 'success' in data) {
      if (data.success && 'data' in data) {
        const positionHistoryData = data.data as any[];

        // Transform position history data to match HistoryItem interface
        const historyData: HistoryItem[] = positionHistoryData.map((position, index) => ({
          id: `${position.positionId}-${index}`,
          type: 'position',
          positionId: position.positionId,
          basktId: position.basktAddress,
          basktName: 'Unknown', // Will be populated if needed
          owner: filters?.userId || 'Unknown',
          action: 'Close' as any, // Position history is for closed positions
          status: position.status,
          size: position.size,
          collateral: '0', // Not available in position history
          isLong: position.isLong,
          entryPrice: position.entryPrice,
          exitPrice: position.averageExitPrice,
          pnl: position.totalPnl,
          pnlPercentage: '0', // Calculate if needed
          timestamp: position.lastExitTime || position.entryTime,
          openTx: position.entryTime,
          closeTx: position.lastExitTime,
        }));

        setHistory(historyData);
        setTotalCount(historyData.length);
      } else if (!data.success && 'error' in data) {
        setError(String(data.error));
      }
    }
  }, [data, queryLoading, queryError, filters?.userId]);

  return {
    history,
    totalCount,
    isLoading,
    error,
    refetch: () => {},
  };
};
