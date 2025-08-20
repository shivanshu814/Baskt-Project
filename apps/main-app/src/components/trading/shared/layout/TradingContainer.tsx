import { useState } from 'react';
import Loading from '../../../../app/loading';
import { useBasktOI } from '../../../../hooks/baskt/details/use-baskt-oi';
import { useBasktVolume } from '../../../../hooks/baskt/details/use-baskt-volume';
import { useBasktList } from '../../../../hooks/baskt/use-baskt-list';
import { useMobileHeader } from '../../../../hooks/trade/mobile/use-mobile-header';
import { useModalState } from '../../../../hooks/trade/modals/use-modal-state';
import { TradingPageContainerProps } from '../../../../types/baskt/trading/orders';
import { StatusBanner } from '../../../shared/StatusBanner';
import { FavoritesSection } from '../../favorites/FavoritesSection';
import { DesktopHeader } from '../../header/DesktopHeader';
import { MobileLayout } from '../../layout/MobileLayout';
import { MobileBasktInfoSection } from '../../sections/MobileBasktInfoSection';
import { MobilePriceInfoSection } from '../../sections/MobilePriceInfoSection';
import { TradingChart } from '../charts/TradingChart';
import { ErrorState } from '../error/ErrorState';
import { AddCollateralModal } from '../modals/AddCollateralModal';
import { CancelOrderModal } from '../modals/CancelOrderModal';
import { ClosePositionModal } from '../modals/ClosePositionModal';
import { TradingTabs } from '../tabs/TradingTabs';
import { TradingPanel } from './TradingPanel';

export function TradingContainer({
  isLoading,
  isBasktDataError,
  baskt,
}: TradingPageContainerProps) {
  const { combinedBaskts } = useBasktList();
  const { totalOpenInterest, isLoading: oiLoading } = useBasktOI(baskt?.basktId || '');
  const { totalVolume, isLoading: volumeLoading } = useBasktVolume(baskt?.basktId || '');
  const { performanceColor, performanceText, handleBasktSelect } = useMobileHeader(
    baskt || ({} as any),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const safeFilteredBaskts = combinedBaskts || [];

  const {
    isAddCollateralModalOpen,
    isCancelOrderModalOpen,
    setIsCancelOrderModalOpen,
    isClosePositionModalOpen,
    setIsClosePositionModalOpen,
    selectedPositionForModal,
    selectedOrderForModal,
  } = useModalState();

  if (isLoading) {
    return <Loading />;
  }

  if (isBasktDataError || !baskt) {
    return <ErrorState />;
  }

  return (
    <div className="min-h-screen bg-black pt-1 pb-9">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        <div className="col-span-1 lg:col-span-9 flex flex-col px-1 -mr-1">
          <div>
            <FavoritesSection />
          </div>
          <div className="hidden lg:block">
            <DesktopHeader baskt={baskt} />
          </div>
          <div className="lg:hidden">
            <div className="sm:hidden flex gap-1 mt-1">
              <MobileBasktInfoSection
                baskt={baskt}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                filteredBaskts={safeFilteredBaskts as any}
                onBasktSelect={handleBasktSelect}
              />

              <MobilePriceInfoSection
                baskt={baskt}
                performanceColor={performanceColor}
                performanceText={performanceText}
                oiLoading={oiLoading}
                totalOpenInterest={totalOpenInterest}
                volumeLoading={volumeLoading}
                totalVolume={totalVolume}
              />
            </div>
          </div>
          <div className="flex flex-col flex-1">
            <TradingChart baskt={baskt} />
            <TradingTabs baskt={baskt} />
          </div>
        </div>
        <div className="hidden lg:block col-span-3 border border-border bg-zinc-900/80 rounded-sm mx-1 mb-1 mr-1 p-4">
          <TradingPanel baskt={baskt} />
        </div>
      </div>
      <MobileLayout baskt={baskt} />
      <StatusBanner />
      <AddCollateralModal
        isOpen={isAddCollateralModalOpen}
        position={selectedPositionForModal}
        onClose={() => {}}
        onAddCollateral={() => {}}
        usdcBalance={0}
      />
      <CancelOrderModal
        isOpen={isCancelOrderModalOpen}
        onClose={() => setIsCancelOrderModalOpen(false)}
        order={selectedOrderForModal}
        onCancelOrder={() => {}}
      />
      <ClosePositionModal
        isOpen={isClosePositionModalOpen}
        onClose={() => setIsClosePositionModalOpen(false)}
        position={selectedPositionForModal}
      />
    </div>
  );
}
