import { BasktInfo } from '@baskt/types';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../../routes/route';
import { calculatePerformanceColor, formatPriceChange } from '../../../utils/formatters/formatters';

export function useMobileTradingOverlay() {
  const router = useRouter();

  const getBasktPerformance = (baskt: BasktInfo) => {
    const performance = baskt.performance?.day || 0;
    const performanceColor = calculatePerformanceColor(performance);
    const performanceText = formatPriceChange(performance);

    return {
      performance,
      performanceColor,
      performanceText,
    };
  };

  const handleBasktSelect = (basktId: string) => {
    router.push(`${ROUTES.TRADE}/${encodeURIComponent(basktId)}`);
  };

  const filterBaskts = (baskts: BasktInfo[], currentBasktId: string, searchQuery: string) => {
    return baskts
      ?.filter((basktItem) => basktItem.basktId !== currentBasktId)
      ?.filter((basktItem) => {
        if (!searchQuery) return true;
        return basktItem.name?.toLowerCase().includes(searchQuery.toLowerCase());
      });
  };

  return {
    getBasktPerformance,
    handleBasktSelect,
    filterBaskts,
  };
}
