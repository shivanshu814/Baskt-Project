import {
  NumberFormat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baskt/ui';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFilteredBaskts } from '../../../hooks/baskt/use-filtered-baskts';
import { ROUTES } from '../../../routes/route';
import { DesktopHeaderProps } from '../../../types/baskt/trading/components/desktop';
import { calculatePerformanceColor, formatPriceChange } from '../../../utils/formatters/formatters';
import { BasketSearchBar } from '../../shared/BasketSearchBar';
import { BasketAssetsDisplay } from '../shared/baskt/BasketAssetsDisplay';
import { MetricItem } from '../shared/cards/MetricItem';

export function DesktopHeader({ combinedBaskts }: DesktopHeaderProps) {
  const router = useRouter();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isBasketDropdownOpen, setIsBasketDropdownOpen] = useState(false);

  const { filteredBaskts, currentBaskt } = useFilteredBaskts({
    combinedBaskts,
    searchQuery,
  });

  const handleBasktClick = useCallback(
    (basktData: any) => {
      router.push(`${ROUTES.TRADE}/${encodeURIComponent(basktData.baskt.basktId)}`);
      setIsBasketDropdownOpen(false);
    },
    [router],
  );

  useEffect(() => {
    if (!isBasketDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBasketDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBasketDropdownOpen]);

  return (
    <>
      <div className="hidden sm:flex flex-row gap-1 mt-1">
        {/* baskt search */}
        <div
          className="w-1/2 sm:w-[20%] border border-border bg-zinc-900/80 rounded-sm relative"
          ref={dropdownRef}
        >
          <button
            onClick={() => setIsBasketDropdownOpen(!isBasketDropdownOpen)}
            className="w-full px-4 py-5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BasketAssetsDisplay assets={currentBaskt?.assets || []} />
              <div className="flex items-center gap-2">
                <span className="font-semibold">{currentBaskt?.baskt?.name || 'Select Baskt'}</span>
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
                  <Table className="w-full text-sm">
                    <TableHeader className="sticky top-0 bg-zinc-900/95 border-b border-border/50">
                      <TableRow>
                        <TableHead className="text-left py-2 px-2">Baskt</TableHead>
                        <TableHead className="text-center py-2 px-2">Current Price</TableHead>
                        <TableHead className="text-center py-2 px-2">24hr Change</TableHead>
                        <TableHead className="text-center py-2 px-2">Volume</TableHead>
                        <TableHead className="text-right py-2 px-2 pr-6">Open Interest</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBaskts?.map((basktData, index) => {
                        return (
                          <TableRow
                            key={basktData.baskt.basktId || index}
                            className="border-b border-border/30 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                            onClick={() => handleBasktClick(basktData)}
                          >
                            <TableCell className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <BasketAssetsDisplay assets={basktData.assets || []} />
                                <span className="font-semibold">{basktData.baskt.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-2 text-center">
                              {basktData.metrics?.currentNav &&
                              Number(basktData.metrics?.currentNav) > 0 ? (
                                <NumberFormat
                                  value={basktData.metrics?.currentNav}
                                  isPrice={true}
                                  showCurrency={true}
                                />
                              ) : (
                                <span className="text-muted-foreground">---</span>
                              )}
                            </TableCell>
                            <TableCell
                              className={`py-3 px-2 text-center ${calculatePerformanceColor(
                                basktData.metrics?.performance?.daily,
                              )}`}
                            >
                              {formatPriceChange(basktData.metrics?.performance?.daily)}
                            </TableCell>
                            <TableCell className="py-3 px-2 text-center">
                              <NumberFormat
                                value={Number(basktData.metrics?.totalVolume)}
                                isPrice={true}
                                showCurrency={true}
                              />
                            </TableCell>
                            <TableCell className="py-3 px-2 text-right pr-6">
                              <NumberFormat
                                value={Number(basktData.metrics?.openInterest)}
                                isPrice={true}
                                showCurrency={true}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* current baskt info */}
        <div className="w-1/2 sm:w-[80%] border border-border bg-zinc-900/80 rounded-sm">
          <div className="px-4 py-3">
            <div className={`grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-8gap-4 text-sm`}>
              <MetricItem
                label="30D Change"
                value={currentBaskt?.metrics?.performance?.monthly || 0}
                isPercentage={true}
                showSign={true}
              />
              <MetricItem label="OI" value={Number(currentBaskt?.metrics?.openInterest || 0)} />
              <MetricItem
                label="24hr Change"
                value={Number(currentBaskt?.metrics?.performance?.daily || 0)}
                isPercentage={true}
                showSign={true}
              />
              <MetricItem
                label="24hr Volume"
                value={Number(currentBaskt?.metrics?.totalVolume || 0)}
              />
              <MetricItem label="Total Assets" value={currentBaskt?.assets?.length || 0} />
              <MetricItem label="30D Volatility" value="18.5%" className="text-green-500" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
