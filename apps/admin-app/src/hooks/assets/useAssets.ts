import { useState } from 'react';
import { trpc } from '../../utils/trpc';
import { Asset } from '../../types/assets';

export function useAssets() {
  const { data: assetsRaw, isLoading, error } = trpc.asset.getAllAssetsWithConfig.useQuery();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Ensure each asset has an _id property for type compatibility
  // eslint-disable-next-line
  const assets: Asset[] = (assetsRaw?.data || []).map((asset: any) => ({
    _id: asset._id || asset.assetAddress || asset.account?.address || '',
    ticker: asset.ticker,
    name: asset.name,
    logo: asset.logo,
    price: asset.price,
    account: asset.account,
  }));

  const handleViewPrices = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleBack = () => {
    setSelectedAsset(null);
  };

  return {
    assets,
    isLoading,
    error,
    selectedAsset,
    handleViewPrices,
    handleBack,
  };
}
