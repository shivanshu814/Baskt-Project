import { router } from '../../trpc/trpc';
import {
  getOpenInterestForAllAssets,
  getOpenInterestForAsset,
  getOpenInterestForBaskt,
  getOpenInterestForBasktsWithPositions,
} from './oi';
import { getVolumeForAsset, getVolumeForBaskt } from './volume';

export const metricsRouter = router({
  getOpenInterestForAsset,
  getOpenInterestForBaskt,
  getVolumeForAsset,
  getVolumeForBaskt,
  getOpenInterestForAllAssets,
  getOpenInterestForBasktsWithPositions,
});
export type MetricsRouter = typeof metricsRouter;
