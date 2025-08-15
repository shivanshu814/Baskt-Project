import { BasktAssetInfo } from '@baskt/types';

export const calculateCurrentWeights = (assets: BasktAssetInfo[] | undefined): number[] => {
  if (!assets || assets.length === 0) return [];

  return assets.map((_, index) => {
    return Math.round((100 / assets.length) * 100) / 100;
  });
};

export const getSafeBasktName = (baskt: any): string => {
  return baskt.name || 'Unnamed Baskt';
};

export const getBasktPrice = (baskt: any): number => {
  return baskt.price || 0;
};

export const getPerformanceData = (baskt: any) => {
  return {
    day: baskt.performance?.day,
    week: baskt.performance?.week,
    month: baskt.performance?.month,
  };
};

export const calculateCurrentWeightsForBaskt = (assets: BasktAssetInfo[]) => {
  if (
    assets.length === 0 ||
    assets.some((a: any) => a.price === undefined || a.baselinePrice === undefined) //eslint-disable-line
  ) {
    return assets.map((asset: any) => asset.weight); //eslint-disable-line
  }

  // eslint-disable-next-line
  const basktAssets = assets.map((asset: any) => ({
    id: asset.id || asset.assetAddress || '',
    name: asset.name || '',
    ticker: asset.ticker || '',
    price: asset.price || 0,
    change24h: asset.change24h || 0,
    volume24h: asset.volume24h || 0,
    marketCap: asset.marketCap || 0,
    assetAddress: asset.assetAddress || asset.id || '',
    logo: asset.logo || '',
    weight: asset.weight || 0,
    direction: asset.direction || true,
    baselinePrice: asset.baselinePrice || asset.price || 0,
  }));

  return calculateCurrentWeights(basktAssets);
};
