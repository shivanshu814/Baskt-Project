import { BasktInfo } from '@baskt/types';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../../routes/route';
import { calculatePerformanceColor, formatPriceChange } from '../../../utils/formatters/formatters';

export function useMobileHeader(baskt: BasktInfo) {
  const router = useRouter();

  const performance = baskt.performance?.month || 0;
  const performanceColor = calculatePerformanceColor(performance);
  const performanceText = formatPriceChange(performance);

  const handleBasktSelect = (basktId: string) => {
    router.push(`${ROUTES.TRADE}/${encodeURIComponent(basktId)}`);
  };

  return {
    performance,
    performanceColor,
    performanceText,
    handleBasktSelect,
  };
}
