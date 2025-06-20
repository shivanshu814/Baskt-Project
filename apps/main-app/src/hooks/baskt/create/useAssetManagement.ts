import { AssetInfo, BasktAssetInfo } from '@baskt/types';
import { BasktFormData } from './useCreateBasktForm';
import { toast } from 'sonner';

export const useAssetManagement = (
  formData: BasktFormData,
  setFormData: (data: BasktFormData) => void,
) => {
  const handleAddAsset = (asset: AssetInfo) => {
    if (formData.assets.some((a) => a.assetAddress === asset.assetAddress)) {
      toast.error(`${asset.ticker} has already been added to your Baskt.`);
      return;
    }

    const newAsset: BasktAssetInfo = {
      ...asset,
      weight: 0,
      direction: true,
    };

    setFormData({
      ...formData,
      assets: [...formData.assets, newAsset],
    });
  };

  const handleRemoveAsset = (assetticker: string) => {
    setFormData({
      ...formData,
      assets: formData.assets.filter((asset) => asset.ticker !== assetticker),
    });
  };

  const handleAssetPositionChange = (assetticker: string, position: 'long' | 'short') => {
    setFormData({
      ...formData,
      assets: formData.assets.map((asset) =>
        asset.ticker === assetticker ? { ...asset, direction: position === 'long' } : asset,
      ),
    });
  };

  const handleAssetWeightChange = (assetticker: string, input: string) => {
    const weight = parseFloat(input) || 0;
    setFormData({
      ...formData,
      assets: formData.assets.map((asset) =>
        asset.ticker === assetticker ? { ...asset, weight } : asset,
      ),
    });
  };

  const totalWeightage = formData.assets.reduce((sum, asset) => sum + asset.weight, 0);

  return {
    handleAddAsset,
    handleRemoveAsset,
    handleAssetPositionChange,
    handleAssetWeightChange,
    totalWeightage,
  };
};
