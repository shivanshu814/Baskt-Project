import { BasktInfo } from '@baskt/types';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { getBasktPrice, getPerformanceData, getSafeBasktName } from '../../lib/baskt/baskt';
import { calculateCurrentWeightsForBaskt } from '../../lib/baskt/baskt-card';
import { MetricCardType } from '../../types/baskt';
import { getAssetCount, getAssetImages, getExtraAssetsCount } from '../../utils/asset/asset';
import { createBasktCardHandlers } from '../../utils/baskt/baskt';
import { useBasktOI } from './details/use-baskt-oi';

export const useBasktCard = (baskt: BasktInfo) => {
  const router = useRouter();
  const [open, setOpen] = useState<string | undefined>(undefined);

  const assetCount = useMemo(() => getAssetCount(baskt.assets), [baskt.assets]);
  const assetImages = useMemo(() => getAssetImages(baskt.assets, 3), [baskt.assets]);
  const extraAssets = useMemo(() => getExtraAssetsCount(baskt.assets, 3), [baskt.assets]);
  const basktPrice = useMemo(() => getBasktPrice(baskt), [baskt]);
  const performanceData = useMemo(() => getPerformanceData(baskt), [baskt]);

  const currentWeights = useMemo(
    () => calculateCurrentWeightsForBaskt(baskt.assets),
    [baskt.assets],
  );

  const { totalOpenInterest } = useBasktOI(baskt.basktId as string);

  const safeBasktName = useMemo(() => getSafeBasktName(baskt), [baskt.name]);

  const metricCards = useMemo(
    (): MetricCardType[] => [
      {
        label: 'OI',
        value: totalOpenInterest !== undefined ? totalOpenInterest / 1e6 : 0,
        displayValue: totalOpenInterest !== undefined ? `${totalOpenInterest / 1e6}M` : '--',
        isFormatted: true,
      },
      {
        label: '24h',
        value: performanceData.day || 0,
        displayValue:
          performanceData.day !== undefined
            ? `${performanceData.day >= 0 ? '+' : ''}${performanceData.day.toFixed(2)}%`
            : '--',
        color:
          performanceData.day !== undefined && performanceData.day >= 0
            ? 'text-green-500'
            : 'text-red-500',
      },
      {
        label: '7d',
        value: performanceData.week || 0,
        displayValue:
          performanceData.week !== undefined
            ? `${performanceData.week >= 0 ? '+' : ''}${performanceData.week.toFixed(2)}%`
            : '--',
        color:
          performanceData.week !== undefined && performanceData.week >= 0
            ? 'text-green-500'
            : 'text-red-500',
      },
      {
        label: '30d',
        value: performanceData.month || 0,
        displayValue:
          performanceData.month !== undefined
            ? `${performanceData.month >= 0 ? '+' : ''}${performanceData.month.toFixed(2)}%`
            : '--',
        color:
          performanceData.month !== undefined && performanceData.month >= 0
            ? 'text-green-500'
            : 'text-red-500',
      },
      {
        label: 'Sharpe Ratio',
        value: 1.2,
        displayValue: '1.2',
      },
    ],
    [totalOpenInterest, performanceData],
  );

  const handlers = useMemo(
    () => createBasktCardHandlers(setOpen, router, safeBasktName, open),
    [setOpen, router, safeBasktName, open],
  );

  return {
    open,
    setOpen,
    assetCount,
    assetImages,
    extraAssets,
    basktPrice,
    performanceData,
    currentWeights,
    totalOpenInterest,
    safeBasktName,
    metricCards,
    handlers,
  };
};
