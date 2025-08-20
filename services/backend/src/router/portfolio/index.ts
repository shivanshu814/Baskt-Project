/** @format */

import { router } from '../../trpc/trpc';
import { getPortfolioData } from './query';

export const portfolioRouter = router({
  getPortfolioData: getPortfolioData,
});