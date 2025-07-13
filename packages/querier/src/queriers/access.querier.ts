import { metadataManager } from '../models/metadata-manager';
import { 
  WalletAccessResult, 
  AuthorizedWalletsResult, 
  AccessCodesResult, 
  CreateAccessCodeParams, 
  CreateAccessCodeResult, 
  UseAccessCodeParams, 
  UseAccessCodeResult, 
  CheckWalletAccessParams 
} from '../types/access';

/**
 * AccessQuerier
 *
 * This class is responsible for checking wallet access, fetching authorized wallets, and managing access codes.
 * It is used to check if a wallet is authorized to use the application and to fetch authorized wallets and access codes.
 */

export class AccessQuerier {
  // check if a wallet is authorized to use the application
  async checkWalletAccess(params: CheckWalletAccessParams): Promise<WalletAccessResult> {
    try {
      const { walletAddress } = params;

      const authorizedWallet = await metadataManager.findAuthorizedWallet(
        walletAddress.toLowerCase(),
      );

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
    } catch (error) {
      console.error('Error checking wallet access:', error);
      return {
        hasAccess: false,
        message: 'Error checking wallet access',
      };
    }
  }

  // get all authorized wallets
  async getAuthorizedWallets(): Promise<AuthorizedWalletsResult> {
    try {
      const wallets = await metadataManager.getAllAuthorizedWallets();

      const formattedWallets = wallets.map((wallet: any) => ({
        id: wallet._id,
        walletAddress: wallet.walletAddress,
        authorizedAt: wallet.authorizedAt.toISOString(),
        accessCodeUsed: wallet.accessCodeUsed,
        lastLoginAt: wallet.lastLoginAt?.toISOString(),
        isActive: wallet.isActive,
      }));

      return {
        success: true,
        data: formattedWallets,
      };
    } catch (error) {
      console.error('Error fetching authorized wallets:', error);
      return {
        success: false,
        error: 'Failed to fetch authorized wallets',
      };
    }
  }

  // get all access codes
  async getAllAccessCodes(): Promise<AccessCodesResult> {
    try {
      const codes = await metadataManager.getAllAccessCodes();

      const formattedCodes = codes.map((code: any) => ({
        code: code.code,
        isUsed: code.isUsed,
        usedBy: code.usedBy,
        createdAt: code.createdAt.toISOString(),
        expiresAt: code.expiresAt.toISOString(),
        description: code.description,
      }));

      return {
        success: true,
        data: formattedCodes,
      };
    } catch (error) {
      console.error('Error fetching access codes:', error);
      return {
        success: false,
        error: 'Failed to fetch access codes',
      };
    }
  }

  // create an access code
  async createAccessCode(params: CreateAccessCodeParams): Promise<CreateAccessCodeResult> {
    try {
      const { code, description, expiresAt } = params;

      const newCode = await metadataManager.createAccessCode({
        code,
        description,
        expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      });

      return {
        success: true,
        data: {
          code: newCode.code,
          description: newCode.description,
          expiresAt: newCode.expiresAt.toISOString(),
        },
      };
    } catch (error) {
      console.error('Error creating access code:', error);
      return {
        success: false,
        error: 'Failed to create access code',
      };
    }
  }

  // use an access code
  async useAccessCode(params: UseAccessCodeParams): Promise<UseAccessCodeResult> {
    try {
      const { code, walletAddress } = params;

      const result = await metadataManager.useAccessCode(code, walletAddress.toLowerCase());

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to use access code',
        };
      }

      return {
        success: true,
        data: {
          walletAddress: result.data.walletAddress,
          authorizedAt: result.data.authorizedAt.toISOString(),
          accessCodeUsed: result.data.accessCodeUsed,
        },
      };
    } catch (error) {
      console.error('Error using access code:', error);
      return {
        success: false,
        error: 'Failed to use access code',
      };
    }
  }
}
