import { BasktAssetInfo } from '@baskt/types';
import { useCallback, useMemo } from 'react';
import { generateAssetUrl, handleAssetClick } from '../../utils/asset/asset';

export const useAssetRow = (asset: BasktAssetInfo) => {
  const assetUrl = useMemo(() => generateAssetUrl(asset), [asset]);

  const handleClick = useCallback(() => {
    handleAssetClick(asset);
  }, [asset]);

  return {
    assetUrl,
    handleClick,
  };
};
