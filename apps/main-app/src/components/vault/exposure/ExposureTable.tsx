'use client';
import React, { useMemo } from 'react';
import { AssetExposure, ExposureTableProps } from '../../../types/vault';
import { AssetExposureRow } from './AssetExposureRow';
import { EmptyState } from './EmptyState';
import { TableHeader } from './TableHeader';

export const ExposureTable = React.memo<ExposureTableProps>(({ assetExposureData }) => {
  const tableContent = useMemo(() => {
    if (assetExposureData.length === 0) {
      return <EmptyState />;
    }

    return (
      <table className="min-w-full text-foreground/90 text-sm rounded-xs overflow-hidden">
        <TableHeader />
        <tbody>
          {assetExposureData.map((asset: AssetExposure) => (
            <AssetExposureRow key={asset.ticker || asset.name || 'unknown'} asset={asset} />
          ))}
        </tbody>
      </table>
    );
  }, [assetExposureData]);

  return (
    <div className="mt-4">
      <div className="overflow-x-auto">{tableContent}</div>
    </div>
  );
});

ExposureTable.displayName = 'ExposureTable';
