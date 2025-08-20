import { querierClient } from './config';
import { FeeEventMetadata, FeeEvents } from '@baskt/querier';
import BN from 'bn.js';

/**
 * Common fee event utilities
 */

/**
 * Calculate total fee from treasury and BLP fees
 */
export function calculateTotalFee(feeToTreasury: BN, feeToBlp: BN): string {
  return feeToTreasury.add(feeToBlp).toString();
}

/**
 * Convert BN timestamp to Date
 */
export function convertTimestampToDate(timestamp: BN): Date {
  return new Date(timestamp.toNumber() * 1000);
}

/**
 * Create fee event for position-related events
 */
export async function createPositionFeeEvent(
  eventType: FeeEvents.POSITION_OPENED | FeeEvents.POSITION_CLOSED | FeeEvents.POSITION_LIQUIDATED,
  transactionSignature: string,
  timestamp: Date,
  basktId: string,
  owner: string,
  feeToTreasury: string,
  feeToBlp: string,
  totalFee: string,
  positionId: string,
  additionalData: {
    orderId?: string;
    positionSize?: string;
    entryPrice?: string;
    exitPrice?: string;
    isLong?: boolean;
    fundingFeePaid?: string;
    fundingFeeOwed?: string;
    rebalanceFeePaid?: string;
  },
): Promise<void> {
  const feeEventData: FeeEventMetadata = {
    eventType,
    transactionSignature,
    payer: owner,
    feePaidIn: 'USDC',
    positionFee: {
      basktId,
      positionId,
      feeToTreasury,
      feeToBlp,
      totalFee,
      fundingFeePaid: additionalData.fundingFeePaid || '0',
      fundingFeeOwed: additionalData.fundingFeeOwed || '0',
      rebalanceFeePaid: additionalData.rebalanceFeePaid || '0',
    },
  };

  await querierClient.feeEvent.createFeeEvent(feeEventData);
}

/**
 * Create fee event for liquidity-related events
 */
export async function createLiquidityFeeEvent(
  eventType: FeeEvents.LIQUIDITY_ADDED | FeeEvents.LIQUIDITY_REMOVED,
  transactionSignature: string,
  timestamp: Date,
  owner: string,
  feeAmount: string,
): Promise<void> {
  const feeEventData: FeeEventMetadata = {
    eventType,
    transactionSignature,
    payer: owner,
    feePaidIn: 'USDC',
    liquidityFee: {
      feeToTreasury: feeAmount, // All LP fees go to treasury
      feeToBlp: '0', // No BLP fees for liquidity events
      totalFee: feeAmount,
    },
  };

  await querierClient.feeEvent.createFeeEvent(feeEventData);
  console.log('Liquidity fee event created:', feeEventData);
}

/**
 * Create fee event for withdraw queue processed
 */
export async function createWithdrawQueueFeeEvent(
  transactionSignature: string,
  owner: string,
  feesCollected: string,
): Promise<void> {
  const feeEventData: FeeEventMetadata = {
    eventType: FeeEvents.LIQUIDITY_REMOVED,
    transactionSignature,
    payer: owner,
    feePaidIn: 'USDC',
    liquidityFee: {
      feeToTreasury: feesCollected,
      feeToBlp: '0',
      totalFee: feesCollected,
    },
  };

  await querierClient.feeEvent.createFeeEvent(feeEventData);
  console.log('Withdraw queue fee event created:', feeEventData);
}

/**
 * Extract common fee calculation logic for position events
 */
export function calculatePositionFees(feeToTreasury: BN, feeToBlp: BN) {
  return {
    feeToTreasury: feeToTreasury.toString(),
    feeToBlp: feeToBlp.toString(),
    totalFee: calculateTotalFee(feeToTreasury, feeToBlp),
  };
}
