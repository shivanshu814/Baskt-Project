import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { TRPCError } from '@trpc/server';
import { querier } from '../../utils/';

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
    const existingCode = await querier.metadata.findAccessCode(code);
    if (existingCode) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Generated code already exists, please try again',
      });
    }

    const result = await querier.access.createAccessCode({
      code,
      description: input.description,
      expiresAt,
    });

    if (!result.success) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: result.error || 'Failed to create access code',
      });
    }

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

    const result = await querier.access.useAccessCode({
      code: code.toUpperCase(),
      walletAddress: userIdentifier.toLowerCase(),
    });

    if (!result.success) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: result.error || 'Failed to validate access code',
      });
    }

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

    const authorizedWallet = await querier.metadata.findAuthorizedWallet(
      walletAddress.toLowerCase(),
    );

    if (!authorizedWallet) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wallet not found in authorized list',
      });
    }

    await querier.metadata.updateAuthorizedWallet(walletAddress.toLowerCase(), {
      isActive: false,
    });

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

    const authorizedWallet = await querier.metadata.findAuthorizedWallet(
      walletAddress.toLowerCase(),
    );

    if (!authorizedWallet) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wallet not found in authorized list',
      });
    }

    await querier.metadata.updateAuthorizedWallet(walletAddress.toLowerCase(), {
      isActive: true,
      lastLoginAt: new Date(),
    });

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

    const deletedCode = await querier.metadata.deleteAccessCode(code.toUpperCase());

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
