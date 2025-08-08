import { BasktAssetInfo } from '@baskt/types';

/**
 * Calculates the current weights for a baskt.
 * @param assets - The assets to calculate the current weights for.
 * @returns The current weights for the baskt.
 */
export const calculateCurrentWeights = (assets: BasktAssetInfo[] | undefined): number[] => {
  if (!assets || assets.length === 0) return [];

  return assets.map((_, index) => {
    return Math.round((100 / assets.length) * 100) / 100;
  });
};

/**
 * Calculates the metric cards for a baskt.
 * @param baskt - The baskt to calculate the metric cards for.
 * @returns The metric cards for the baskt.
 */
export const calculateMetricCards = (baskt: any) => {
  const metrics = [];

  if (baskt.aum !== undefined) {
    metrics.push({
      label: 'AUM',
      value: `$${(baskt.aum / 1000000).toFixed(2)}M`,
      color: 'text-foreground',
    });
  }

  if (baskt.assets !== undefined) {
    metrics.push({
      label: 'Total Assets',
      value: baskt.assets.length.toString(),
      color: 'text-foreground',
    });
  }

  if (baskt.performance?.day !== undefined) {
    metrics.push({
      label: '24h Change',
      value: `${baskt.performance.day >= 0 ? '+' : ''}${baskt.performance.day.toFixed(2)}%`,
      color: baskt.performance.day >= 0 ? 'text-green-500' : 'text-red-500',
    });
  }

  if (baskt.performance?.week !== undefined) {
    metrics.push({
      label: '7d Change',
      value: `${baskt.performance.week >= 0 ? '+' : ''}${baskt.performance.week.toFixed(2)}%`,
      color: baskt.performance.week >= 0 ? 'text-green-500' : 'text-red-500',
    });
  }

  if (baskt.performance?.month !== undefined) {
    metrics.push({
      label: '30d Change',
      value: `${baskt.performance.month >= 0 ? '+' : ''}${baskt.performance.month.toFixed(2)}%`,
      color: baskt.performance.month >= 0 ? 'text-green-500' : 'text-red-500',
    });
  }

  return metrics;
};

/**
 * Gets the safe name for a baskt.
 * @param baskt - The baskt to get the safe name for.
 * @returns The safe name for the baskt.
 */
export const getSafeBasktName = (baskt: any): string => {
  return baskt.name || 'Unnamed Baskt';
};

/**
 * Gets the price for a baskt.
 * @param baskt - The baskt to get the price for.
 * @returns The price for the baskt.
 */
export const getBasktPrice = (baskt: any): number => {
  return baskt.price || 0;
};

/**
 * Gets the performance data for a baskt.
 * @param baskt - The baskt to get the performance data for.
 * @returns The performance data for the baskt.
 */
export const getPerformanceData = (baskt: any) => {
  return {
    day: baskt.performance?.day,
    week: baskt.performance?.week,
    month: baskt.performance?.month,
  };
};
