import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { trpc } from '../../utils/trpc';
import type { WithdrawQueueItem, WithdrawQueueStats } from '../../types/withdrawQueue';

interface UseWithdrawQueueProps {
  poolId?: string;
  userAddress?: string;
}

interface UseWithdrawQueueReturn {
  // Queue data
  queueStats: WithdrawQueueStats | null;
  queueItems: WithdrawQueueItem[];
  userQueueItems: WithdrawQueueItem[];

  // Loading states
  isLoadingStats: boolean;
  isLoadingQueue: boolean;
  isLoadingUserQueue: boolean;
  isProcessing: boolean;

  // Actions
  refetchStats: () => void;
  refetchQueue: () => void;
  refetchUserQueue: () => void;

  // Pagination for queue items
  paginatedQueueItems: WithdrawQueueItem[];
  totalQueuePages: number;
  currentQueuePage: number;
  queuePageSize: number;
  handleQueuePageChange: (newPage: number) => void;
  handleQueuePageSizeChange: (size: number) => void;
}

export const useWithdrawQueue = ({
  poolId,
  userAddress,
}: UseWithdrawQueueProps = {}): UseWithdrawQueueReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQueuePage, setCurrentQueuePage] = useState(1);
  const [queuePageSize, setQueuePageSize] = useState(10);

  // Queue stats
  const {
    data: queueStats,
    refetch: refetchStats,
    isLoading: isLoadingStats,
  } = trpc.pool.getWithdrawQueueStats.useQuery({ poolId, userAddress }, { enabled: !!poolId });

  // All queue items
  const {
    data: allQueueItems,
    refetch: refetchQueue,
    isLoading: isLoadingQueue,
  } = trpc.pool.getWithdrawQueue.useQuery({ poolId }, { enabled: !!poolId });

  // User's queue items
  const {
    data: userQueueItems,
    refetch: refetchUserQueue,
    isLoading: isLoadingUserQueue,
  } = trpc.pool.getUserWithdrawQueueItems.useQuery(
    { userAddress: userAddress || '', poolId },
    { enabled: !!userAddress && !!poolId },
  );


  // Process data
  const processedQueueStats = useMemo(() => {
    if (!queueStats || !queueStats.success || !('data' in queueStats)) {
      return null;
    }
    return queueStats.data || null;
  }, [queueStats]);

  const processedQueueItems = useMemo(() => {
    if (!allQueueItems || !allQueueItems.success || !('data' in allQueueItems)) {
      return [];
    }
    return allQueueItems.data || [];
  }, [allQueueItems]);

  const processedUserQueueItems = useMemo(() => {
    if (!userQueueItems || !userQueueItems.success || !('data' in userQueueItems)) {
      return [];
    }
    return userQueueItems.data || [];
  }, [userQueueItems]);

  // Pagination for queue items
  const paginatedQueueItems = useMemo(() => {
    const startIndex = (currentQueuePage - 1) * queuePageSize;
    const endIndex = startIndex + queuePageSize;
    return processedQueueItems.slice(startIndex, endIndex);
  }, [processedQueueItems, currentQueuePage, queuePageSize]);

  const totalQueuePages = useMemo(
    () => Math.ceil(processedQueueItems.length / queuePageSize),
    [processedQueueItems.length, queuePageSize],
  );

  const handleQueuePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalQueuePages) {
        setCurrentQueuePage(newPage);
      }
    },
    [totalQueuePages],
  );

  const handleQueuePageSizeChange = useCallback((size: number) => {
    setQueuePageSize(size);
    setCurrentQueuePage(1);
  }, []);

  return {
    // Queue data
    queueStats: processedQueueStats,
    queueItems: processedQueueItems,
    userQueueItems: processedUserQueueItems,

    // Loading states
    isLoadingStats,
    isLoadingQueue,
    isLoadingUserQueue,
    isProcessing,

    // Actions
    refetchStats,
    refetchQueue,
    refetchUserQueue,

    // Pagination
    paginatedQueueItems,
    totalQueuePages,
    currentQueuePage,
    queuePageSize,
    handleQueuePageChange,
    handleQueuePageSizeChange,
  };
};
