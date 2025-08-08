import { BasktInfo } from '@baskt/types';
import { useMemo } from 'react';

export const useBasktMetricsBatch = (baskts: BasktInfo[]) => {
  const limitedBaskts = baskts.slice(0, 10);

  const metricsData = useMemo(() => {
    const data: Record<
      string,
      { volume: number; openInterest: number; volumeLoading: boolean; oiLoading: boolean }
    > = {};

    limitedBaskts.forEach((baskt) => {
      const basktId = baskt.basktId;
      if (basktId) {
        data[basktId] = {
          volume: 0,
          openInterest: 0,
          volumeLoading: false,
          oiLoading: false,
        };
      }
    });

    return data;
  }, [limitedBaskts]);

  return {
    metricsData,
    getBasktMetrics: (basktId: string) =>
      metricsData[basktId] || {
        volume: 0,
        openInterest: 0,
        volumeLoading: false,
        oiLoading: false,
      },
  };
};
