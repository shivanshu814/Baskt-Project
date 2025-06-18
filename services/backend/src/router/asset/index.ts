import { router } from '../../trpc/trpc';
import { getAllAssets, getAllAssetsWithConfig, getAssetsByAddress } from './query';
import { createAsset, updateAssetBasktIds } from './mutation';

export const assetRouter = router({
  getAllAssets,
  getAllAssetsWithConfig,
  getAssetsByAddress,
  createAsset,
  updateAssetBasktIds,
});
