import { router } from '../../trpc/trpc';
import {
  getAllAssets,
  getAssetsByAddress,
  getAssetPerformanceStats,
} from './query';
import { createAsset, updateAssetBasktIds, updateAssetPriceConfig, deleteAsset } from './mutation';

export const assetRouter = router({
  getAllAssets,
  getAssetsByAddress,
  getAssetPerformanceStats,
  createAsset,
  updateAssetBasktIds,
  updateAssetPriceConfig,
  deleteAsset,
});
