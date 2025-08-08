import { useState } from 'react';
import { useBasktList } from '../../../../hooks/baskt/use-baskt-list';
import { useMobileTradingOverlay } from '../../../../hooks/trading/mobile/use-mobile-trading-overlay';
import { MobileTradingOverlayProps } from '../../../../types/trading/components/mobile';
import { BasketInfoHeader } from '../../shared/baskt/BasketInfoHeader';
import { TradingPanel } from '../../shared/layout/TradingPanel';
import { MobileBasketDropdown } from '../header/MobileBasketDropdown';

export function MobileTradingOverlay({ baskt }: MobileTradingOverlayProps) {
  const { handleBasktSelect } = useMobileTradingOverlay();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { filteredBaskts } = useBasktList();

  if (!isMobileMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col h-full bg-zinc-900">
        <BasketInfoHeader
          baskt={baskt}
          currentPrice={baskt.price || 0}
          priceColor="text-foreground"
          isMobile={true}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <MobileBasketDropdown
          baskt={baskt}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          filteredBaskts={filteredBaskts}
          onBasktSelect={(basktName) => handleBasktSelect(basktName)}
        />

        <div className="flex-1 overflow-y-auto">
          <TradingPanel baskt={baskt} />
        </div>
      </div>
    </div>
  );
}
