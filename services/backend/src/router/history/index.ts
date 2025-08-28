import { router } from '../../trpc/trpc';
import { getHistory } from './query';
import { getPositionHistory } from './position';

export const historyRouter = router({
  getHistory,
  getPositionHistory,
});
