/** @format */

import { router } from '../../trpc/trpc';
import { createPosition, closePosition } from './mutation';
import { getPositions } from './query';

export const positionRouter = router({
  createPosition: createPosition,
  closePosition: closePosition,
  getPositions: getPositions,
});
