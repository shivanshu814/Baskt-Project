import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Loading from '../../../../app/loading';
import { useOptimizedBasktList } from '../../../../hooks/baskt/use-explore-data';
import { useModalState } from '../../../../hooks/trade/modals/use-modal-state';
import { ROUTES } from '../../../../routes/route';
import { TradingPageContainerProps } from '../../../../types/baskt/trading/orders';
import {
  calculatePerformanceColor,
  formatPriceChange,
} from '../../../../utils/formatters/formatters';
import { StatusBanner } from '../../../shared/StatusBanner';
import { FavoritesSection } from '../../favorites/FavoritesSection';
import { DesktopHeader } from '../../header/DesktopHeader';
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
  const {
    baskts: { trendingBaskts, combinedBaskts },
    isLoading: isLoadingBaskts,
  } = useOptimizedBasktList('all', true);

  const router = useRouter();

  const performance = baskt?.performance?.month || 0;
  const performanceColor = calculatePerformanceColor(performance);
  const performanceText = formatPriceChange(performance);

  const handleBasktSelect = (basktId: string) => {
    router.push(`${ROUTES.TRADE}/${encodeURIComponent(basktId)}`);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

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
            <FavoritesSection trendingBaskts={trendingBaskts || []} isLoading={isLoadingBaskts} />
          </div>
          <div className="hidden lg:block">
            <DesktopHeader combinedBaskts={combinedBaskts || []} />
          </div>
          <div className="lg:hidden">
            <div className="sm:hidden flex gap-1 mt-1">
              <MobileBasktInfoSection
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                combinedBaskts={combinedBaskts || []}
                onBasktSelect={handleBasktSelect}
              />
              <MobilePriceInfoSection
                combinedBaskts={combinedBaskts || []}
                performanceColor={performanceColor}
                performanceText={performanceText}
                oiLoading={isLoading}
                totalOpenInterest={
                  baskt.stats?.longOpenInterestContracts
                    ? Number(baskt.stats.longOpenInterestContracts)
                    : 0
                }
                volumeLoading={isLoading}
                totalVolume={
                  baskt?.stats?.longAllTimeVolume ? Number(baskt.stats.longAllTimeVolume) : 0
                }
              />
            </div>
          </div>
          <div className="flex flex-col flex-1">
            <TradingChart combinedBaskts={combinedBaskts || []} />
            <TradingTabs baskt={baskt} />
          </div>
        </div>
        <div className="hidden lg:block col-span-3 border border-border bg-zinc-900/80 rounded-sm mx-1 mb-1 mr-1 p-4">
          <TradingPanel combinedBaskts={combinedBaskts || []} />
        </div>
      </div>

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
