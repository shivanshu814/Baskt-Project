import { useCallback, useEffect, useMemo, useState } from 'react';
import { trpc } from '../../lib/api/trpc';
import { Asset } from '../../types/asset';

export function useAssetSelection(
  selectedAssets: Asset[] = [],
  open: boolean,
  onAssetSelect?: (assets: Asset[]) => void,
  onOpenChange?: (open: boolean) => void,
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());

  // get all assets
  const {
    data: assetsData,
    isLoading,
    error,
    refetch,
  } = trpc.asset.getAllAssets.useQuery(
    { withConfig: true, withLivePrices: true },
    {
      staleTime: 30 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 2,
    },
  );

  // get initial asset ids
  const initialAssetIds = useMemo(
    () => selectedAssets.map((asset) => asset._id!).filter(Boolean),
    [selectedAssets],
  );

  // get assets
  const assets = useMemo(() => {
    return (assetsData?.data || []).map((asset: any) => ({
      ...asset,
      _id: asset.assetAddress,
      priceRaw: asset.price,
      weight: 0,
    }));
  }, [assetsData?.data]);

  // get selected assets list
  const selectedAssetsList = useMemo(
    () => assets.filter((asset) => selectedAssetIds.has(asset._id!)),
    [assets, selectedAssetIds],
  );

  // reset selection
  useEffect(() => {
    if (open) {
      setSelectedAssetIds(new Set(initialAssetIds));
    } else {
      setSelectedAssetIds(new Set());
      setSearchQuery('');
    }
  }, [open, initialAssetIds]);

  // toggle asset selection
  const handleAssetToggle = useCallback((assetId: string) => {
    setSelectedAssetIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(assetId)) {
        newSelected.delete(assetId);
      } else {
        if (newSelected.size >= 10) {
          return prev;
        }
        newSelected.add(assetId);
      }
      return newSelected;
    });
  }, []);

  // select all assets
  const handleSelectAll = useCallback((filteredAssets: Asset[]) => {
    const allIds = new Set(filteredAssets.map((asset) => asset._id!).filter(Boolean));
    const limitedIds = new Set(Array.from(allIds).slice(0, 10));
    setSelectedAssetIds(limitedIds);
  }, []);

  // get selected assets
  const getSelectedAssets = useCallback(
    (allAssets: Asset[]) => {
      return allAssets.filter((asset) => selectedAssetIds.has(asset._id!));
    },
    [selectedAssetIds],
  );

  // reset selection
  const resetSelection = useCallback(() => {
    setSelectedAssetIds(new Set());
    setSearchQuery('');
  }, []);

  // done with asset selection
  const handleDone = useCallback(() => {
    const selectedAssetsList = getSelectedAssets(assets);

    if (selectedAssetsList.length < 2) {
      return;
    }

    if (onAssetSelect) {
      onAssetSelect(selectedAssetsList);
    }
    resetSelection();
    onOpenChange?.(false);
  }, [getSelectedAssets, assets, onAssetSelect, resetSelection, onOpenChange]);

  // handle open change
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        resetSelection();
      }
      onOpenChange?.(newOpen);
    },
    [resetSelection, onOpenChange],
  );

  return {
    assets,
    selectedAssetsList,
    selectedAssetIds,
    isLoading,
    error,

    searchQuery,
    setSearchQuery,

    handleAssetToggle,
    handleSelectAll,

    handleDone,
    handleOpenChange,

    onRetry: refetch,
    resetSelection,
  };
}
