import { router } from '../../trpc/trpc';
import {
  getOpenInterestForAllAssets,
} from './oi';

export const metricsRouter = router({
  getOpenInterestForAllAssets,
});

export type MetricsRouter = typeof metricsRouter;
