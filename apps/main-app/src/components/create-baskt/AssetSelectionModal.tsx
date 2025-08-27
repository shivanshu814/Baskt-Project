'use client';

import { Dialog, DialogContent } from '@baskt/ui';
import { useMemo } from 'react';
import { useAssetSelection } from '../../hooks/asset/use-asset-selection';
import { AssetSelectionModalProps } from '../../types/asset';
import { AssetGrid } from './assetModal/AssetGrid';
import { AssetModalFooter } from './assetModal/AssetModalFooter';
import { AssetModalHeader } from './assetModal/AssetModalHeader';
import { AssetSearch } from './assetModal/AssetSearch';

export function AssetSelectionModal({
  open,
  onOpenChange,
  onAssetSelect,
  selectedAssets = [],
}: AssetSelectionModalProps) {
  const {
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
    onRetry,
    resetSelection,
  } = useAssetSelection(selectedAssets, open, onAssetSelect, onOpenChange);

  // Filter assets based on search query
  const filteredAssets = useMemo(() => {
    return assets.filter(
      (asset) =>
        asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [assets, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[1300px] max-w-[98vw] w-full p-0 rounded-2xl overflow-hidden shadow-2xl border-0 bg-background/95 backdrop-blur-sm">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* header */}
          <AssetModalHeader
            selectedAssetIds={selectedAssetIds}
            selectedAssetsList={selectedAssetsList}
            onSelectAll={() => handleSelectAll(filteredAssets)}
            onClose={() => handleOpenChange(false)}
            onAssetRemove={handleAssetToggle}
            isLoading={isLoading}
            filteredAssetsCount={filteredAssets.length}
          />

          {/* search bar */}
          <AssetSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isLoading={isLoading}
            filteredAssetsCount={filteredAssets.length}
          />

          {/* asset grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <AssetGrid
              filteredAssets={filteredAssets}
              selectedAssetIds={selectedAssetIds}
              isLoading={isLoading}
              error={error}
              onAssetToggle={handleAssetToggle}
              onRetry={onRetry}
            />
          </div>

          {/* footer actions */}
          <AssetModalFooter
            selectedAssetIds={selectedAssetIds}
            onClear={resetSelection}
            onDone={handleDone}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
