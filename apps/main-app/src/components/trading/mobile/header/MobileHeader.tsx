import { useState } from 'react';
import { useBasktOI } from '../../../../hooks/baskt/details/use-baskt-oi';
import { useBasktVolume } from '../../../../hooks/baskt/details/use-baskt-volume';
import { useBasktList } from '../../../../hooks/baskt/use-baskt-list';
import { useMobileHeader } from '../../../../hooks/trading/mobile/use-mobile-header';
import { MobileHeaderProps } from '../../../../types/trading/components/mobile';
import { MobileBasktInfoSection } from '../sections/MobileBasktInfoSection';
import { MobilePriceInfoSection } from '../sections/MobilePriceInfoSection';

export function MobileHeader({ baskt }: MobileHeaderProps) {
  const { filteredBaskts } = useBasktList();
  const { totalOpenInterest, isLoading: oiLoading } = useBasktOI(baskt?.basktId || '');
  const { totalVolume, isLoading: volumeLoading } = useBasktVolume(baskt?.basktId || '');
  const { performanceColor, performanceText, handleBasktSelect } = useMobileHeader(baskt);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  return (
    <div className="sm:hidden flex gap-2 mt-2 mr-1">
      <MobileBasktInfoSection
        baskt={baskt}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
        filteredBaskts={filteredBaskts}
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
  );
}
