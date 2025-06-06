import { BasktInfo } from '@baskt/types';
import { RawBasktData } from '../../types/baskt';

export const processBasktData = (
  data: { success: boolean; data?: (RawBasktData | null)[]; message?: string } | undefined,
): BasktInfo[] => {
  if (!data?.success || !data.data) return [];

  return data.data
    .filter(
      (baskt): baskt is RawBasktData => baskt !== null && 'basktId' in baskt && 'account' in baskt,
    )
    .map((baskt) => ({
      ...baskt,
      basktId: baskt.basktId?.toString() || '',
      name: baskt.name || '',
      image: baskt.image || '',
      price: baskt.price ?? 0,
      change24h: baskt.change24h ?? 0,
      aum: baskt.aum ?? 0,
      totalAssets: baskt.totalAssets ?? 0,
      isActive: baskt.account?.isActive ?? false,
      creationDate: baskt.creationDate ? new Date(baskt.creationDate) : new Date(),
      performance: {
        day: baskt.performance?.daily || 0,
        week: baskt.performance?.weekly || 0,
        month: baskt.performance?.monthly || 0,
        year: baskt.performance?.year || 0,
      },
      assets:
        baskt.assets?.map((asset) => ({
          ...asset,
          weight: Number(asset.weight),
          direction: asset.direction,
          id: asset.id,
          name: asset.name,
          ticker: asset.ticker,
          symbol: asset.ticker ?? '',
          price: asset.price,
          change24h: asset.change24h,
          volume24h: asset.volume24h,
          marketCap: asset.marketCap,
          assetAddress: asset.assetAddress,
          logo: asset.logo,
        })) || [],
      priceHistory: {
        daily:
          baskt.priceHistory?.daily?.map((entry) => ({
            ...entry,
            volume: 0,
            price: Number(entry.price),
          })) || [],
        weekly:
          baskt.priceHistory?.weekly?.map((entry) => ({
            ...entry,
            volume: 0,
            price: Number(entry.price),
          })) || [],
        monthly:
          baskt.priceHistory?.monthly?.map((entry) => ({
            ...entry,
            volume: 0,
            price: Number(entry.price),
          })) || [],
        yearly:
          baskt.priceHistory?.yearly?.map((entry) => ({
            ...entry,
            volume: 0,
            price: Number(entry.price),
          })) || [],
      },
      rebalancePeriod: baskt.rebalancePeriod || { value: 1, unit: 'day' },
      sparkline: baskt.sparkline || [],
      txSignature: baskt.txSignature || '',
      categories: baskt.categories || [],
      creator: baskt.creator || '',
    }));
};
