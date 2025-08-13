import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRef, useState } from 'react';
import { MobilePriceInfoSectionProps } from '../../../../types/trading/components/mobile';
import { MetricItem } from '../../shared/cards/MetricItem';

export function MobilePriceInfoSection({
  baskt,
  performanceColor,
  performanceText,
  oiLoading,
  totalOpenInterest,
  volumeLoading,
  totalVolume,
}: MobilePriceInfoSectionProps) {
  const [isPriceInfoExpanded, setIsPriceInfoExpanded] = useState(false);
  const mobilePriceInfoRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="w-1/2 border border-border bg-zinc-900/80 mb-1 rounded-sm"
      ref={mobilePriceInfoRef}
    >
      <button
        onClick={() => setIsPriceInfoExpanded(!isPriceInfoExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{baskt.name}</span>
          <span className={`text-sm ${performanceColor}`}>{performanceText}</span>
        </div>
        {isPriceInfoExpanded ? (
          <ChevronUp className="w-4 h-4 text-white" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white" />
        )}
      </button>

      {isPriceInfoExpanded && (
        <div className="px-4 py-3 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-sm">
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
      )}
    </div>
  );
}
