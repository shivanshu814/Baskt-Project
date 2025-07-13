import { QueryResult } from '../models/types';

/**
 * Wallet access check result
 */
export interface WalletAccessResult {
  hasAccess: boolean;
  message: string;
  authorizedAt?: string;
  accessCodeUsed?: string;
  lastLoginAt?: string;
}

/**
 * Authorized wallet data
 */
export interface AuthorizedWallet {
  id: string;
  walletAddress: string;
  authorizedAt: string;
  accessCodeUsed: string;
  lastLoginAt?: string;
  isActive: boolean;
}

/**
 * Access code data
 */
export interface AccessCode {
  code: string;
  isUsed: boolean;
  usedBy?: string;
  createdAt: string;
  expiresAt: string;
  description?: string;
}

/**
 * Access code creation parameters
 */
export interface CreateAccessCodeParams {
  code: string;
  description?: string;
  expiresAt?: Date;
}

/**
 * Access code creation result
 */
export interface CreateAccessCodeResult {
  success: boolean;
  data?: {
    code: string;
    description?: string;
    expiresAt: string;
  };
  error?: string;
}

/**
 * Access code usage parameters
 */
export interface UseAccessCodeParams {
  code: string;
  walletAddress: string;
}

/**
 * Access code usage result
 */
export interface UseAccessCodeResult {
  success: boolean;
  data?: {
    walletAddress: string;
    authorizedAt: string;
    accessCodeUsed: string;
  };
  error?: string;
}

/**
 * Wallet access check parameters
 */
export interface CheckWalletAccessParams {
  walletAddress: string;
}

/**
 * Authorized wallets query result
 */
export interface AuthorizedWalletsResult {
  success: boolean;
  data?: AuthorizedWallet[];
  error?: string;
}

/**
 * Access codes query result
 */
export interface AccessCodesResult {
  success: boolean;
  data?: AccessCode[];
  error?: string;
}

/**
 * Access analytics
 */
export interface AccessAnalytics {
  totalWallets: number;
  activeWallets: number;
  totalAccessCodes: number;
  usedAccessCodes: number;
  availableAccessCodes: number;
  expiredAccessCodes: number;
  recentAuthorizations: number;
  recentLogins: number;
  authorizationRate: number;
  accessCodeUsageRate: number;
}

/**
 * Access activity log
 */
export interface AccessActivity {
  id: string;
  walletAddress: string;
  action: 'authorize' | 'login' | 'code_create' | 'code_use';
  timestamp: Date;
  details?: {
    accessCode?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

/**
 * Access permissions
 */
export interface AccessPermissions {
  canCreateCodes: boolean;
  canViewWallets: boolean;
  canRevokeAccess: boolean;
  canViewAnalytics: boolean;
  isAdmin: boolean;
} 