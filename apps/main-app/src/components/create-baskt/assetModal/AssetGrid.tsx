'use client';

import { AssetGridProps } from '../../../types/asset';
import { ErrorState } from '../errorState/ErrorState';
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
    return <ErrorState error={error} onRetry={onRetry} />;
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
        />
      ))}
    </div>
  );
};
