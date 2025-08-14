import { NumberFormat } from '@baskt/ui';
import { MetricItemProps } from '../../../../types/baskt/trading/components/tabs';
import {
  calculatePerformanceColor,
  formatPriceChange,
} from '../../../../utils/formatters/formatters';

export function MetricItem({
  label,
  value,
  isLoading = false,
  isPercentage = false,
  showSign = false,
  className = '',
}: MetricItemProps) {
  const renderValue = () => {
    if (isLoading) return '...';

    if (isPercentage) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      const color = calculatePerformanceColor(numValue);
      const formattedValue = formatPriceChange(numValue, showSign);
      return <span className={color}>{formattedValue}</span>;
    }

    if (typeof value === 'number') {
      if (value === 0) return '---';
      if (label === 'Total Assets') {
        return value.toString();
      }

      return <NumberFormat value={value} isPrice={true} showCurrency={true} />;
    }

    return value;
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-semibold text-center">{renderValue()}</span>
    </div>
  );
}
