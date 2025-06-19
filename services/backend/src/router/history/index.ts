import { router } from '../../trpc/trpc';
import { getHistory } from './query';

export const historyRouter = router({
  getHistory,
});
