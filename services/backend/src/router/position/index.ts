/** @format */

import { router } from '../../trpc/trpc';
import { createPosition, closePosition } from './mutation';
import {
  getPositions,
  getLongOpenInterestForAsset,
  getShortOpenInterestForAsset,
  getTotalOpenInterestForAsset,
  getAssetVolume,
  getHistoricalOpenInterest,
  getHistoricalVolume,
  getLongOpenInterestForBaskt,
  getShortOpenInterestForBaskt,
  getTotalOpenInterestForBaskt,
} from './query';

export const positionRouter = router({
  createPosition: createPosition,
  closePosition: closePosition,
  getPositions: getPositions,
  getLongOpenInterestForAsset: getLongOpenInterestForAsset,
  getShortOpenInterestForAsset: getShortOpenInterestForAsset,
  getTotalOpenInterestForAsset: getTotalOpenInterestForAsset,
  getAssetVolume: getAssetVolume,
  getHistoricalOpenInterest: getHistoricalOpenInterest,
  getHistoricalVolume: getHistoricalVolume,
  getLongOpenInterestForBaskt: getLongOpenInterestForBaskt,
  getShortOpenInterestForBaskt: getShortOpenInterestForBaskt,
  getTotalOpenInterestForBaskt: getTotalOpenInterestForBaskt,
});
