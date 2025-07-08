import React from 'react';
import { NumberFormat } from '@baskt/ui';
import { BasktSwitcher } from './BasktSwitcher';
import { BasktInfo } from '@baskt/types';

interface DesktopMetricsProps {
  baskt: BasktInfo;
  currentBaskt: BasktInfo;
  oiLoading: boolean;
  totalOpenInterest: number;
  volumeLoading: boolean;
  totalVolume: number;
}

export const DesktopMetrics = ({
  baskt,
  currentBaskt,
  oiLoading,
  totalOpenInterest,
  volumeLoading,
  totalVolume,
}: DesktopMetricsProps) => {
  return (
    <div className="hidden sm:flex flex-row items-center justify-between border-b px-4 py-2 gap-3 min-h-0 w-full pl-0">
      <div className="flex items-center min-w-0">
        <BasktSwitcher currentBaskt={baskt} />
      </div>
      {/* Metrics */}
      <div className="flex items-center gap-8 text-xs sm:text-sm ml-8">
        <div className="flex flex-col items-start">
          <span className="text-muted-foreground underline decoration-dashed">24h</span>
          <span
            className={`font-semibold ${
              currentBaskt?.performance?.day >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            <NumberFormat value={currentBaskt?.performance?.day} />%
          </span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-muted-foreground underline decoration-dashed">Mark</span>
          <span className="font-semibold text-white">
            <NumberFormat value={currentBaskt?.price} isPrice={true} />
          </span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-muted-foreground underline decoration-dashed">Open Interest</span>
          <span className="font-semibold text-white">
            {oiLoading ? (
              '...'
            ) : totalOpenInterest === 0 ? (
              '---'
            ) : (
              <NumberFormat value={totalOpenInterest} isPrice={true} />
            )}
          </span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-muted-foreground underline decoration-dashed">24h Volume</span>
          <span className="font-semibold text-white">
            {volumeLoading ? (
              '...'
            ) : totalVolume === 0 ? (
              '---'
            ) : (
              <NumberFormat value={totalVolume} isPrice={true} />
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
