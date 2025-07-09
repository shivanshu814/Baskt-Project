import { router } from '../../trpc/trpc';
import {
  getAllAssets,
  getAllAssetsWithConfig,
  getAssetsByAddress,
  getAssetPerformanceStats,
} from './query';
import { createAsset, updateAssetBasktIds, updateAssetPriceConfig, deleteAsset } from './mutation';

export const assetRouter = router({
  getAllAssets,
  getAllAssetsWithConfig,
  getAssetsByAddress,
  getAssetPerformanceStats,
  createAsset,
  updateAssetBasktIds,
  updateAssetPriceConfig,
  deleteAsset,
});
