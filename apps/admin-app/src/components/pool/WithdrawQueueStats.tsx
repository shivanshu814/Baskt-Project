import React from 'react';
import { Clock, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { StatCard } from './StatCard';
import type { WithdrawQueueStats as WithdrawQueueStatsType } from '../../types/withdrawQueue';

interface WithdrawQueueStatsProps {
  stats: WithdrawQueueStatsType | null;
  isLoading: boolean;
}

export const WithdrawQueueStats: React.FC<WithdrawQueueStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-24 bg-white/5 rounded-xl border border-white/10"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-full text-center py-8">
          <AlertCircle className="h-8 w-8 text-white/40 mx-auto mb-2" />
          <p className="text-white/60">No withdrawal queue data available</p>
        </div>
      </div>
    );
  }

  const queueStats = [
    {
      label: 'Total Queue Items',
      value: stats.totalQueueItems.toString(),
      subtext: 'Items waiting to be processed',
      tooltip: 'Total number of withdrawal requests in the queue',
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: 'Processing Rate',
      value: `${stats.queueProcessingRate.toFixed(2)}/hr`,
      subtext: 'Items processed per hour',
      tooltip: 'Average number of queue items processed per hour',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      label: 'Avg Processing Time',
      value: `${stats.averageProcessingTime.toFixed(1)}h`,
      subtext: 'Average time to process',
      tooltip: 'Average time it takes to process a queue item',
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: 'Next Processing',
      value: stats.isProcessingNow ? 'Now' : stats.nextProcessingTime ? 'Soon' : 'N/A',
      subtext: stats.nextProcessingTime
        ? new Date(stats.nextProcessingTime).toLocaleTimeString()
        : '',
      tooltip: stats.isProcessingNow
        ? 'Queue is currently being processed'
        : 'Next scheduled processing time',
      icon: <Clock className="h-4 w-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {queueStats.map((stat, index) => (
        <StatCard
          key={index}
          label={stat.label}
          value={stat.value}
          subtext={stat.subtext}
          tooltip={stat.tooltip}
          icon={stat.icon}
        />
      ))}
    </div>
  );
};
