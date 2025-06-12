import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader } from '../../ui/card';
import { LineChart, ChevronDown, Image as LucideImage } from 'lucide-react';
import { TradingViewChart } from './TradingViewChart';
import { BasktChartProps } from '../../../types/baskt';
import { useBasktList } from '../../../hooks/baskt/useBasktList';
import { Popover, PopoverTrigger, PopoverContent } from '../../ui/popover';
import { SearchBar } from '../../shared/SearchBar';
import { BASIS_POINT } from '../../../constants/pool';

export const BasktChart = ({
  baskt,
  chartPeriod,
  setChartPeriod,
  chartType,
  setChartType,
  onBasktChange,
}: Omit<BasktChartProps, 'onCompositionClick' | 'onPositionClick'> & {
  onBasktChange: (basktId: string) => void;
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

  return (
    <Card>
      <CardHeader className="-mt-4 pb-2">
        <div className="flex items-center justify-between border-b px-2 py-3">
          <div className="flex items-center gap-3 min-w-[220px]">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center px-2 py-1 rounded hover:bg-muted/30 transition min-w-[220px]"
                >
                  {baskt.image ? (
                    <img
                      src={baskt.image}
                      alt={baskt.name}
                      className="h-10 w-10 rounded-full border mr-1"
                    />
                  ) : (
                    <LucideImage className="h-10 w-10 text-muted-foreground mr-4" />
                  )}
                  <div className="flex flex-col items-start">
                    <div className="flex items-center">
                      <span className="font-semibold text-xl">{baskt.name}</span>
                      <span
                        className={`font-semibold text-base ml-3 ${currentBaskt?.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                      >
                        {currentBaskt?.change24h !== undefined
                          ? `${Math.abs(currentBaskt.change24h).toFixed(2)}%`
                          : '-'}
                      </span>
                      <ChevronDown className="h-6 w-6 text-muted-foreground ml-2" />
                    </div>
                    <span className="font-semibold text-lg text-white -mt-2">
                      {currentBaskt?.price !== undefined
                        ? `$${(currentBaskt.price / BASIS_POINT).toLocaleString()}`
                        : '-'}
                    </span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 p-2">
                <SearchBar value={search} onChange={setSearch} placeholder="Search baskt..." />
                <div className="mt-2 max-h-60 overflow-y-auto divide-y divide-muted-foreground/10">
                  {filtered?.length ? (
                    filtered.map((b) => (
                      <button
                        key={b.basktId?.toString()}
                        className={`flex items-center gap-3 w-full px-3 py-2 rounded hover:bg-muted/40 transition text-left ${b.basktId?.toString() === baskt.basktId?.toString()
                            ? 'bg-muted/20 font-bold'
                            : ''
                          }`}
                        onClick={() => {
                          setPopoverOpen(false);
                          onBasktChange(b.basktId?.toString());
                        }}
                      >
                        {b.image ? (
                          <img src={b.image} alt={b.name} className="h-6 w-6 rounded-full border" />
                        ) : (
                          <LucideImage className="h-6 w-6 text-muted-foreground" />
                        )}
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
          <div className="flex items-center gap-x-10">
            <div className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground underline decoration-dotted">
                30D Change
              </span>
              <span className="font-semibold text-sm text-white">
                {currentBaskt?.performance?.month !== undefined
                  ? `+${currentBaskt.performance.month}%`
                  : '-'}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground underline decoration-dotted">
                Total Assets
              </span>
              <span className="font-semibold text-sm text-white">
                {currentBaskt?.totalAssets ?? '-'}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground underline decoration-dotted">
                30D Sharpe Ratio
              </span>
              <span className="font-semibold text-sm text-white">1.85</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground underline decoration-dotted">
                30D Sortino Ratio
              </span>
              <span className="font-semibold text-sm text-white">2.12</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground underline decoration-dotted">
                30D Volatility
              </span>
              <span className="font-semibold text-sm text-white">18.5%</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground underline decoration-dotted">
                30D Return vs SOL
              </span>
              <span className="font-semibold text-sm text-green-400">+5.2%</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-md px-3 py-1 text-xs ${chartType === 'line'
                  ? 'bg-background text-primary'
                  : 'text-muted-foreground hover:text-primary'
                }`}
              onClick={() => setChartType('line')}
            >
              <LineChart className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            {['1D', '1W', '1M', '1Y', 'All'].map((period) => (
              <Button
                key={period}
                variant="ghost"
                size="sm"
                className={`rounded-md px-3 py-1 text-xs ${chartPeriod === period
                    ? 'bg-background text-primary'
                    : 'text-muted-foreground hover:text-primary'
                  }`}
                onClick={() => setChartPeriod(period)}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>

        <TradingViewChart
          className="h-[500px]"
          dailyData={baskt.priceHistory?.daily || []}
          weeklyData={baskt.priceHistory?.weekly || []}
          monthlyData={baskt.priceHistory?.monthly || []}
          yearlyData={baskt.priceHistory?.yearly || []}
          chartType={chartType}
          period={chartPeriod}
          basktId={baskt.basktId?.toString() || ''}
        />
      </CardContent>
    </Card>
  );
};
