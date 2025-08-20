import { router } from '../../trpc/trpc';
import {
  getOpenInterestForAllAssets,
  getOpenInterestForAsset,
  getOpenInterestForBaskt,
  getTopBasktsWithVolume,
} from './oi';
import { getVolumeForAsset, getVolumeForBaskt } from './volume';

export const metricsRouter = router({
  getOpenInterestForAsset,
  getOpenInterestForBaskt,
  getVolumeForAsset,
  getVolumeForBaskt,
  getOpenInterestForAllAssets,
  getTopBasktsWithVolume
});
export type MetricsRouter = typeof metricsRouter;
