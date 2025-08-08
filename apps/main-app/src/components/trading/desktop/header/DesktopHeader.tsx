import { ChevronDown, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useBasktOI } from '../../../../hooks/baskt/details/use-baskt-oi';
import { useBasktVolume } from '../../../../hooks/baskt/details/use-baskt-volume';
import { useBasktList } from '../../../../hooks/baskt/use-baskt-list';
import { ROUTES } from '../../../../routes/route';
import { DesktopHeaderProps } from '../../../../types/trading/components/desktop';
import {
  calculatePerformanceColor,
  formatPriceChange,
} from '../../../../utils/formatters/formatters';
import { filterBasktsBySearch } from '../../../../utils/ui/ui';
import { BasketSearchBar } from '../../../shared/BasketSearchBar';
import { BasketAssetsDisplay } from '../../shared/baskt/BasketAssetsDisplay';
import { MetricItem } from '../../shared/cards/MetricItem';
import { BasketListItemWithMetrics } from '../baskt/BasketListItemWithMetrics';

export function DesktopHeader({ baskt }: DesktopHeaderProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isBasketDropdownOpen, setIsBasketDropdownOpen] = useState(false);

  const { filteredBaskts, isLoading: isLoadingBaskts } = useBasktList();
  const { totalOpenInterest, isLoading: oiLoading } = useBasktOI(baskt?.basktId || '');
  const { totalVolume, isLoading: volumeLoading } = useBasktVolume(baskt?.basktId || '');
  const filteredBasktsList = filterBasktsBySearch(filteredBaskts, searchQuery);

  const handleBasktClick = (basktName: string) => {
    router.push(`${ROUTES.TRADE}/${encodeURIComponent(basktName)}`);
    setIsBasketDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBasketDropdownOpen(false);
      }
    };

    if (isBasketDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBasketDropdownOpen, setIsBasketDropdownOpen]);

  return (
    <>
      <div className="hidden sm:block border border-border bg-zinc-900/80 rounded-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2 lg:gap-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <div className="flex items-center gap-4 overflow-x-auto">
              {isLoadingBaskts ? (
                <span className="text-sm text-muted-foreground whitespace-nowrap">Loading...</span>
              ) : filteredBaskts.length > 0 ? (
                filteredBaskts.slice(0, 5).map((baskt, index) => {
                  const profit = baskt.performance?.day || 0;
                  const profitColor = calculatePerformanceColor(profit);
                  const profitText = formatPriceChange(profit);

                  return (
                    <span key={baskt.basktId || index} className="text-sm whitespace-nowrap">
                      {baskt.name}
                      {'  '}
                      <span className={profitColor}>
                        {profitText}
                        {'  '}
                      </span>
                    </span>
                  );
                })
              ) : (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  No profitable baskts
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden sm:flex flex-row gap-1 mt-1">
        <div
          className="w-1/2 sm:w-[20%] border border-border bg-zinc-900/80 rounded-sm relative"
          ref={dropdownRef}
        >
          <button
            onClick={() => setIsBasketDropdownOpen(!isBasketDropdownOpen)}
            className="w-full px-4 py-5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BasketAssetsDisplay assets={baskt.assets || []} />
              <div className="flex items-center gap-2">
                <span className="font-semibold">{baskt.name}</span>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isBasketDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isBasketDropdownOpen && (
            <div
              className="absolute top-full left-0 z-50 mt-1 bg-zinc-900/95 border border-border rounded-sm shadow-lg backdrop-blur-sm w-[1105px]"
              ref={desktopDropdownRef}
            >
              <div className="p-4 w-[70rem]">
                <BasketSearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  selectedFilter={selectedFilter}
                  onFilterChange={setSelectedFilter}
                  placeholder="Search baskts..."
                />

                <div className="mt-4 max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border/50 sticky top-0 bg-zinc-900/95">
                      <tr>
                        <th className="text-left py-2 px-2">Baskt</th>
                        <th className="text-left py-2 px-2">Last Price</th>
                        <th className="text-left py-2 px-2">24hr Change</th>
                        <th className="text-left py-2 px-2">Volume</th>
                        <th className="text-left py-2 px-2">OI</th>
                      </tr>
                    </thead>
                    <tbody>
                      <BasketListItemWithMetrics baskt={baskt} isCurrentBaskt={true} />

                      {filteredBasktsList
                        ?.filter((basktItem) => basktItem.basktId !== baskt?.basktId)
                        ?.map((basktItem, index) => (
                          <BasketListItemWithMetrics
                            key={basktItem.basktId || index}
                            baskt={basktItem}
                            onClick={() => handleBasktClick(basktItem.name)}
                          />
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-1/2 sm:w-[80%] border border-border bg-zinc-900/80 rounded-sm">
          <div className="px-4 py-3">
            <div className={`grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-8gap-4 text-sm`}>
              <MetricItem
                label="30D Change"
                value={baskt.performance?.month || 0}
                isPercentage={true}
                showSign={true}
              />
              <MetricItem label="OI" value={totalOpenInterest} isLoading={oiLoading} />
              <MetricItem
                label="24hr Change"
                value={baskt.performance?.day || 0}
                isPercentage={true}
                showSign={true}
              />
              <MetricItem label="24hr Volume" value={totalVolume} isLoading={volumeLoading} />
              <MetricItem label="Total Assets" value={baskt.assets?.length || 0} />
              <MetricItem label="30D Volatility" value="18.5%" className="text-green-500" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
