import { router } from '../../trpc/trpc';
import { checkWalletAccess, getAuthorizedWallets, getAllAccessCodes } from './query';
import {
  generateAccessCodeMutation,
  validateAccessCode,
  revokeWalletAccess,
  reactivateWallet,
  deleteAccessCode,
} from './mutation';

export const accessRouter = router({
  checkWalletAccess,
  getAuthorizedWallets,
  getAll: getAllAccessCodes,
  generate: generateAccessCodeMutation,
  validate: validateAccessCode,
  revokeWalletAccess,
  reactivateWallet,
  delete: deleteAccessCode,
});
