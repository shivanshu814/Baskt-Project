'use client';

import { Button, NumberFormat } from '@baskt/ui';
import { ChevronDown, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useBasktList } from '../../../hooks/baskt/use-baskt-list';
import { useMobileTradingOverlay } from '../../../hooks/trade/mobile/use-mobile-trading-overlay';
import { MobileTradingOverlayProps } from '../../../types/baskt/trading/components/mobile';
import { BasketSearchBar } from '../../shared/BasketSearchBar';
import { BasketAssetsDisplay } from '../shared/baskt/BasketAssetsDisplay';
import { TradingPanel } from '../shared/layout/TradingPanel';

export function MobileLayout({ baskt }: MobileTradingOverlayProps) {
  const { handleBasktSelect } = useMobileTradingOverlay();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBasketDropdownOpen, setIsBasketDropdownOpen] = useState(false);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const { filteredBaskts } = useBasktList();

  const { shouldShowMobile, shouldShowDesktop, currentPrice, priceColor, onClose } = (() => {
    const isMobile = false;
    return {
      shouldShowMobile: isMobile,
      shouldShowDesktop: !isMobile,
      currentPrice: baskt.price || 0,
      priceColor: 'text-green-500',
      onClose: () => setIsMobileMenuOpen(false),
    };
  })();

  const getBasktPerformance = (basktItem: any) => {
    const performance = basktItem.performance?.day || 0;
    const performanceColor = performance >= 0 ? 'text-green-500' : 'text-red-500';
    const performanceText = `${performance >= 0 ? '+' : ''}${performance.toFixed(2)}%`;

    return { performanceColor, performanceText };
  };

  const filteredBasktsList = filteredBaskts
    ?.filter((basktItem) => basktItem.basktId !== baskt?.basktId)
    ?.filter((basktItem) => {
      if (!searchQuery) return true;
      return basktItem.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

  if (!isMobileMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col h-full bg-zinc-900">
        {shouldShowMobile && (
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Trade {baskt.name}</h3>
              <BasketAssetsDisplay assets={baskt.assets || []} />
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}

        {shouldShowDesktop && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-semibold">Trade {baskt.name}</span>
            </div>
            <span className={`text-lg font-bold sm:text-xl ml-2 ${priceColor}`}>
              <NumberFormat value={currentPrice} isPrice={true} showCurrency={true} />
            </span>
          </div>
        )}

        <div className="relative" ref={mobileDropdownRef}>
          <button
            onClick={() => setIsBasketDropdownOpen(!isBasketDropdownOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BasketAssetsDisplay assets={baskt.assets || []} />
              <div className="flex items-center gap-2">
                <span className="font-semibold">{baskt.name}</span>
                <BasketAssetsDisplay assets={baskt.assets || []} />
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-white transition-transform duration-200 ${
                isBasketDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isBasketDropdownOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 bg-zinc-900/95 border border-border rounded-sm shadow-lg backdrop-blur-sm w-full">
              <div className="p-4">
                <BasketSearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  selectedFilter={selectedFilter}
                  onFilterChange={setSelectedFilter}
                  placeholder="Search baskts..."
                />

                <div className="max-h-60 overflow-y-auto space-y-2">
                  <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-sm border border-border/50">
                    <div className="flex items-center gap-3">
                      <BasketAssetsDisplay assets={baskt.assets || []} />
                      <div>
                        <div className="font-semibold text-sm">{baskt.name}</div>
                        <div className="text-sm text-muted-foreground">
                          <NumberFormat
                            value={baskt.price || 0}
                            isPrice={true}
                            showCurrency={true}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-semibold ${
                          getBasktPerformance(baskt).performanceColor
                        }`}
                      >
                        {getBasktPerformance(baskt).performanceText}
                      </div>
                    </div>
                  </div>

                  {filteredBasktsList?.map((basktItem, index) => {
                    const { performanceColor, performanceText } = getBasktPerformance(basktItem);
                    return (
                      <div
                        key={basktItem.basktId || index}
                        className="flex items-center justify-between p-3 hover:bg-zinc-800/50 rounded-sm border border-border/50 cursor-pointer transition-colors"
                        onClick={() => handleBasktSelect(basktItem.name)}
                      >
                        <div className="flex items-center gap-3">
                          <BasketAssetsDisplay assets={basktItem.assets || []} />
                          <div>
                            <div className="font-semibold text-sm">{basktItem.name}</div>
                            <div className="text-sm text-muted-foreground">
                              <NumberFormat
                                value={basktItem.price || 0}
                                isPrice={true}
                                showCurrency={true}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${performanceColor}`}>
                            {performanceText}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <TradingPanel baskt={baskt} />
        </div>
      </div>
    </div>
  );
}
