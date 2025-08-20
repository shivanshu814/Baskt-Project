import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@baskt/ui';
import { Info } from 'lucide-react';
import React from 'react';
import { VaultInfoProps } from '../../../types/vault';

export const VaultInfo = React.memo(({ apr }: VaultInfoProps) => {
  return (
    <div className="pt-4 pb-2 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
      <div className="flex-1">
        <h1 className="text-[30px] font-semibold text-foreground">Vault</h1>
        <div className="text-xs text-muted-foreground mb-4">
          <span className="font-bold text-primary">The Baskt Vault</span> provides secure yield
          farming and liquidity provision with automated strategies and risk management.
        </div>
      </div>
      <div className="flex flex-col items-end min-w-[180px] justify-start">
        <div className="flex items-center gap-2 text-primary text-xs font-bold mb-1">
          APR
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
                  <div className="flex justify-between items-center text-primary">
                    <span className="font-semibold">Current APR:</span>
                    <span className="font-bold text-sm">{apr.toFixed(2)}%</span>
                  </div>

                  <div className="text-xs">
                    APR is calculated based on vault performance and fees generated from trading
                    activities. Returns are automatically compounded daily and distributed to vault
                    participants.
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-2xl font-extrabold text-primary">{apr.toFixed(2)}%</span>
        <span className="text-xs text-muted-foreground mt-1">
          Last updated at {new Date().toLocaleDateString()}
        </span>
      </div>
    </div>
  );
});

VaultInfo.displayName = 'VaultInfo';
