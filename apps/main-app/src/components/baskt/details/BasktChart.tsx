import React from 'react';
import { NumberFormat } from '@baskt/ui';
import { TradingViewChart } from './TradingViewChart';
import { BasktChartProps } from '../../../types/baskt';
import { useBasktList } from '../../../hooks/baskt/useBasktList';
import { useBasktOI } from '../../../hooks/baskt/useBasktOI';

export const BasktChart = ({ baskt, chartPeriod, chartType }: BasktChartProps) => {
  const { filteredBaskts } = useBasktList();

  const currentBaskt =
    filteredBaskts.find((b) => b.basktId?.toString() === baskt.basktId?.toString()) || baskt;
  const { totalOpenInterest, isLoading: oiLoading } = useBasktOI(baskt.basktId?.toString());

  return (
    <div className="border-b border-muted-foreground/20">
      <div className="pb-0">
        <div className="flex flex-row items-center justify-between border-b px-4 py-2 gap-3 min-h-0 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center px-0 py-0 min-w-0">
              <span className="font-semibold text-lg sm:text-xl text-primary">{baskt.name}</span>
              <span
                className={`font-semibold text-sm sm:text-base ml-2 sm:ml-3 ${
                  baskt?.performance?.day >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                <NumberFormat value={baskt?.performance?.day || 0} />%
              </span>
            </div>
          </div>
          {/* Metrics */}
          <div className="flex items-center gap-8 text-xs sm:text-sm ml-8">
            <div className="flex flex-col items-start">
              <span className="text-muted-foreground underline decoration-dashed">Mark</span>
              <span className="font-semibold text-white">
                <NumberFormat value={currentBaskt?.price} isPrice={true} />
              </span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-muted-foreground underline decoration-dashed">
                Open Interest
              </span>
              <span className="font-semibold text-white">
                {oiLoading
                  ? '...'
                  : totalOpenInterest === 0
                  ? '---'
                  : '$' + (totalOpenInterest / 1e6).toFixed(3)}
              </span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-muted-foreground underline decoration-dashed">24h Volume</span>
              <span className="font-semibold text-white">
                {/* Placeholder value, replace with real data if available */}
                $913,442,905.13
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-1 sm:p-2">
        <TradingViewChart
          className="h-[350px] sm:h-[450px] lg:h-[500px]"
          dailyData={baskt.priceHistory?.daily || []}
          weeklyData={baskt.priceHistory?.weekly || []}
          monthlyData={baskt.priceHistory?.monthly || []}
          yearlyData={baskt.priceHistory?.yearly || []}
          chartType={chartType}
          period={chartPeriod}
          basktId={baskt.basktId?.toString() || ''}
        />
      </div>
    </div>
  );
};
