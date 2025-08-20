import { BasktAssetInfo } from '@baskt/types';

export const calculateCurrentWeights = (assets: BasktAssetInfo[] | undefined): number[] => {
  if (!assets || assets.length === 0) return [];

  return assets.map((_, index) => {
    return Math.round((100 / assets.length) * 100) / 100;
  });
};
