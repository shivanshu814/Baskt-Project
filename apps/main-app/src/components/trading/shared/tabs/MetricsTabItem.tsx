import { MetricItemProps } from '../../../../types/trading/components/tabs';

export function MetricsTabItem({ label, value, className = '' }: MetricItemProps) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-muted-foreground">{label}:</span>
      <span className={`text-base font-semibold ${className}`}>{value}</span>
    </div>
  );
}
