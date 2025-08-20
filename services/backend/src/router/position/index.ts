/** @format */

import { router } from '../../trpc/trpc';
import { getPositionByAssetId, getPositions } from './query';

export const positionRouter = router({
  getPositions: getPositions,
  getPositionByAssetId: getPositionByAssetId,
});
