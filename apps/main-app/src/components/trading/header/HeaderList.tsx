import { NumberFormat } from '@baskt/ui';
import { useBasktOI } from '../../../hooks/baskt/details/use-baskt-oi';
import { useBasktVolume } from '../../../hooks/baskt/details/use-baskt-volume';
import { BasketListItemProps } from '../../../types/baskt/trading/components/desktop';
import { calculatePerformanceColor, formatPriceChange } from '../../../utils/formatters/formatters';

export function HeaderList({ baskt, isCurrentBaskt, onClick }: BasketListItemProps) {
  const performance = baskt.performance?.day || 0;
  const performanceColor = calculatePerformanceColor(performance);
  const performanceText = formatPriceChange(performance);
  const displayName = baskt.name || baskt.basktId || 'Unknown Baskt';

  const { totalVolume, isLoading: volumeLoading } = useBasktVolume(baskt.basktId);
  const { totalOpenInterest, isLoading: oiLoading } = useBasktOI(baskt.basktId);

  const renderVolume = () => {
    if (volumeLoading) return <span className="text-muted-foreground">Loading...</span>;
    if (totalVolume && totalVolume > 0) {
      return <NumberFormat value={totalVolume} isPrice={true} showCurrency={true} />;
    }
    return <span className="text-muted-foreground">---</span>;
  };

  const renderOpenInterest = () => {
    if (oiLoading) return <span className="text-muted-foreground">Loading...</span>;
    if (totalOpenInterest && totalOpenInterest > 0) {
      return <NumberFormat value={totalOpenInterest} isPrice={true} showCurrency={true} />;
    }
    return <span className="text-muted-foreground">---</span>;
  };

  return (
    <tr
      className={`border-b border-border/30 hover:bg-zinc-800/50 cursor-pointer transition-colors ${
        isCurrentBaskt ? 'bg-zinc-800/50' : ''
      }`}
      onClick={onClick}
    >
      <td className="py-3 px-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{displayName}</span>
        </div>
      </td>
      <td className="py-3 px-2">
        {baskt.price && baskt.price > 0 ? (
          <NumberFormat value={baskt.price} isPrice={true} showCurrency={true} />
        ) : (
          <span className="text-muted-foreground">---</span>
        )}
      </td>
      <td className={`py-3 px-2 ${performanceColor}`}>{performanceText}</td>
      <td className="py-3 px-2">{renderVolume()}</td>
      <td className="py-3 px-2">{renderOpenInterest()}</td>
    </tr>
  );
}
