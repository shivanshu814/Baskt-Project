import { Button, PublicKeyText } from '@baskt/ui';
import { Activity, Clock, RefreshCw, Settings } from 'lucide-react';
import { RebalanceTabProps } from '../../../../types/baskt/trading/orders';

export function RebalanceTab({
  baskt,
  userAddress,
  isRebalancing,
  onRebalance,
}: RebalanceTabProps) {
  const isCreator = userAddress && userAddress === baskt?.account?.creator.toString();
  return (
    <div className="space-y-6 -mt-4 -ml-2">
      <div className="bg-muted/20 rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Rebalance Baskt</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Restore target weights and keep the baskt aligned with its strategy.
            </p>
            {isCreator && (
              <span className="inline-flex items-center gap-1 mt-2 text-xs px-2 py-0.5 rounded-full border border-green-500/20 bg-green-500/10 text-green-500">
                <Activity className="w-3 h-3" /> Creator
              </span>
            )}
          </div>
          {isCreator && (
            <Button
              onClick={onRebalance}
              disabled={!baskt?.account?.status || isRebalancing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRebalancing ? 'animate-spin' : ''}`} />
              {isRebalancing ? 'Rebalancing...' : 'Rebalance'}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="relative border border-border rounded-md p-3 bg-background/40">
            <Settings className="absolute right-3 top-3 w-3.5 h-3.5 text-muted-foreground/60" />
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Mode</div>
            <div className="mt-1 text-sm text-foreground">Manual</div>
          </div>
          <div className="relative border border-border rounded-md p-3 bg-background/40">
            <Activity className="absolute right-3 top-3 w-3.5 h-3.5 text-muted-foreground/60" />
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</div>
            <div
              className={`mt-1 text-sm ${
                baskt?.account?.status === 'active' ? 'text-green-500' : 'text-yellow-500'
              }`}
            >
              {baskt?.account?.status === 'active' ? 'Active' : 'Inactive'}
            </div>
          </div>
          <div className="relative border border-border rounded-md p-3 bg-background/40">
            <Clock className="absolute right-3 top-3 w-3.5 h-3.5 text-muted-foreground/60" />
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Last Rebalance
            </div>
            <div className="mt-1 text-sm text-foreground">
              {baskt?.account?.lastRebalanceTime
                ? new Date(Number(baskt.account.lastRebalanceTime) * 1000).toLocaleString()
                : 'Never'}
            </div>
          </div>
          <div className="relative border border-border rounded-md p-3 bg-background/40">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Creator</div>
            <div className="mt-1 text-xs text-foreground">
              {baskt?.account?.creator ? (
                <PublicKeyText publicKey={baskt.account.creator.toString()} isCopy={true} />
              ) : (
                '-'
              )}
            </div>
          </div>
        </div>

        {(!baskt?.account?.status || isRebalancing) && (
          <div className="mt-3 text-xs text-muted-foreground">
            {!baskt?.account?.status
              ? 'This baskt is inactive. Rebalance is disabled.'
              : 'Rebalancing in progress. This may take a few moments.'}
          </div>
        )}
      </div>
    </div>
  );
}
