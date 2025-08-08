import React from 'react';
import { Button } from '@baskt/ui';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import type { WithdrawQueueItem } from '../../types/withdrawQueue';

interface WithdrawQueueItemsProps {
  items: WithdrawQueueItem[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  isProcessing: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onProcessQueue: (maxItems?: number, force?: boolean) => Promise<boolean>;
}

const getStatusIcon = (status: WithdrawQueueItem['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-400" />;
    case 'processing':
      return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-400" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusColor = (status: WithdrawQueueItem['status']) => {
  switch (status) {
    case 'pending':
      return 'text-yellow-400';
    case 'processing':
      return 'text-blue-400';
    case 'completed':
      return 'text-green-400';
    case 'cancelled':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatAmount = (amount: string) => {
  const num = parseFloat(amount) / 1e6; // Assuming 6 decimals
  return `$${num.toFixed(2)}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

export const WithdrawQueueItems: React.FC<WithdrawQueueItemsProps> = ({
  items,
  currentPage,
  pageSize,
  totalPages,
  isLoading,
  isProcessing,
  onPageChange,
  onPageSizeChange,
  onProcessQueue,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">Withdrawal Queue</h3>
          <p className="text-white/60 text-sm mt-1">{items.length} items in queue</p>
        </div>
        <Button
          onClick={() => onProcessQueue()}
          disabled={isProcessing || items.length === 0}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isProcessing ? 'Processing...' : 'Process Queue'}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-white/40 mx-auto mb-2" />
          <p className="text-white/60">No items in withdrawal queue</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Position</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Provider</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Requested</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Processed</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-white font-mono">#{item.queuePosition}</td>
                    <td className="py-3 px-4 text-white">{formatAddress(item.providerAddress)}</td>
                    <td className="py-3 px-4 text-white">{formatAmount(item.lpAmount)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className={`capitalize ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white/80 text-sm">
                      {formatDate(item.requestedAt)}
                    </td>
                    <td className="py-3 px-4 text-white/80 text-sm">
                      {item.processedAt ? formatDate(item.processedAt) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-white/60 text-sm">items per page</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-white/60 text-sm px-2">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
