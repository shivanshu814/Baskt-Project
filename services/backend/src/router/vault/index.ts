import { router } from '../../trpc/trpc';
import { getVaultData } from './query';

export const vaultRouter = router({
  getVaultData,
});

export type VaultRouter = typeof vaultRouter;
