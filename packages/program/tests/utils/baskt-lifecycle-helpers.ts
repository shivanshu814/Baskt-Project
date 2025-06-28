import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { TestClient } from './test-client';
import { OnchainAssetConfig } from '@baskt/types';

/**
 * Baskt lifecycle state options
 */
export type BasktLifecycleState = 'pending' | 'active' | 'decommissioning' | 'settled' | 'closed';

// Note: bootstrapBaskt function removed as it's not used by current tests
// Individual test files use createTestBasktWithAssets for better control

// verifyBasktStatus function removed - use specific validation functions instead

/**
 * Comprehensive validation for Pending status
 */
export function validateBasktPending(status: any): {
  isValid: boolean;
  details?: {};
  errors?: string[];
} {
  const errors: string[] = [];
  
  if (!status.pending || Object.keys(status.pending).length !== 0) {
    return { isValid: false, errors: ['Status is not pending or has unexpected properties'] };
  }
  
  return {
    isValid: true,
    details: {}
  };
}

/**
 * Comprehensive validation for Active status
 */
export function validateBasktActive(status: any): {
  isValid: boolean;
  details?: {};
  errors?: string[];
} {
  const errors: string[] = [];
  
  if (!status.active || Object.keys(status.active).length !== 0) {
    return { isValid: false, errors: ['Status is not active or has unexpected properties'] };
  }
  
  return {
    isValid: true,
    details: {}
  };
}

/**
 * Comprehensive validation for Decommissioning status
 */
export function validateBasktDecommissioning(status: any, expectedInitiatedAt?: number, gracePeriod?: number): {
  isValid: boolean;
  details?: { initiatedAt: number; gracePeriodEnd: number };
  errors?: string[];
} {
  const errors: string[] = [];

  if (!status.decommissioning) {
    return { isValid: false, errors: ['Status is not decommissioning'] };
  }

  const details = {
    initiatedAt: status.decommissioning.initiatedAt?.toNumber?.() || status.decommissioning.initiatedAt,
    gracePeriodEnd: status.decommissioning.gracePeriodEnd?.toNumber?.() || status.decommissioning.gracePeriodEnd
  };

  // Validate timestamps are reasonable
  const now = Math.floor(Date.now() / 1000);
  if (details.initiatedAt > now + 60) { // Allow 1 minute clock skew
    errors.push('Initiated timestamp is in the future');
  }

  if (details.gracePeriodEnd <= details.initiatedAt) {
    errors.push('Grace period end must be after initiation');
  }

  // Validate expected values if provided
  if (expectedInitiatedAt && Math.abs(details.initiatedAt - expectedInitiatedAt) > 5) {
    errors.push(`Initiated timestamp mismatch: expected ~${expectedInitiatedAt}, got ${details.initiatedAt}`);
  }

  if (gracePeriod && Math.abs((details.gracePeriodEnd - details.initiatedAt) - gracePeriod) > 1) {
    errors.push(`Grace period mismatch: expected ${gracePeriod}s, got ${details.gracePeriodEnd - details.initiatedAt}s`);
  }

  return {
    isValid: errors.length === 0,
    details,
    errors: errors.length > 0 ? errors : undefined
  };
}

// getDecommissioningDetails function removed - use validateBasktDecommissioning instead

/**
 * Comprehensive validation for Settled status
 */
export function validateBasktSettled(status: any, expectedPrice?: any, expectedFundingIndex?: any): {
  isValid: boolean;
  details?: { settlementPrice: any; settlementFundingIndex: any; settledAt: number };
  errors?: string[];
} {
  const errors: string[] = [];

  if (!status.settled) {
    return { isValid: false, errors: ['Status is not settled'] };
  }

  const details = {
    settlementPrice: status.settled.settlementPrice,
    settlementFundingIndex: status.settled.settlementFundingIndex,
    settledAt: status.settled.settledAt?.toNumber?.() || status.settled.settledAt
  };

  // Validate settlement price is reasonable
  if (!details.settlementPrice || details.settlementPrice.lte(new BN(0))) {
    errors.push('Settlement price must be positive');
  }

  // Validate timestamp is recent
  const now = Math.floor(Date.now() / 1000);
  if (details.settledAt > now + 60) {
    errors.push('Settled timestamp is in the future');
  }

  // Validate expected values if provided
  if (expectedPrice && !details.settlementPrice.eq(expectedPrice)) {
    errors.push(`Settlement price mismatch: expected ${expectedPrice.toString()}, got ${details.settlementPrice.toString()}`);
  }

  if (expectedFundingIndex && !details.settlementFundingIndex.eq(expectedFundingIndex)) {
    errors.push(`Settlement funding index mismatch: expected ${expectedFundingIndex.toString()}, got ${details.settlementFundingIndex.toString()}`);
  }

  return {
    isValid: errors.length === 0,
    details,
    errors: errors.length > 0 ? errors : undefined
  };
}

// getSettlementDetails function removed - use validateBasktSettled instead

/**
 * Comprehensive validation for Closed status
 */
export function validateBasktClosed(status: any, expectedFinalNav?: any): {
  isValid: boolean;
  details?: { finalNav: any; closedAt: number };
  errors?: string[];
} {
  const errors: string[] = [];

  if (!status.closed) {
    return { isValid: false, errors: ['Status is not closed'] };
  }

  const details = {
    finalNav: status.closed.finalNav,
    closedAt: status.closed.closedAt?.toNumber?.() || status.closed.closedAt
  };

  // Validate final NAV is reasonable
  if (!details.finalNav || details.finalNav.lte(new BN(0))) {
    errors.push('Final NAV must be positive');
  }

  // Validate timestamp is recent
  const now = Math.floor(Date.now() / 1000);
  if (details.closedAt > now + 60) {
    errors.push('Closed timestamp is in the future');
  }

  // Validate expected values if provided
  if (expectedFinalNav && !details.finalNav.eq(expectedFinalNav)) {
    errors.push(`Final NAV mismatch: expected ${expectedFinalNav.toString()}, got ${details.finalNav.toString()}`);
  }

  return {
    isValid: errors.length === 0,
    details,
    errors: errors.length > 0 ? errors : undefined
  };
}

// getCloseDetails function removed - use validateBasktClosed instead

/**
 * Validate position count matches expected value
 */
export async function validatePositionCount(
  client: TestClient,
  basktId: PublicKey,
  expectedCount: number
): Promise<{ isValid: boolean; actualCount: number; errors?: string[] }> {
  const baskt = await client.getBaskt(basktId);
  const actualCount = baskt.openPositions.toNumber();

  if (actualCount !== expectedCount) {
    return {
      isValid: false,
      actualCount,
      errors: [`Position count mismatch: expected ${expectedCount}, got ${actualCount}`]
    };
  }

  return { isValid: true, actualCount };
}

/**
 * Validate specific error code/type
 */
export function validateSpecificError(error: any, expectedErrorCode: string): {
  isValid: boolean;
  actualError?: string;
  errors?: string[];
} {
  // Check for specific error code in the error object
  if (error.error?.errorCode?.code === expectedErrorCode) {
    return { isValid: true };
  }

  // Fallback to log checking but with more specificity
  const logs = error.logs?.toString() || '';
  if (logs.includes(expectedErrorCode)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    actualError: error.error?.errorCode?.code || 'Unknown',
    errors: [`Expected error code '${expectedErrorCode}' but got different error`]
  };
}

/**
 * Validate baskt state consistency
 */
export async function validateBasktStateConsistency(
  client: TestClient,
  basktId: PublicKey,
  expectedOpenPositions: number
): Promise<{ isValid: boolean; errors?: string[] }> {
  const errors: string[] = [];

  // Get baskt state
  const baskt = await client.getBaskt(basktId);

  // Validate position count
  const actualPositions = baskt.openPositions.toNumber();
  if (actualPositions !== expectedOpenPositions) {
    errors.push(`Position count mismatch: expected ${expectedOpenPositions}, got ${actualPositions}`);
  }

  // Additional consistency checks could be added here
  // - Liquidity pool balance consistency
  // - Oracle price reasonableness
  // - Timestamp consistency

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}
