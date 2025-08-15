import { MetricsTabProps } from '../../../../types/baskt/trading/components/tabs';
import { getMetricsData } from '../../../../utils/formatters/formatters';

export function MetricsTab({ baskt }: MetricsTabProps) {
  const metricsData = getMetricsData(baskt);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 w-full max-w-2xl -mt-4 -ml-2">
      {metricsData.map((metric, index) => (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">{metric.label}:</span>
          <span className={`text-base font-semibold ${metric.className}`}>{metric.value}</span>
        </div>
      ))}
    </div>
  );
}
