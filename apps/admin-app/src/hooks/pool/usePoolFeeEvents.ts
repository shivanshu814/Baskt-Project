import { useMemo } from 'react';
import { trpc } from '../../utils/trpc';

export interface PoolFeeEvent {
  _id: string;
  eventType:
    | 'POSITION_OPENED'
    | 'POSITION_CLOSED'
    | 'POSITION_LIQUIDATED'
    | 'LIQUIDITY_ADDED'
    | 'LIQUIDITY_REMOVED'
    | 'REBALANCE_REQUESTED'
    | 'BASKT_CREATED';
  transactionSignature: string;
  createdAt: string;
  payer: string;
  feePaidIn: string;
  positionFee?: {
    basktId: string;
    positionId: string;
    feeToTreasury: { bytes: { [key: number]: number } };
    feeToBlp: { bytes: { [key: number]: number } };
    totalFee: { bytes: { [key: number]: number } };
    fundingFeePaid: { bytes: { [key: number]: number } };
    fundingFeeOwed: { bytes: { [key: number]: number } };
    rebalanceFeePaid: { bytes: { [key: number]: number } };
  };
  liquidityFee?: {
    feeToTreasury: { bytes: { [key: number]: number } };
    feeToBlp: { bytes: { [key: number]: number } };
    totalFee: { bytes: { [key: number]: number } };
  };
  basktFee?: {
    basktId?: string;
    creationFee: { bytes: { [key: number]: number } };
    rebalanceRequestFee: { bytes: { [key: number]: number } };
  };
  // Legacy properties for backward compatibility
  eventId?: string;
  timestamp?: Date;
  owner?: string;
  feeToTreasury?: string;
  feeToBlp?: string;
  totalFee?: string;
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
      return eventType
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
  }
};

const formatFeeAmount = (amount: number): string => {
  return (amount / 1e6).toFixed(2);
};

export function usePoolFeeEvents(options: UsePoolFeeEventsOptions = {}): UsePoolFeeEventsReturn {
  const { limit = 100, offset = 0 } = options;

  const {
    data: feeEventsData,
    isLoading: isLoadingEvents,
    error: eventsError,
    refetch: refetchEvents,
  } = trpc.feeEvent.getFeeEvents.useQuery({
    limit,
    offset,
  });

  const {
    data: feeStatsData,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = trpc.feeEvent.getFeeEventStats.useQuery();

  const feeEvents = useMemo(() => {
    if (!feeEventsData?.success || !feeEventsData.data) return [];
    return feeEventsData.data as PoolFeeEvent[];
  }, [feeEventsData]);

  const feeStats = useMemo(() => {
    if (!feeStatsData?.success || !feeStatsData.data) return null;

    const data = feeStatsData.data as any;

    if (data.eventTypeStats && !data.eventTypeBreakdown) {
      let totalFees = 0;
      let totalFeesToTreasury = 0;
      let totalFeesToBlp = 0;

      data.eventTypeStats.forEach((stat: any) => {
        totalFees += stat.totalFees || 0;
        totalFeesToTreasury += stat.totalFeesToTreasury || 0;
        totalFeesToBlp += stat.totalFeesToBlp || 0;
      });

      return {
        totalEvents: data.totalEvents || 0,
        totalFees,
        totalFeesToTreasury,
        totalFeesToBlp,
        eventTypeBreakdown: data.eventTypeStats.map((stat: any) => ({
          _id: stat._id,
          count: stat.count,
          totalFeesToTreasury: stat.totalFeesToTreasury,
          totalFeesToBlp: stat.totalFeesToBlp,
          totalFees: stat.totalFees,
          avgLiquidityAmount: 0,
        })),
      } as PoolFeeStats;
    }

    return data as PoolFeeStats;
  }, [feeStatsData]);

  const totalFeesFormatted = useMemo(() => {
    if (!feeStats) return '0';
    return formatFeeAmount(feeStats.totalFees);
  }, [feeStats]);

  const avgFeePerEvent = useMemo(() => {
    if (!feeStats || feeStats.totalEvents === 0) return '0';
    return formatFeeAmount(feeStats.totalFees / feeStats.totalEvents);
  }, [feeStats]);

  const eventTypeBreakdown = useMemo(() => {
    if (!feeStats || !feeStats.eventTypeBreakdown) return [];

    return feeStats.eventTypeBreakdown.map((item) => ({
      eventType: item._id,
      count: item.count,
      totalFees: item.totalFees,
      totalFeesToTreasury: item.totalFeesToTreasury,
      totalFeesToBlp: item.totalFeesToBlp,
      formattedTotalFees: formatFeeAmount(item.totalFees),
      formattedTreasuryFees: formatFeeAmount(item.totalFeesToTreasury),
      formattedBlpFees: formatFeeAmount(item.totalFeesToBlp),
      percentageOfTotalFees:
        feeStats.totalFees > 0 ? (item.totalFees / feeStats.totalFees) * 100 : 0,
      displayName: formatEventTypeName(item._id),
    }));
  }, [feeStats]);

  const liquidityAddedCount = useMemo(() => {
    if (!feeStats) return 0;
    const addedEvents = feeStats.eventTypeBreakdown.find((e) => e._id === 'LIQUIDITY_ADDED');
    return addedEvents?.count || 0;
  }, [feeStats]);

  const liquidityRemovedCount = useMemo(() => {
    if (!feeStats) return 0;
    const removedEvents = feeStats.eventTypeBreakdown.find((e) => e._id === 'LIQUIDITY_REMOVED');
    return removedEvents?.count || 0;
  }, [feeStats]);

  return {
    feeEvents,
    feeStats,

    isLoadingEvents,
    isLoadingStats,

    eventsError: eventsError?.message || null,
    statsError: statsError?.message || null,

    refetchEvents,
    refetchStats,

    totalFeesFormatted,
    avgFeePerEvent,

    eventTypeBreakdown,

    liquidityAddedCount,
    liquidityRemovedCount,
  };
}

/**
 * Alternative hook that uses the combined endpoint for better performance
 */
export function useAllFeeEventData(options: UsePoolFeeEventsOptions = {}): UsePoolFeeEventsReturn {
  const { limit = 100, offset = 0 } = options;

  const {
    data: combinedData,
    isLoading,
    error,
    refetch,
  } = trpc.feeEvent.getAllFeeEventData.useQuery({
    limit,
    offset,
  });

  const feeEvents = useMemo(() => {
    if (!combinedData?.success || !combinedData.data?.events) return [];
    return combinedData.data.events as PoolFeeEvent[];
  }, [combinedData]);

  const feeStats = useMemo(() => {
    if (!combinedData?.success || !combinedData.data?.stats) {
      if (combinedData?.data?.events) {
        const events = combinedData.data.events;
        const totalEvents = events.length;

        let totalFees = 0;
        let totalFeesToTreasury = 0;
        let totalFeesToBlp = 0;

        events.forEach((event: any) => {
          const data = event._doc || event;
          if (data.positionFee?.totalFee?.bytes) {
            let value = 0;
            for (let i = 0; i < 8; i++) {
              value += (data.positionFee.totalFee.bytes[i] || 0) * Math.pow(256, i);
            }
            totalFees += value;
          }
          if (data.positionFee?.feeToTreasury?.bytes) {
            let value = 0;
            for (let i = 0; i < 8; i++) {
              value += (data.positionFee.feeToTreasury.bytes[i] || 0) * Math.pow(256, i);
            }
            totalFeesToTreasury += value;
          }
          if (data.positionFee?.feeToBlp?.bytes) {
            let value = 0;
            for (let i = 0; i < 8; i++) {
              value += (data.positionFee.feeToBlp.bytes[i] || 0) * Math.pow(256, i);
            }
            totalFeesToBlp += value;
          }
        });

        return {
          totalEvents,
          totalFees,
          totalFeesToTreasury,
          totalFeesToBlp,
          eventTypeBreakdown: [],
        };
      }
      return null;
    }
    return combinedData.data.stats as PoolFeeStats;
  }, [combinedData]);

  const totalFeesFormatted = useMemo(() => {
    if (!feeStats) return '0';
    return formatFeeAmount(feeStats.totalFees);
  }, [feeStats]);

  const avgFeePerEvent = useMemo(() => {
    if (!feeStats || feeStats.totalEvents === 0) return '0';
    return formatFeeAmount(feeStats.totalFees / feeStats.totalEvents);
  }, [feeStats]);

  const eventTypeBreakdown = useMemo(() => {
    if (!feeStats || !feeStats.eventTypeBreakdown) return [];

    return feeStats.eventTypeBreakdown.map((item) => ({
      eventType: item._id,
      count: item.count,
      totalFees: item.totalFees,
      totalFeesToTreasury: item.totalFeesToTreasury,
      totalFeesToBlp: item.totalFeesToBlp,
      formattedTotalFees: formatFeeAmount(item.totalFees),
      formattedTreasuryFees: formatFeeAmount(item.totalFeesToTreasury),
      formattedBlpFees: formatFeeAmount(item.totalFeesToBlp),
      percentageOfTotalFees:
        feeStats.totalFees > 0 ? (item.totalFees / feeStats.totalFees) * 100 : 0,
      displayName: formatEventTypeName(item._id),
    }));
  }, [feeStats]);

  const liquidityAddedCount = useMemo(() => {
    if (!feeStats) return 0;
    const addedEvents = feeStats.eventTypeBreakdown.find((e) => e._id === 'LIQUIDITY_ADDED');
    return addedEvents?.count || 0;
  }, [feeStats]);

  const liquidityRemovedCount = useMemo(() => {
    if (!feeStats) return 0;
    const removedEvents = feeStats.eventTypeBreakdown.find((e) => e._id === 'LIQUIDITY_REMOVED');
    return removedEvents?.count || 0;
  }, [feeStats]);

  return {
    feeEvents,
    feeStats,

    isLoadingEvents: isLoading,
    isLoadingStats: isLoading,

    eventsError: error?.message || null,
    statsError: error?.message || null,

    refetchEvents: refetch,
    refetchStats: refetch,

    totalFeesFormatted,
    avgFeePerEvent,

    eventTypeBreakdown,

    liquidityAddedCount,
    liquidityRemovedCount,
  };
}
