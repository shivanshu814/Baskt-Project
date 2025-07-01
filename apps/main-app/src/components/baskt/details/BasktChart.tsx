import React, { useState } from 'react';
import { Button, Popover, PopoverTrigger, PopoverContent, NumberFormat } from '@baskt/ui';
import { ChevronDown } from 'lucide-react';
import { TradingViewChart } from './TradingViewChart';
import { BasktChartProps } from '../../../types/baskt';
import { useBasktList } from '../../../hooks/baskt/useBasktList';
import { SearchBar } from '../../shared/SearchBar';
import { useBasktOI } from '../../../hooks/baskt/useBasktOI';

export const BasktChart = ({
  baskt,
  chartPeriod,
  chartType,
  onBasktChange,
}: Omit<
  BasktChartProps,
  'onCompositionClick' | 'onPositionClick' | 'setChartPeriod' | 'setChartType'
> & {
  onBasktChange: (basktName: string) => void;
}) => {
  const { filteredBaskts } = useBasktList();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState('');

  const currentBaskt =
    filteredBaskts.find((b) => b.basktId?.toString() === baskt.basktId?.toString()) || baskt;

  const filtered = filteredBaskts?.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.basktId?.toString().toLowerCase().includes(search.toLowerCase()),
  );

  // Get real OI value
  const { totalOpenInterest, isLoading: oiLoading } = useBasktOI(baskt.basktId?.toString());

  return (
    <div className="border-b border-muted-foreground/20">
      <div className="pb-0">
        <div className="flex flex-row items-center justify-between border-b px-4 py-2 gap-3 min-h-0 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center px-0 py-0 rounded hover:bg-muted/30 transition min-w-0"
                  style={{ height: '40px' }}
                >
                  <span className="font-semibold text-lg sm:text-xl text-primary">
                    {baskt.name}
                  </span>
                  <span
                    className={`font-semibold text-sm sm:text-base ml-2 sm:ml-3 ${
                      currentBaskt?.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    <NumberFormat value={currentBaskt?.change24h} />%
                  </span>
                  <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 p-2">
                <SearchBar value={search} onChange={setSearch} placeholder="Search baskt..." />
                <div className="mt-2 max-h-60 overflow-y-auto divide-y divide-muted-foreground/10">
                  {filtered?.length ? (
                    filtered.map((b) => (
                      <button
                        key={b.basktId?.toString()}
                        className={`flex items-center gap-3 w-full px-3 py-2 rounded hover:bg-muted/40 transition text-left ${
                          b.basktId?.toString() === baskt.basktId?.toString()
                            ? 'bg-muted/20 font-bold'
                            : ''
                        }`}
                        onClick={() => {
                          setPopoverOpen(false);
                          onBasktChange(b.name);
                        }}
                      >
                        <span>{b.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">No baskt found</div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
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
