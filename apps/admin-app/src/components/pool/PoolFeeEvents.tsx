import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@baskt/ui';
import { PoolFeeEvent } from '../../hooks/pool/usePoolFeeEvents';
import { Loader2, ExternalLink, TrendingUp, TrendingDown, Clock, User, Hash } from 'lucide-react';
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
          <div className="text-red-400 text-center py-8">
            Error loading fee events: {error}
          </div>
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
          <div className="text-white/60 text-center py-8">
            No fee events found
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatEventType = (eventType: string) => {
    switch (eventType) {
      case 'LIQUIDITY_ADDED':
        return 'Liquidity Added';
      case 'LIQUIDITY_REMOVED':
        return 'Liquidity Removed';
      default:
        return eventType;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
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

  const formatAmount = (amount: string) => {
    if (!amount) return 'N/A';
    return (parseInt(amount) / 1e6).toFixed(2);
  };

  const openInSolscan = (txSignature: string) => {
    window.open(`https://solscan.io/tx/${txSignature}`, '_blank');
  };

  const formatDistanceToNow = (date: Date) => {
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
  };

  return (
    <Card className="bg-white/5 border-white/10 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Fee Events
        </CardTitle>
        <div className="text-sm text-white/60">
          Showing {feeEvents.length} recent events
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {feeEvents.map((event) => (
            <div
              key={event.eventId}
              className="bg-white/5 p-4 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getEventIcon(event.eventType)}
                  <div>
                    <div className={`font-semibold ${getEventColor(event.eventType)}`}>
                      {formatEventType(event.eventType)}
                    </div>
                    <div className="text-xs text-white/60">
                      {formatDistanceToNow(new Date(event.timestamp))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openInSolscan(event.transactionSignature)}
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
                    {formatAddress(event.owner)}
                  </div>
                </div>
                <div>
                  <div className="text-white/60 mb-1">Total Fee</div>
                  <div className="text-primary font-semibold">
                    {formatAmount(event.totalFee)} USDC
                  </div>
                </div>
                <div>
                  <div className="text-white/60 mb-1">Treasury Fee</div>
                  <div className="text-white">
                    {formatAmount(event.feeToTreasury)} USDC
                  </div>
                </div>
                <div>
                  <div className="text-white/60 mb-1">BLP Fee</div>
                  <div className="text-white">
                    {formatAmount(event.feeToBlp)} USDC
                  </div>
                </div>
              </div>

              {event.liquidityAmount && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-white/60">Liquidity Amount: </span>
                      <span className="text-white">{formatAmount(event.liquidityAmount)} USDC</span>
                    </div>
                    {event.sharesAmount && (
                      <div>
                        <span className="text-white/60">Shares: </span>
                        <span className="text-white">{formatAmount(event.sharesAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-xs text-white/60">
                  <span>Event ID: </span>
                  <span className="font-mono">{event.eventId}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 