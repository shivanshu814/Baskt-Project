import { Card, CardContent, CardHeader, CardTitle } from '@baskt/ui';
import { Clock, ExternalLink, Hash, Loader2, TrendingDown, TrendingUp, User } from 'lucide-react';
import React from 'react';
import { PoolFeeEvent } from '../../hooks/pool/usePoolFeeEvents';
// Removed date-fns import, using custom formatting instead

interface PoolFeeEventsProps {
  feeEvents: PoolFeeEvent[];
  isLoading: boolean;
  error: string | null;
}

export const PoolFeeEventsComponent: React.FC<PoolFeeEventsProps> = ({
  feeEvents,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Recent Fee Events</CardTitle>
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
          <CardTitle className="text-xl font-bold text-white">Recent Fee Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-400 text-center py-8">Error loading fee events: {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (feeEvents.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Recent Fee Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-white/60 text-center py-8">No fee events found</div>
        </CardContent>
      </Card>
    );
  }

  const formatEventType = (eventType: string) => {
    if (!eventType) return 'Unknown Event';

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

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'POSITION_OPENED':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'POSITION_CLOSED':
        return <TrendingDown className="h-4 w-4 text-blue-400" />;
      case 'POSITION_LIQUIDATED':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      case 'LIQUIDITY_ADDED':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'LIQUIDITY_REMOVED':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
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

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: any) => {
    if (!amount) return 'N/A';

    // Handle bytes structure from the data
    if (amount.bytes) {
      // Convert bytes to number (assuming little-endian)
      let value = 0;
      for (let i = 0; i < 8; i++) {
        value += (amount.bytes[i] || 0) * Math.pow(256, i);
      }
      return (value / 1e6).toFixed(2);
    }

    // Handle string amounts
    if (typeof amount === 'string') {
      return (parseInt(amount) / 1e6).toFixed(2);
    }

    return 'N/A';
  };

  const openInSolscan = (txSignature: string) => {
    window.open(`https://solscan.io/tx/${txSignature}`, '_blank');
  };

  const formatDistanceToNow = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return 'just now';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Helper function to get the appropriate fee amount based on event type
  const getFeeAmount = (event: any, feeType: 'total' | 'treasury' | 'blp') => {
    const data = event._doc || event;

    if (data.positionFee) {
      switch (feeType) {
        case 'total':
          return data.positionFee.totalFee;
        case 'treasury':
          return data.positionFee.feeToTreasury;
        case 'blp':
          return data.positionFee.feeToBlp;
      }
    } else if (data.liquidityFee) {
      switch (feeType) {
        case 'total':
          return data.liquidityFee.totalFee;
        case 'treasury':
          return data.liquidityFee.feeToTreasury;
        case 'blp':
          return data.liquidityFee.feeToBlp;
      }
    } else if (data.basktFee) {
      switch (feeType) {
        case 'total':
          return data.basktFee.creationFee;
        case 'treasury':
          return data.basktFee.creationFee;
        case 'blp':
          return data.basktFee.rebalanceRequestFee;
      }
    }
    return null;
  };

  // Helper function to get data from the correct location
  const getEventData = (event: any) => {
    return event._doc || event;
  };

  return (
    <Card className="bg-white/5 border-white/10 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Fee Events
        </CardTitle>
        <div className="text-sm text-white/60">Showing {feeEvents.length} recent events</div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {feeEvents.map((event) => {
            const data = getEventData(event);
            return (
              <div
                key={data._id || data.eventId || Math.random().toString()}
                className="bg-white/5 p-4 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getEventIcon(data.eventType)}
                    <div>
                      <div className={`font-semibold ${getEventColor(data.eventType)}`}>
                        {formatEventType(data.eventType)}
                      </div>
                      <div className="text-xs text-white/60">
                        {formatDistanceToNow(
                          data.createdAt ||
                            (data.timestamp instanceof Date
                              ? data.timestamp.toISOString()
                              : data.timestamp) ||
                            '',
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openInSolscan(data.transactionSignature)}
                    className="text-white/60 hover:text-primary transition-colors"
                    title="View on Solscan"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-white/60 mb-1">Owner</div>
                    <div className="text-white font-mono flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {formatAddress(data.payer || data.owner || '')}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 mb-1">Total Fee</div>
                    <div className="text-primary font-semibold">
                      {formatAmount(getFeeAmount(event, 'total'))} {data.feePaidIn}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 mb-1">Treasury Fee</div>
                    <div className="text-white">
                      {formatAmount(getFeeAmount(event, 'treasury'))} {data.feePaidIn}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 mb-1">BLP Fee</div>
                    <div className="text-white">
                      {formatAmount(getFeeAmount(event, 'blp'))} {data.feePaidIn}
                    </div>
                  </div>
                </div>

                {data.liquidityAmount && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-white/60">Liquidity Amount: </span>
                        <span className="text-white">
                          {formatAmount(data.liquidityAmount)} {data.feePaidIn}
                        </span>
                      </div>
                      {data.sharesAmount && (
                        <div>
                          <span className="text-white/60">Shares: </span>
                          <span className="text-white">{formatAmount(data.sharesAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-xs text-white/60">
                    <span>Event ID: </span>
                    <span className="font-mono">{data._id || data.eventId || 'N/A'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
