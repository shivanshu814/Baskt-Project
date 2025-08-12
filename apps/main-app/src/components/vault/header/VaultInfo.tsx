import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@baskt/ui';
import { AlertTriangle, Info } from 'lucide-react';
import React from 'react';
import { useVaultAPY } from '../../../hooks/vault/use-vault-calculations';
import { VaultData } from '../../../types/vault';

export const VaultInfo = React.memo(({ vaultData }: { vaultData: VaultData | null }) => {
  const { apy, isHighYield, originalApr } = useVaultAPY(vaultData);

  return (
    <div className="pt-4 pb-2 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
      <div className="flex-1">
        <h1 className="text-[30px] font-semibold text-foreground">Vault</h1>
        <div className="text-xs text-muted-foreground mb-4">
          <span className="font-bold text-primary">The Baskt Vault</span> provides secure yield
          farming and liquidity provision with automated strategies and risk management.
        </div>
        {isHighYield && (
          <div className="flex items-center gap-2 text-amber-500 text-xs mb-2">
            <AlertTriangle className="h-3 w-3" />
            <span>High yield detected - Original APR: {originalApr.toFixed(2)}%</span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end min-w-[180px] justify-start">
        <div className="flex items-center gap-2 text-primary text-xs font-bold mb-1">
          APY
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block align-middle cursor-pointer">
                  <Info className="h-4 w-4 text-primary" />
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-sm text-xs text-foreground bg-background border-2 border-primary/20 shadow-xl backdrop-blur-sm"
              >
                <div className="space-y-3 p-2">
                  {isHighYield && (
                    <div className="flex justify-between items-center text-amber-500">
                      <span className="font-semibold">Original APR:</span>
                      <span className="font-bold text-sm">{originalApr.toFixed(2)}%</span>
                    </div>
                  )}

                  <div className="text-xs">
                    APY is calculated based on vault performance and fees generated from trading
                    activities. Returns are automatically compounded daily and distributed to vault
                    participants.
                  </div>

                  {isHighYield && (
                    <div className="border-t border-amber-500/20 pt-3 mt-3">
                      <div className="text-amber-500 text-xs font-semibold">
                        ⚠️ APR capped for realistic expectations due to low liquidity
                      </div>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-2xl font-extrabold text-primary">{apy}</span>
        <span className="text-xs text-muted-foreground mt-1">
          Last updated at {new Date().toLocaleDateString()}
        </span>
      </div>
    </div>
  );
});

VaultInfo.displayName = 'VaultInfo';
