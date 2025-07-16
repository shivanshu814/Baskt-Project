import { useMemo } from 'react';
import { trpc } from '../../utils/trpc';

export interface PoolFeeEvent {
  eventId: string;
  eventType: 'POSITION_OPENED' | 'POSITION_CLOSED' | 'POSITION_LIQUIDATED' | 'LIQUIDITY_ADDED' | 'LIQUIDITY_REMOVED';
  transactionSignature: string;
  timestamp: Date;
  owner: string;
  feeToTreasury: string;
  feeToBlp: string;
  totalFee: string;
  liquidityProvider?: string;
  liquidityPool?: string;
  liquidityAmount?: string;
  sharesAmount?: string;
}

export interface PoolFeeStats {
  totalEvents: number;
  totalFees: number;
  totalFeesToTreasury: number;
  totalFeesToBlp: number;
  eventTypeBreakdown: {
    _id: string;
    count: number;
    totalFeesToTreasury: number;
    totalFeesToBlp: number;
    totalFees: number;
    avgLiquidityAmount: number;
  }[];
}

export interface EventTypeBreakdownItem {
  eventType: string;
  count: number;
  totalFees: number;
  totalFeesToTreasury: number;
  totalFeesToBlp: number;
  formattedTotalFees: string;
  formattedTreasuryFees: string;
  formattedBlpFees: string;
  percentageOfTotalFees: number;
  displayName: string;
}

export interface UsePoolFeeEventsOptions {
  limit?: number;
  offset?: number;
}

export interface UsePoolFeeEventsReturn {
  // Fee events data
  feeEvents: PoolFeeEvent[];
  feeStats: PoolFeeStats | null;
  
  // Loading states
  isLoadingEvents: boolean;
  isLoadingStats: boolean;
  
  // Error states
  eventsError: string | null;
  statsError: string | null;
  
  // Refetch functions
  refetchEvents: () => void;
  refetchStats: () => void;
  
  // Formatted data for display
  totalFeesFormatted: string;
  avgFeePerEvent: string;
  
  // Event type breakdown
  eventTypeBreakdown: EventTypeBreakdownItem[];
  
  // Deprecated - keeping for backward compatibility
  liquidityAddedCount: number;
  liquidityRemovedCount: number;
}

const formatEventTypeName = (eventType: string): string => {
  switch (eventType) {
    case 'POSITION_OPENED':
      return 'Position Opened';
    case 'POSITION_CLOSED':
      return 'Position Closed';
    case 'POSITION_LIQUIDATED':
      return 'Position Liquidated';
    case 'LIQUIDITY_ADDED':
      return 'Liquidity Added';
    case 'LIQUIDITY_REMOVED':
      return 'Liquidity Removed';
    default:
      return eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
};

const formatFeeAmount = (amount: number): string => {
  return (amount / 1e6).toFixed(2);
};

export function usePoolFeeEvents(options: UsePoolFeeEventsOptions = {}): UsePoolFeeEventsReturn {
  const { limit = 100, offset = 0 } = options;

  // Fetch fee events
  const {
    data: feeEventsData,
    isLoading: isLoadingEvents,
    error: eventsError,
    refetch: refetchEvents,
  } = trpc.feeEvent.getFeeEvents.useQuery({
    limit,
    offset,
  });

  // Fetch fee statistics
  const {
    data: feeStatsData,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = trpc.feeEvent.getFeeEventStats.useQuery();

  // Process fee events data
  const feeEvents = useMemo(() => {
    if (!feeEventsData?.success || !feeEventsData.data) return [];
    return feeEventsData.data as PoolFeeEvent[];
  }, [feeEventsData]);

  // Process fee stats data
  const feeStats = useMemo(() => {
    if (!feeStatsData?.success || !feeStatsData.data) return null;
    return feeStatsData.data as PoolFeeStats;
  }, [feeStatsData]);

  // Computed values
  const totalFeesFormatted = useMemo(() => {
    if (!feeStats) return '0';
    return formatFeeAmount(feeStats.totalFees);
  }, [feeStats]);

  const avgFeePerEvent = useMemo(() => {
    if (!feeStats || feeStats.totalEvents === 0) return '0';
    return formatFeeAmount(feeStats.totalFees / feeStats.totalEvents);
  }, [feeStats]);

  // Event type breakdown with formatted data
  const eventTypeBreakdown = useMemo(() => {
    if (!feeStats || !feeStats.eventTypeBreakdown) return [];
    
    return feeStats.eventTypeBreakdown.map(item => ({
      eventType: item._id,
      count: item.count,
      totalFees: item.totalFees,
      totalFeesToTreasury: item.totalFeesToTreasury,
      totalFeesToBlp: item.totalFeesToBlp,
      formattedTotalFees: formatFeeAmount(item.totalFees),
      formattedTreasuryFees: formatFeeAmount(item.totalFeesToTreasury),
      formattedBlpFees: formatFeeAmount(item.totalFeesToBlp),
      percentageOfTotalFees: feeStats.totalFees > 0 ? (item.totalFees / feeStats.totalFees) * 100 : 0,
      displayName: formatEventTypeName(item._id),
    }));
  }, [feeStats]);

  // Backward compatibility
  const liquidityAddedCount = useMemo(() => {
    if (!feeStats) return 0;
    const addedEvents = feeStats.eventTypeBreakdown.find(e => e._id === 'LIQUIDITY_ADDED');
    return addedEvents?.count || 0;
  }, [feeStats]);

  const liquidityRemovedCount = useMemo(() => {
    if (!feeStats) return 0;
    const removedEvents = feeStats.eventTypeBreakdown.find(e => e._id === 'LIQUIDITY_REMOVED');
    return removedEvents?.count || 0;
  }, [feeStats]);

  return {
    // Fee events data
    feeEvents,
    feeStats,
    
    // Loading states
    isLoadingEvents,
    isLoadingStats,
    
    // Error states
    eventsError: eventsError?.message || null,
    statsError: statsError?.message || null,
    
    // Refetch functions
    refetchEvents,
    refetchStats,
    
    // Formatted data for display
    totalFeesFormatted,
    avgFeePerEvent,
    
    // Event type breakdown
    eventTypeBreakdown,
    
    // Deprecated - keeping for backward compatibility
    liquidityAddedCount,
    liquidityRemovedCount,
  };
}

/**
 * Alternative hook that uses the combined endpoint for better performance
 */
export function useAllFeeEventData(options: UsePoolFeeEventsOptions = {}): UsePoolFeeEventsReturn {
  const { limit = 100, offset = 0 } = options;

  // Fetch combined fee events and stats data
  const {
    data: combinedData,
    isLoading,
    error,
    refetch,
  } = trpc.feeEvent.getAllFeeEventData.useQuery({
    limit,
    offset,
  });

  // Process combined data
  const feeEvents = useMemo(() => {
    if (!combinedData?.success || !combinedData.data?.events) return [];
    return combinedData.data.events as PoolFeeEvent[];
  }, [combinedData]);

  const feeStats = useMemo(() => {
    if (!combinedData?.success || !combinedData.data?.stats) return null;
    return combinedData.data.stats as PoolFeeStats;
  }, [combinedData]);

  // Computed values
  const totalFeesFormatted = useMemo(() => {
    if (!feeStats) return '0';
    return formatFeeAmount(feeStats.totalFees);
  }, [feeStats]);

  const avgFeePerEvent = useMemo(() => {
    if (!feeStats || feeStats.totalEvents === 0) return '0';
    return formatFeeAmount(feeStats.totalFees / feeStats.totalEvents);
  }, [feeStats]);

  // Event type breakdown with formatted data
  const eventTypeBreakdown = useMemo(() => {
    if (!feeStats || !feeStats.eventTypeBreakdown) return [];
    
    return feeStats.eventTypeBreakdown.map(item => ({
      eventType: item._id,
      count: item.count,
      totalFees: item.totalFees,
      totalFeesToTreasury: item.totalFeesToTreasury,
      totalFeesToBlp: item.totalFeesToBlp,
      formattedTotalFees: formatFeeAmount(item.totalFees),
      formattedTreasuryFees: formatFeeAmount(item.totalFeesToTreasury),
      formattedBlpFees: formatFeeAmount(item.totalFeesToBlp),
      percentageOfTotalFees: feeStats.totalFees > 0 ? (item.totalFees / feeStats.totalFees) * 100 : 0,
      displayName: formatEventTypeName(item._id),
    }));
  }, [feeStats]);

  // Backward compatibility
  const liquidityAddedCount = useMemo(() => {
    if (!feeStats) return 0;
    const addedEvents = feeStats.eventTypeBreakdown.find(e => e._id === 'LIQUIDITY_ADDED');
    return addedEvents?.count || 0;
  }, [feeStats]);

  const liquidityRemovedCount = useMemo(() => {
    if (!feeStats) return 0;
    const removedEvents = feeStats.eventTypeBreakdown.find(e => e._id === 'LIQUIDITY_REMOVED');
    return removedEvents?.count || 0;
  }, [feeStats]);

  return {
    // Fee events data
    feeEvents,
    feeStats,
    
    // Loading states
    isLoadingEvents: isLoading,
    isLoadingStats: isLoading,
    
    // Error states
    eventsError: error?.message || null,
    statsError: error?.message || null,
    
    // Refetch functions
    refetchEvents: refetch,
    refetchStats: refetch,
    
    // Formatted data for display
    totalFeesFormatted,
    avgFeePerEvent,
    
    // Event type breakdown
    eventTypeBreakdown,
    
    // Deprecated - keeping for backward compatibility
    liquidityAddedCount,
    liquidityRemovedCount,
  };
} 