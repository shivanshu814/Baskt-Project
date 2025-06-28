import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { AccessCode, AuthorizedWallet } from '../../utils/models';

// check if wallet is authorized
export const checkWalletAccess = publicProcedure
  .input(
    z.object({
      walletAddress: z.string(),
    }),
  )
  .query(async ({ input }) => {
    const { walletAddress } = input;

    const authorizedWallet = await AuthorizedWallet.findOne({
      walletAddress: walletAddress.toLowerCase(),
      isActive: true,
    });

    if (!authorizedWallet) {
      return {
        hasAccess: false,
        message: 'Wallet not authorized',
      };
    }

    // Update last login time
    authorizedWallet.lastLoginAt = new Date();
    await authorizedWallet.save();

    return {
      hasAccess: true,
      authorizedAt: authorizedWallet.authorizedAt.toISOString(),
      accessCodeUsed: authorizedWallet.accessCodeUsed,
      lastLoginAt: authorizedWallet.lastLoginAt?.toISOString(),
      message: 'Wallet is authorized',
    };
  });

// get all authorized wallets (for admin)
export const getAuthorizedWallets = publicProcedure.query(async () => {
  const wallets = await AuthorizedWallet.find({ isActive: true }).sort({ authorizedAt: -1 }).lean();

  return wallets.map((wallet: any) => ({
    id: wallet._id,
    walletAddress: wallet.walletAddress,
    authorizedAt: wallet.authorizedAt.toISOString(),
    accessCodeUsed: wallet.accessCodeUsed,
    lastLoginAt: wallet.lastLoginAt?.toISOString(),
    isActive: wallet.isActive,
  }));
});

// get all access codes (for admin)
export const getAllAccessCodes = publicProcedure.query(async () => {
  const codes = await AccessCode.find().sort({ createdAt: -1 }).lean();

  return codes.map((code: any) => ({
    code: code.code,
    isUsed: code.isUsed,
    usedBy: code.usedBy,
    createdAt: code.createdAt.toISOString(),
    expiresAt: code.expiresAt.toISOString(),
    description: code.description,
  }));
});
