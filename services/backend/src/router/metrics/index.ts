import { router } from '../../trpc/trpc';
import {
  getOpenInterestForBaskt,
} from './oi';
import {  getVolumeForBaskt } from './volume';

export const metricsRouter = router({
  getOpenInterestForBaskt,
  getVolumeForBaskt,
});
export type MetricsRouter = typeof metricsRouter;
