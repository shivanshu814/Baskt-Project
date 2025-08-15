'use client';

import { AssetGridProps } from '../../../types/asset';
import { AssetCard } from './AssetCard';
import { AssetSkeleton } from './AssetSkeleton';

export const AssetGrid = ({
  filteredAssets,
  selectedAssetIds,
  isLoading,
  error,
  onAssetToggle,
  onRetry,
}: AssetGridProps) => {
  const isLimitReached = selectedAssetIds.size >= 10;
  // loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <AssetSkeleton key={index} />
        ))}
      </div>
    );
  }

  // error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">Error loading assets</div>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
        >
          Retry
        </button>
      </div>
    );
  }

  // asset grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredAssets.map((asset) => (
        <AssetCard
          key={asset._id}
          asset={asset}
          isSelected={selectedAssetIds.has(asset._id!)}
          onToggle={onAssetToggle}
          isLimitReached={isLimitReached}
        />
      ))}
    </div>
  );
};
