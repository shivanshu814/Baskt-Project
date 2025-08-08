/** @format */

import { router } from '../../trpc/trpc';
import { closePosition, createPosition, partialClosePosition } from './mutation';
import { getPositions } from './query';

export const positionRouter = router({
  createPosition: createPosition,
  closePosition: closePosition,
  partialClosePosition: partialClosePosition,
  getPositions: getPositions,
});
