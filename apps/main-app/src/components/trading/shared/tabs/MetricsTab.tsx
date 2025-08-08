import { MetricsTabProps } from '../../../../types/trading/components/tabs';
import { getMetricsData } from '../../../../utils/formatters/formatters';
import { MetricsTabItem } from './MetricsTabItem';

export function MetricsTab({ baskt }: MetricsTabProps) {
  const metricsData = getMetricsData(baskt);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 w-full max-w-2xl py-4">
      {metricsData.map((metric, index) => (
        <MetricsTabItem
          key={index}
          label={metric.label}
          value={metric.value}
          className={metric.className}
        />
      ))}
    </div>
  );
}
