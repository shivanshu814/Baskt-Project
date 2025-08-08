import { FavoriteItemProps } from '../../../../types/components/shared/favorites';
import {
  calculatePerformanceColor,
  formatPriceChange,
} from '../../../../utils/formatters/formatters';

export function FavoriteItem({ baskt, index }: FavoriteItemProps) {
  const profit = baskt.performance?.day || 0;
  const profitColor = calculatePerformanceColor(profit);
  const profitText = formatPriceChange(profit);

  return (
    <div key={baskt.basktId || index} className="text-sm">
      <span className="text-muted-foreground">{baskt.name}</span>
      <div className={profitColor}>{profitText}</div>
    </div>
  );
}
