'use client';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@baskt/ui';
import { AssetPriceHistoryPage } from './AssetPriceHistory';
import { useAssets } from '../../hooks/assets/useAssets';
import { AssetTable } from '../assets/AssetTable';
import { ASSET_TABLE_CONFIG } from '../../config/assets';
import { Asset } from '../../types/assets';
import { EditAssetDialog } from '../assets/EditAssetDialog';
import { DeleteAssetDialog } from '../assets/DeleteAssetDialog';
import { useMemo } from 'react';

export function AdminAssetsList() {
  const {
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
  } = useAssets();

  // Calculate asset counts
  const assetCounts = useMemo(() => {
    const total = assets.length;
    const listed = assets.filter((asset: Asset) => asset.account.isActive).length;
    return { total, listed };
  }, [assets]);

  const renderPriceHistory = (asset: Asset) => (
    <AssetPriceHistoryPage
      assetAddress={asset._id.toString()}
      assetName={asset.name || asset.ticker}
      assetLogo={asset.logo}
      ticker={asset.ticker}
      onBack={handleBack}
    />
  );

  const renderError = () => (
    <div className="p-4 bg-red-500/10 border-b border-red-500/20">
      <p className="text-red-500 text-sm">{error?.message}</p>
    </div>
  );

  const renderTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          {ASSET_TABLE_CONFIG.map((header) => (
            <TableHead key={header.id} className="whitespace-nowrap">
              {header.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <AssetTable
          assets={assets}
          isLoading={isLoading}
          onViewPrices={handleViewPrices}
          onEdit={handleOpenEditDialog}
          onDelete={handleOpenDeleteDialog}
        />
      </TableBody>
    </Table>
  );

  if (selectedAsset) {
    return renderPriceHistory(selectedAsset);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mt-2 text-2xl font-bold text-white">Assets ({assetCounts.total})</h2>
          <p className="text-white/60 mt-1">Manage and monitor all assets in the system</p>
        </div>
      </div>

      <div className="rounded-md border border-white/10">
        {error && renderError()}
        {renderTable()}
      </div>
      <EditAssetDialog
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        onSave={handleUpdateAsset}
        asset={assetToModify}
      />
      <DeleteAssetDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteAsset}
        asset={assetToModify}
      />
    </div>
  );
}
