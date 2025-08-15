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

  const initialAssetIds = useMemo(
    () => selectedAssets.map((asset) => asset._id!).filter(Boolean),
    [selectedAssets],
  );

  useEffect(() => {
    if (open) {
      setSelectedAssetIds(new Set(initialAssetIds));
    } else {
      setSelectedAssetIds(new Set());
      setSearchQuery('');
    }
  }, [open, initialAssetIds]);

  const { assets, filteredAssets } = useMemo(() => {
    const assets: Asset[] = (assetsData?.data || []).filter(
      (asset: any): asset is Asset => asset._id !== undefined,
    );

    const filtered = assets.filter(
      (asset) =>
        asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.assetAddress.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return { assets, filteredAssets: filtered };
  }, [assetsData?.data, searchQuery]);

  const selectedAssetsList = useMemo(
    () => assets.filter((asset) => selectedAssetIds.has(asset._id!)),
    [assets, selectedAssetIds],
  );

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

  const handleSelectAll = useCallback((filteredAssets: Asset[]) => {
    const allIds = new Set(filteredAssets.map((asset) => asset._id!).filter(Boolean));
    const limitedIds = new Set(Array.from(allIds).slice(0, 10));
    setSelectedAssetIds(limitedIds);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedAssetIds(new Set());
  }, []);

  const getSelectedAssets = useCallback(
    (allAssets: Asset[]) => {
      return allAssets.filter((asset) => selectedAssetIds.has(asset._id!));
    },
    [selectedAssetIds],
  );

  const resetSelection = useCallback(() => {
    setSelectedAssetIds(new Set());
    setSearchQuery('');
  }, []);

  const handleDone = useCallback(() => {
    if (onAssetSelect) {
      const selectedAssetsList = getSelectedAssets(assets);
      onAssetSelect(selectedAssetsList);
    }
    resetSelection();
    onOpenChange?.(false);
  }, [getSelectedAssets, assets, onAssetSelect, resetSelection, onOpenChange]);

  const handleClose = useCallback(() => {
    resetSelection();
    onOpenChange?.(false);
  }, [resetSelection, onOpenChange]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        resetSelection();
      }
      onOpenChange?.(newOpen);
    },
    [resetSelection, onOpenChange],
  );

  const handleSelectAllClick = useCallback(() => {
    handleSelectAll(filteredAssets);
  }, [handleSelectAll, filteredAssets]);

  const handleClearClick = useCallback(() => {
    handleClearSelection();
  }, [handleClearSelection]);

  const handleAssetRemove = useCallback(
    (id: string) => {
      handleAssetToggle(id);
    },
    [handleAssetToggle],
  );

  return {
    assets,
    filteredAssets,
    selectedAssetsList,
    selectedAssetIds,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    handleAssetToggle,
    handleAssetRemove,
    handleSelectAllClick,
    handleClearClick,
    handleDone,
    handleClose,
    handleOpenChange,
    onRetry: refetch,
  };
}
