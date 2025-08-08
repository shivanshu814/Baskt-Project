import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@baskt/ui';
import { PoolFeeStats, EventTypeBreakdownItem } from '../../hooks/pool/usePoolFeeEvents';
import { Loader2, DollarSign, Activity, TrendingUp, Hash, Target, X } from 'lucide-react';

interface PoolFeeStatsProps {
  feeStats: PoolFeeStats | null;
  isLoading: boolean;
  error: string | null;
  totalFeesFormatted: string;
  avgFeePerEvent: string;
  eventTypeBreakdown: EventTypeBreakdownItem[];
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'POSITION_OPENED':
      return <TrendingUp className="h-4 w-4 text-green-400" />;
    case 'POSITION_CLOSED':
      return <Target className="h-4 w-4 text-blue-400" />;
    case 'POSITION_LIQUIDATED':
      return <X className="h-4 w-4 text-red-400" />;
    case 'LIQUIDITY_ADDED':
      return <TrendingUp className="h-4 w-4 text-green-400" />;
    case 'LIQUIDITY_REMOVED':
      return <TrendingUp className="h-4 w-4 text-red-400 rotate-180" />;
    default:
      return <Hash className="h-4 w-4 text-white/60" />;
  }
};

const getEventColor = (eventType: string) => {
  switch (eventType) {
    case 'POSITION_OPENED':
      return 'text-green-400';
    case 'POSITION_CLOSED':
      return 'text-blue-400';
    case 'POSITION_LIQUIDATED':
      return 'text-red-400';
    case 'LIQUIDITY_ADDED':
      return 'text-green-400';
    case 'LIQUIDITY_REMOVED':
      return 'text-red-400';
    default:
      return 'text-white/60';
  }
};

const getEventDescription = (eventType: string) => {
  switch (eventType) {
    case 'POSITION_OPENED':
      return 'Fees from opening new positions';
    case 'POSITION_CLOSED':
      return 'Fees from closing existing positions';
    case 'POSITION_LIQUIDATED':
      return 'Fees from liquidated positions';
    case 'LIQUIDITY_ADDED':
      return 'Fees from adding liquidity to pool';
    case 'LIQUIDITY_REMOVED':
      return 'Fees from removing liquidity from pool';
    default:
      return 'Fees from this event type';
  }
};

export const PoolFeeStatsComponent: React.FC<PoolFeeStatsProps> = ({
  feeStats,
  isLoading,
  error,
  totalFeesFormatted,
  avgFeePerEvent,
  eventTypeBreakdown,
}) => {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Fee Statistics</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/5 border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Fee Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-400 text-center py-8">Error loading fee statistics: {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!feeStats) {
    return (
      <Card className="bg-white/5 border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Fee Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-white/60 text-center py-8">No fee data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Fee Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalFeesFormatted}</div>
              <div className="text-sm text-white/60">Total Fees (USDC)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{feeStats.totalEvents}</div>
              <div className="text-sm text-white/60">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{avgFeePerEvent}</div>
              <div className="text-sm text-white/60">Avg Fee/Event</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {feeStats.totalFees > 0
                  ? ((feeStats.totalFeesToTreasury / feeStats.totalFees) * 100).toFixed(1)
                  : '0.0'}
                %
              </div>
              <div className="text-sm text-white/60">To Treasury</div>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Event Type Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Event Type Breakdown
            </h3>

            {eventTypeBreakdown.length === 0 ? (
              <div className="text-white/60 text-center py-8">No event data available</div>
            ) : (
              <div className="space-y-4">
                {eventTypeBreakdown.map((item) => (
                  <div
                    key={item.eventType}
                    className="bg-white/5 p-4 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getEventIcon(item.eventType)}
                        <div>
                          <div className={`font-semibold text-lg ${getEventColor(item.eventType)}`}>
                            {item.displayName}
                          </div>
                          <div className="text-xs text-white/60">
                            {getEventDescription(item.eventType)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {item.formattedTotalFees} USDC
                        </div>
                        <div className="text-sm text-white/60">
                          {item.percentageOfTotalFees.toFixed(1)}% of total
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{item.count}</div>
                        <div className="text-white/60">Events</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-primary">
                          {item.formattedTreasuryFees} USDC
                        </div>
                        <div className="text-white/60">Treasury Fees</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-primary">
                          {item.formattedBlpFees} USDC
                        </div>
                        <div className="text-white/60">BLP Fees</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fee Distribution */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Overall Fee Distribution</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Treasury Fees</span>
                <span className="text-primary font-semibold">
                  {(feeStats.totalFeesToTreasury / 1e6).toFixed(2)} USDC
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">BLP Fees</span>
                <span className="text-primary font-semibold">
                  {(feeStats.totalFeesToBlp / 1e6).toFixed(2)} USDC
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                  style={{
                    width: `${
                      feeStats.totalFees > 0
                        ? (feeStats.totalFeesToTreasury / feeStats.totalFees) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/60">
                <span>Treasury</span>
                <span>BLP</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
