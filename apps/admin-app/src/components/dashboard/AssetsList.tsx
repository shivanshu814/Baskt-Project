'use client';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@baskt/ui';
import { AssetPriceHistoryPage } from './AssetPriceHistory';
import { useAssets } from '../../hooks/assets/useAssets';
import { AssetTable } from '../assets/AssetTable';
import { ASSET_TABLE_CONFIG } from '../../config/assets';
import { Asset } from '../../types/assets';
import { EditAssetDialog } from '../assets/EditAssetDialog';
import { DeleteAssetDialog } from '../assets/DeleteAssetDialog';

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
            <TableHead key={header.id}>{header.label}</TableHead>
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
    <>
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
    </>
  );
}
