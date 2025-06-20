import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '../../utils/trpc';
import { Asset } from '../../types/assets';
import { toast } from 'sonner';

export function useAssets() {
  const {
    data: assetsRaw,
    isLoading,
    error,
    refetch,
  } = trpc.asset.getAllAssetsWithConfig.useQuery();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetToModify, setAssetToModify] = useState<Asset | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const updateAssetMutation = trpc.asset.updateAssetPriceConfig.useMutation();
  const deleteAssetMutation = trpc.asset.deleteAsset.useMutation();

  const assets: Asset[] = useMemo(
    () =>
      // eslint-disable-next-line
      (assetsRaw?.data || []).map((asset: any) => ({
        _id: asset._id || asset.assetAddress || asset.account?.address || '',
        ticker: asset.ticker,
        name: asset.name,
        logo: asset.logo,
        price: asset.price,
        config: asset.config,
        account: asset.account,
        latestPrice: asset.price,
      })),
    [assetsRaw],
  );

  useEffect(() => {
    const assetAddress = searchParams.get('assetAddress');
    if (assetAddress && assets.length > 0) {
      const asset = assets.find((a) => a._id.toString() === assetAddress);
      if (asset) {
        setSelectedAsset(asset);
      }
    } else {
      setSelectedAsset(null);
    }
  }, [assets, searchParams]);

  const handleViewPrices = (asset: Asset) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('assetAddress', asset._id.toString());
    router.push(`?${params.toString()}`);
    setSelectedAsset(asset);
  };

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('assetAddress');
    router.push(`?${params.toString()}`);
    setSelectedAsset(null);
  };

  const handleOpenEditDialog = (asset: Asset) => {
    setAssetToModify(asset);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setAssetToModify(null);
    setIsEditDialogOpen(false);
  };

  const handleOpenDeleteDialog = (asset: Asset) => {
    setAssetToModify(asset);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setAssetToModify(null);
    setIsDeleteDialogOpen(false);
  };

  const handleUpdateAsset = async (
    assetId: string,
    provider: { id: string; name: string; chain: string },
  ) => {
    try {
      await updateAssetMutation.mutateAsync(
        { assetId, priceConfig: { provider } },
        {
          onSuccess: () => {
            toast.success('Asset updated successfully');
            refetch();
            handleCloseEditDialog();
          },
        },
      );
    } catch (e) {
      toast.error('Failed to update asset');
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await deleteAssetMutation.mutateAsync(
        { assetId },
        {
          onSuccess: () => {
            toast.success('Asset deleted successfully');
            refetch();
            handleCloseDeleteDialog();
          },
        },
      );
    } catch (e) {
      toast.error('Failed to delete asset');
    }
  };

  return {
    assets,
    isLoading,
    error,
    selectedAsset,
    assetToModify,
    isEditDialogOpen,
    isDeleteDialogOpen,
    handleViewPrices,
    handleBack,
    handleOpenEditDialog,
    handleCloseEditDialog,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleUpdateAsset,
    handleDeleteAsset,
  };
}
