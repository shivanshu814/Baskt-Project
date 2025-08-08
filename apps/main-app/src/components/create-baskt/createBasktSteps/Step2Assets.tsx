'use client';

import { Button, NumberFormat } from '@baskt/ui';
import { Plus, X } from 'lucide-react';
import { useStep2Assets } from '../../../hooks/create-baskt/steps/use-step-2-assets';
import { Step2AssetsProps } from '../../../types/baskt/creation';
import { AssetLogo } from '../assetModal/AssetLogo';
import { AssetSelectionModal } from '../AssetSelectionModal';

export function Step2Assets({
  formData,
  setFormData,
  onWeightChange,
  onAssetsChange,
  selectedAssets: initialSelectedAssets = [],
  assetDetails: initialAssetDetails = [],
}: Step2AssetsProps) {
  const {
    isModalOpen,
    setIsModalOpen,
    assetDetails,
    selectedAssets,
    showValidationErrors,
    totalWeight,
    weightExceeded,
    lowWeightAssets,
    handleAddAsset,
    handleAssetSelect,
    handlePositionChange,
    handleWeightChange,
    handleRemoveAsset,
  } = useStep2Assets(
    formData,
    setFormData,
    onWeightChange,
    onAssetsChange,
    initialSelectedAssets,
    initialAssetDetails,
  );

  return (
    <>
      {/* no assets */}
      {formData.assets.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4">
          <div className="text-xl sm:text-2xl font-bold mb-2">No Assets</div>
          <div className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
            No assets added yet. Click "Add Asset" to start building your baskt.
          </div>
          <Button
            className="w-full bg-primary text-white hover:bg-primary/80"
            onClick={handleAddAsset}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Assets
          </Button>
        </div>
      ) : (
        // assets table
        <div className="space-y-4 sm:space-y-6">
          {/* header section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Selected Assets</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {formData.assets.length} asset{formData.assets.length !== 1 ? 's' : ''} selected
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="text-xs sm:text-sm">
                <span className="text-muted-foreground">Total Weight: </span>
                <span
                  className={`font-semibold ${weightExceeded ? 'text-red-500' : 'text-green-500'}`}
                >
                  {totalWeight.toFixed(2)}%
                </span>
              </div>
              <Button
                onClick={handleAddAsset}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Add More Assets</span>
                <span className="sm:hidden">Add Assets</span>
              </Button>
            </div>
          </div>

          {/* weight error messages */}
          {showValidationErrors && weightExceeded && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-red-500 font-medium">
                  Total weight cannot exceed 100%. Current total: {totalWeight.toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          {/* low weight assets */}
          {showValidationErrors && lowWeightAssets && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-orange-500 font-medium">
                  Each asset must have at least 5% weight. Please increase weights for assets with
                  less than 5%.
                </span>
              </div>
            </div>
          )}

          {/* assets table */}
          <div className="border border-border/30 rounded-lg bg-card/30">
            {/* table header - hidden on mobile */}
            <div className="hidden sm:grid sm:grid-cols-5 gap-4 p-4 border-b border-border/30 bg-card/50">
              <div className="font-semibold text-sm">Asset</div>
              <div className="font-semibold text-sm">Price</div>
              <div className="whitespace-nowrap font-semibold text-sm">Weight %</div>
              <div className="font-semibold text-sm">Position</div>
              <div className="font-semibold text-sm text-right">Action</div>
            </div>

            {/* assets table body */}
            <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
              {assetDetails.map((asset, index) => {
                const selectedAsset = selectedAssets.find((sa) => sa.ticker === asset.ticker);

                return (
                  <div key={index} className="p-3 sm:p-4">
                    {/* mobile layout */}
                    <div className="sm:hidden space-y-3">
                      {/* asset info row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <AssetLogo
                            ticker={asset.ticker}
                            logo={selectedAsset?.logo || ''}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm truncate">{asset.ticker}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {selectedAsset?.name || 'Asset'}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAsset(index)}
                          className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* price and weight row */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm">
                          <span className="text-muted-foreground text-xs">Price: </span>
                          {selectedAsset ? (
                            <NumberFormat
                              value={selectedAsset.price}
                              isPrice={true}
                              showCurrency={true}
                            />
                          ) : (
                            '$0.00'
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Weight:</span>
                          <input
                            type="text"
                            placeholder="0.00"
                            value={asset.weight}
                            onChange={(e) => handleWeightChange(index, e.target.value)}
                            className={`bg-muted/30 rounded px-2 py-1 text-sm w-16 text-center border border-border/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground/60 placeholder:text-xs ${
                              weightExceeded ? 'focus:ring-red-500/50 focus:border-red-500/50' : ''
                            }`}
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </div>

                      {/* position row */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePositionChange(index, 'long')}
                          className={`h-7 px-3 text-xs flex-1 ${
                            asset.position === 'long'
                              ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                              : 'text-muted-foreground'
                          }`}
                        >
                          Long
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePositionChange(index, 'short')}
                          className={`h-7 px-3 text-xs flex-1 ${
                            asset.position === 'short'
                              ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                              : 'text-muted-foreground'
                          }`}
                        >
                          Short
                        </Button>
                      </div>
                    </div>

                    {/* desktop layout */}
                    <div className="hidden sm:grid sm:grid-cols-5 gap-4 items-center">
                      {/* asset column */}
                      <div className="flex items-center gap-3">
                        <AssetLogo
                          ticker={asset.ticker}
                          logo={selectedAsset?.logo || ''}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm truncate">{asset.ticker}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {selectedAsset?.name || 'Asset'}
                          </div>
                        </div>
                      </div>

                      {/* price column */}
                      <div className="text-sm">
                        {selectedAsset ? (
                          <NumberFormat
                            value={selectedAsset.price}
                            isPrice={true}
                            showCurrency={true}
                          />
                        ) : (
                          '$0.00'
                        )}
                      </div>

                      {/* weight column */}
                      <div className="flex items-center">
                        <input
                          type="text"
                          placeholder="0.00"
                          value={asset.weight}
                          onChange={(e) => handleWeightChange(index, e.target.value)}
                          className={`bg-muted/30 rounded px-3 py-2 text-sm w-20 text-center border border-border/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground/60 placeholder:text-xs ${
                            weightExceeded ? 'focus:ring-red-500/50 focus:border-red-500/50' : ''
                          }`}
                        />
                      </div>

                      {/* position column */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePositionChange(index, 'long')}
                          className={`h-7 px-2 text-xs ${
                            asset.position === 'long'
                              ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                              : 'text-muted-foreground'
                          }`}
                        >
                          Long
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePositionChange(index, 'short')}
                          className={`h-7 px-2 text-xs ${
                            asset.position === 'short'
                              ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                              : 'text-muted-foreground'
                          }`}
                        >
                          Short
                        </Button>
                      </div>

                      {/* action column */}
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAsset(index)}
                          className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* asset selection modal */}
      <AssetSelectionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAssetSelect={handleAssetSelect}
        selectedAssets={selectedAssets}
      />
    </>
  );
}
