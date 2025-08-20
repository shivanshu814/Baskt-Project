import { router } from '../../trpc/trpc';
import {
  getAllAssets,
  getAssetsByAddress,
} from './query';
import { createAsset,  updateAssetPriceConfig, deleteAsset } from './mutation';

export const assetRouter = router({
  getAllAssets,
  getAssetsByAddress,
  createAsset,
  updateAssetPriceConfig,
  deleteAsset,
});
