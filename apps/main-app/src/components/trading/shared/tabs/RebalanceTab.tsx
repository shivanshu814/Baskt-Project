import { Button } from '@baskt/ui';
import { RefreshCw } from 'lucide-react';
import { RebalanceTabProps } from '../../../../types/trading/orders';

export function RebalanceTab({
  baskt,
  userAddress,
  isRebalancing,
  onRebalance,
}: RebalanceTabProps) {
  const isCreator = userAddress && userAddress === baskt?.creator;
  return (
    <div className="space-y-6">
      <div className="bg-muted/20 rounded-lg p-4 border border-border">
        {isCreator && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-2">
            <p className="text-sm text-green-500 font-medium">You are the baskt creator</p>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Rebalance Baskt</h3>
          </div>
          <Button
            onClick={onRebalance}
            disabled={!baskt?.isActive || isRebalancing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRebalancing ? 'animate-spin' : ''}`} />
            {isRebalancing ? 'Rebalancing...' : 'Rebalance'}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Rebalance Mode:</strong> Manual
            </p>
            <p>
              <strong>Last Rebalance:</strong>{' '}
              {baskt?.account?.lastRebalanceTime
                ? new Date(Number(baskt.account.lastRebalanceTime) * 1000).toLocaleString()
                : 'Never'}
            </p>
          </div>

          {!isCreator && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-sm text-yellow-500 font-medium">Creator Only</p>
              <p className="text-xs text-yellow-400 mt-1">
                Only the baskt creator can trigger rebalances
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
