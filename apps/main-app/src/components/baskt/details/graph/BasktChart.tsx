import React from 'react';
import { TradingViewChart } from './TradingViewChart';
import { BasktChartProps } from '../../../../types/baskt';
import { useBasktList } from '../../../../hooks/baskt/useBasktList';
import { useBasktOI } from '../../../../hooks/baskt/details/useBasktOI';
import { useBasktVolume } from '../../../../hooks/baskt/details/useBasktVolume';
import { DesktopMetrics } from '../basktInfo/DesktopMetrics';
import { MobileBasktHeader } from '../basktInfo/MobileBasktHeader';

export const BasktChart = ({ baskt, chartPeriod, chartType }: BasktChartProps) => {
  const { filteredBaskts } = useBasktList();

  const currentBaskt =
    filteredBaskts.find((b) => b.basktId?.toString() === baskt.basktId?.toString()) || baskt;
  const { totalOpenInterest, isLoading: oiLoading } = useBasktOI(baskt.basktId?.toString());
  const { totalVolume, isLoading: volumeLoading } = useBasktVolume(baskt.basktId?.toString());

  return (
    <div className="border-b border-muted-foreground/20">
      <div className="pb-0">
        <DesktopMetrics
          baskt={baskt}
          currentBaskt={currentBaskt}
          oiLoading={oiLoading}
          totalOpenInterest={totalOpenInterest}
          volumeLoading={volumeLoading}
          totalVolume={totalVolume}
        />
        <div className="flex sm:hidden flex-col w-full px-2 pt-2">
          <MobileBasktHeader
            baskt={baskt}
            price={currentBaskt?.price}
            change={currentBaskt?.performance?.day}
            oiLoading={oiLoading}
            totalOpenInterest={totalOpenInterest}
            volumeLoading={volumeLoading}
            totalVolume={totalVolume}
          />
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
