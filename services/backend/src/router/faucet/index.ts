import { router } from '../../trpc/trpc';
import { faucet, autoFaucet } from './mutation';

export const faucetRouter = router({
  faucet,
  autoFaucet,
});
