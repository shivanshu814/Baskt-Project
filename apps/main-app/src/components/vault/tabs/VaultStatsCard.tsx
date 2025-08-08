import { NumberFormat } from '@baskt/ui';
import { VaultStatsCardProps } from '../../../types/vault';

export function VaultStatsCard({ vaultMetrics }: VaultStatsCardProps) {
  return (
    <div className="bg-card border border-primary/10 rounded-lg p-3 mb-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Fees</span>
          <span className="text-sm font-semibold text-foreground">
            ${vaultMetrics.totalFeesEarned}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Token Price</span>
          <span className="text-sm font-semibold text-foreground">
            {isNaN(Number(vaultMetrics.blpPrice)) || !isFinite(Number(vaultMetrics.blpPrice))
              ? '---'
              : `$${vaultMetrics.blpPrice}`}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Total Supply</span>
          <span className="text-sm font-semibold text-foreground">
            <NumberFormat
              value={Number(vaultMetrics.actualTotalSupply)}
              isPrice={true}
              showCurrency={true}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
