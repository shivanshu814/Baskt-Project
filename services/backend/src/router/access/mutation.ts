import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { TRPCError } from '@trpc/server';
import { AccessCode, AuthorizedWallet } from '../../utils/models';

// generate random 8-character code
function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// generate new access code
export const generateAccessCodeMutation = publicProcedure
  .input(
    z.object({
      description: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const code = generateAccessCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // check if code already exists (very unlikely but safe)
    const existingCode = await AccessCode.findOne({ code });
    if (existingCode) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Generated code already exists, please try again',
      });
    }

    const accessCode = new AccessCode({
      code,
      isUsed: false,
      createdAt: now,
      expiresAt,
      description: input.description,
    });

    await accessCode.save();

    return {
      code,
      expiresAt: expiresAt.toISOString(),
      message: 'Access code generated successfully',
    };
  });

// validate access code
export const validateAccessCode = publicProcedure
  .input(
    z.object({
      code: z.string().length(8),
      userIdentifier: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    const { code, userIdentifier } = input;
    const accessCode = await AccessCode.findOne({ code: code.toUpperCase() });

    if (!accessCode) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Invalid access code',
      });
    }

    if (accessCode.isUsed) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Access code has already been used',
      });
    }

    if (new Date() > accessCode.expiresAt) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Access code has expired',
      });
    }

    const existingWallet = await AuthorizedWallet.findOne({
      walletAddress: userIdentifier.toLowerCase(),
    });
    if (existingWallet && existingWallet.isActive) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Wallet is already authorized',
      });
    }

    accessCode.isUsed = true;
    accessCode.usedBy = userIdentifier;
    await accessCode.save();

    const authorizedWallet = new AuthorizedWallet({
      walletAddress: userIdentifier.toLowerCase(),
      authorizedAt: new Date(),
      accessCodeUsed: code.toUpperCase(),
      lastLoginAt: new Date(),
      isActive: true,
    });

    await authorizedWallet.save();

    return {
      success: true,
      message: 'Access code validated successfully',
    };
  });

// revoke wallet access
export const revokeWalletAccess = publicProcedure
  .input(
    z.object({
      walletAddress: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    const { walletAddress } = input;

    const authorizedWallet = await AuthorizedWallet.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!authorizedWallet) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wallet not found in authorized list',
      });
    }

    authorizedWallet.isActive = false;
    await authorizedWallet.save();

    return {
      success: true,
      message: 'Wallet access revoked successfully',
    };
  });

// reactivate a wallet (for fixing accidentally deactivated wallets)
export const reactivateWallet = publicProcedure
  .input(
    z.object({
      walletAddress: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    const { walletAddress } = input;

    const authorizedWallet = await AuthorizedWallet.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!authorizedWallet) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wallet not found in authorized list',
      });
    }

    authorizedWallet.isActive = true;
    authorizedWallet.lastLoginAt = new Date();
    await authorizedWallet.save();

    return {
      success: true,
      message: 'Wallet reactivated successfully',
    };
  });

// delete access code
export const deleteAccessCode = publicProcedure
  .input(
    z.object({
      code: z.string().length(8),
    }),
  )
  .mutation(async ({ input }) => {
    const { code } = input;

    const deletedCode = await AccessCode.findOneAndDelete({ code: code.toUpperCase() });

    if (!deletedCode) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Access code not found',
      });
    }

    return {
      success: true,
      message: 'Access code deleted successfully',
    };
  });
