import { useEffect, useState } from 'react';
import { Asset } from '../../../types/asset';
import { AssetWithPosition, CreateBasktFormData } from '../../../types/baskt/creation';
import {
  calculateTotalWeight,
  hasLowWeightAssets,
  isWeightExceeded,
  validateWeightInput,
} from '../../../utils/baskt/baskt';

export function useStep2Assets(
  formData: CreateBasktFormData,
  setFormData: (
    data: CreateBasktFormData | ((prev: CreateBasktFormData) => CreateBasktFormData),
  ) => void,
  onWeightChange: (totalWeight: number, hasLowWeight: boolean) => void,
  onAssetsChange: (assets: Asset[], details: AssetWithPosition[]) => void,
  initialSelectedAssets: Asset[] = [],
  initialAssetDetails: AssetWithPosition[] = [],
) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetDetails, setAssetDetails] = useState<AssetWithPosition[]>(initialAssetDetails);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>(initialSelectedAssets);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  useEffect(() => {
    if (initialSelectedAssets.length > 0) {
      setSelectedAssets(initialSelectedAssets);
    }
    if (initialAssetDetails.length > 0) {
      setAssetDetails(initialAssetDetails);
    }
  }, [initialSelectedAssets, initialAssetDetails]);

  const handleAddAsset = () => {
    setIsModalOpen(true);
  };

  const handleAssetSelect = (selectedAssets: Asset[]) => {
    setSelectedAssets(selectedAssets);

    const assetIds = selectedAssets.map((asset) => asset.ticker);
    const newAssetDetails = selectedAssets.map((asset) => ({
      ticker: asset.ticker,
      position: 'long' as const,
      weight: '',
    }));

    setAssetDetails(newAssetDetails);
    setFormData((prev) => ({
      ...prev,
      assets: assetIds,
    }));

    onAssetsChange(selectedAssets, newAssetDetails);
  };

  const handlePositionChange = (index: number, position: 'long' | 'short') => {
    const updatedDetails = assetDetails.map((asset, i) =>
      i === index ? { ...asset, position } : asset,
    );

    setAssetDetails(updatedDetails);
    onAssetsChange(selectedAssets, updatedDetails);
  };

  const handleWeightChange = (index: number, weight: string) => {
    if (!validateWeightInput(weight)) return;

    const updatedDetails = assetDetails.map((asset, i) =>
      i === index ? { ...asset, weight } : asset,
    );

    setAssetDetails(updatedDetails);
    onAssetsChange(selectedAssets, updatedDetails);
    setShowValidationErrors(false);
  };

  const handleRemoveAsset = (index: number) => {
    setAssetDetails((prev) => prev.filter((_, i) => i !== index));
    setSelectedAssets((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      assets: prev.assets.filter((_, i) => i !== index),
    }));

    const newAssetDetails = assetDetails.filter((_, i) => i !== index);
    const newSelectedAssets = selectedAssets.filter((_, i) => i !== index);
    onAssetsChange(newSelectedAssets, newAssetDetails);
  };

  const totalWeight = calculateTotalWeight(assetDetails);
  const weightExceeded = isWeightExceeded(totalWeight);
  const lowWeightAssets = hasLowWeightAssets(assetDetails);

  useEffect(() => {
    onWeightChange(totalWeight, lowWeightAssets);
  }, [totalWeight, lowWeightAssets, onWeightChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (assetDetails.some((asset) => asset.weight !== '')) {
        setShowValidationErrors(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [assetDetails]);

  return {
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
  };
}
