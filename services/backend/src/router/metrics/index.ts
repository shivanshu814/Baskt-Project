import { router } from '../../trpc/trpc';
import {
  getOpenInterestForAsset,
  getOpenInterestForBaskt,
  getOpenInterestForAllAssets,
} from './oi';
import { getVolumeForAsset, getVolumeForBaskt } from './volume';

export const metricsRouter = router({
  getOpenInterestForAsset,
  getOpenInterestForBaskt,
  getVolumeForAsset,
  getVolumeForBaskt,
  getOpenInterestForAllAssets,
});
export type MetricsRouter = typeof metricsRouter;
