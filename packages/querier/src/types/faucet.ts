import { QueryResult } from '../models/types';

/**
 * Faucet operation result
 */
export interface FaucetResult {
  success: boolean;
  signature?: string;
  error?: string;
}

/**
 * Auto faucet operation result
 */
export interface AutoFaucetResult {
  success: boolean;
  signature?: string;
  amount?: number;
  error?: string;
}

/**
 * Faucet status and configuration
 */
export interface FaucetStatus {
  isEnabled: boolean;
  maxAmount: number;
  autoAmount: number;
  usdcMint: string;
}

/**
 * Faucet send parameters
 */
export interface FaucetSendParams {
  recipient: string;
  amount: number;
}

/**
 * Auto faucet parameters
 */
export interface AutoFaucetParams {
  recipient: string;
}

/**
 * Faucet transaction history
 */
export interface FaucetTransaction {
  id: string;
  recipient: string;
  amount: number;
  signature: string;
  timestamp: Date;
  type: 'manual' | 'auto';
  status: 'pending' | 'confirmed' | 'failed';
}

/**
 * Faucet analytics
 */
export interface FaucetAnalytics {
  totalTransactions: number;
  totalAmount: number;
  totalRecipients: number;
  dailyTransactions: number;
  dailyAmount: number;
  averageAmount: number;
  successRate: number;
}

/**
 * Faucet rate limit info
 */
export interface FaucetRateLimit {
  recipient: string;
  lastRequest: Date;
  requestCount: number;
  cooldownUntil?: Date;
  isLimited: boolean;
} 