import { router } from '../../trpc/trpc';
import { getOpenInterestForAsset, getOpenInterestForBaskt } from './oi';
import { getVolumeForAsset, getVolumeForBaskt } from './volume';

export const metricsRouter = router({
  getOpenInterestForAsset,
  getOpenInterestForBaskt,
  getVolumeForAsset,
  getVolumeForBaskt,
});
export type MetricsRouter = typeof metricsRouter;
