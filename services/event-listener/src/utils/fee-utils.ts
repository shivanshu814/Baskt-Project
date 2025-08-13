import { querierClient } from './config';
import { FeeEventData } from '@baskt/querier';
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
 * Create base fee event data structure
 */
export function createBaseFeeEventData(
  eventId: string,
  eventType: FeeEventData['eventType'],
  transactionSignature: string,
  timestamp: Date,
  owner: string,
  feeToTreasury: string,
  feeToBlp: string,
  totalFee: string,
  basktId?: string,
): Partial<FeeEventData> {
  return {
    eventId,
    eventType,
    transactionSignature,
    timestamp,
    owner,
    feeToTreasury,
    feeToBlp,
    totalFee,
    basktId,
  };
}

/**
 * Create fee event for position-related events
 */
export async function createPositionFeeEvent(
  eventType:
    | 'POSITION_OPENED'
    | 'POSITION_CLOSED'
    | 'POSITION_LIQUIDATED'
    | 'POSITION_PARTIALLY_CLOSED',
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
  },
): Promise<void> {
  const eventId = `${eventType.toLowerCase()}_${transactionSignature}_${positionId}`;

  const feeEventData: FeeEventData = {
    eventId,
    eventType,
    transactionSignature,
    timestamp,
    basktId,
    owner,
    feeToTreasury,
    feeToBlp,
    totalFee,
    positionId,
    orderId: additionalData.orderId,
    positionSize: additionalData.positionSize,
    entryPrice: additionalData.entryPrice,
    exitPrice: additionalData.exitPrice,
    isLong: additionalData.isLong,
  };

  await querierClient.feeEvent.createFeeEvent(feeEventData);
}

/**
 * Create fee event for liquidity-related events
 */
export async function createLiquidityFeeEvent(
  eventType: 'LIQUIDITY_ADDED' | 'LIQUIDITY_REMOVED',
  transactionSignature: string,
  timestamp: Date,
  owner: string,
  feeAmount: string,
  liquidityProvider: string,
  liquidityPool: string,
  liquidityAmount: string,
  sharesAmount: string,
): Promise<void> {
  const eventId = `${eventType.toLowerCase()}_${transactionSignature}_${liquidityProvider}`;

  const feeEventData: FeeEventData = {
    eventId,
    eventType,
    transactionSignature,
    timestamp,
    owner,
    feeToTreasury: feeAmount, // All LP fees go to treasury
    feeToBlp: '0', // No BLP fees for liquidity events
    totalFee: feeAmount,
    liquidityProvider,
    liquidityPool,
    liquidityAmount,
    sharesAmount,
  };

  await querierClient.feeEvent.createFeeEvent(feeEventData);
  console.log('Liquidity fee event created:', feeEventData);
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
