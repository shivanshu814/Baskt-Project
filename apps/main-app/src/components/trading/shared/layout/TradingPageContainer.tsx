import { TradingPageContainerProps } from '../../../../types/trading/orders';
import { StatusBanner } from '../../../shared/StatusBanner';
import { DesktopHeader } from '../../desktop/header/DesktopHeader';
import { MobileHeader } from '../../mobile/header/MobileHeader';
import { MobileTradingOverlay } from '../../mobile/layout/MobileTradingOverlay';
import { FavoritesSection } from '../baskt/FavoritesSection';
import { ErrorState } from '../helper/ErrorState';
import { LoadingSpinner } from '../helper/LoadingSpinner';
import { TradingModals } from '../modals/TradingModals';
import { TradingLayout } from './TradingLayout';
import { TradingPanel } from './TradingPanel';

export function TradingPageContainer({
  isLoading,
  isBasktDataError,
  baskt,
}: TradingPageContainerProps) {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isBasktDataError || !baskt) {
    return <ErrorState />;
  }

  return (
    <div className="min-h-screen bg-black pt-1 pb-9">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        <div className="col-span-1 lg:col-span-9 flex flex-col px-1 -mr-1">
          <div className="lg:hidden">
            <FavoritesSection />
          </div>
          <div className="hidden lg:block">
            <FavoritesSection />
          </div>
          <div className="hidden lg:block">
            <DesktopHeader baskt={baskt} />
          </div>
          <div className="lg:hidden">
            <MobileHeader baskt={baskt} />
          </div>
          <TradingLayout baskt={baskt} />
        </div>
        <div className="hidden lg:block col-span-3 border border-border bg-zinc-900/80 rounded-sm mx-1 mb-1 mr-1 p-4">
          <TradingPanel baskt={baskt} />
        </div>
      </div>
      <MobileTradingOverlay baskt={baskt} />
      <StatusBanner />
      <TradingModals />
    </div>
  );
}
