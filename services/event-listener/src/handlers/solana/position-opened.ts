import { querierClient, basktClient } from '../../utils/config';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { PositionStatus } from '@baskt/types';
import { EventSource, ObserverEvent } from '../../types';
import {
  createPositionFeeEvent,
  calculatePositionFees,
  convertTimestampToDate,
} from '../../utils/fee-utils';

interface PositionOpenedEvent {
  orderId: BN;
  owner: PublicKey;
  positionId: BN | number | string;
  basktId: PublicKey;
  size: BN;
  collateral: BN;
  isLong: boolean;
  entryPrice: BN;
  entryFundingIndex: BN;
  feeToTreasury: BN;
  feeToBlp: BN;
  timestamp: BN;
}

/**
 * Create fee event for position opened
 */
async function createPositionOpenedFeeEvent(
  positionOpenedData: PositionOpenedEvent,
  tx: string,
  isLong: boolean,
): Promise<void> {
  const fees = calculatePositionFees(positionOpenedData.feeToTreasury, positionOpenedData.feeToBlp);
  const timestamp = convertTimestampToDate(positionOpenedData.timestamp);

  await createPositionFeeEvent(
    'POSITION_OPENED',
    tx,
    timestamp,
    positionOpenedData.basktId.toString(),
    positionOpenedData.owner.toString(),
    fees.feeToTreasury,
    fees.feeToBlp,
    fees.totalFee,
    positionOpenedData.positionId.toString(),
    {
      orderId: positionOpenedData.orderId.toString(),
      positionSize: positionOpenedData.size.toString(),
      entryPrice: positionOpenedData.entryPrice.toString(),
      isLong,
    },
  );
}

async function positionOpenedHandler(event: ObserverEvent) {
  const positionOpenedData = event.payload.event as PositionOpenedEvent;
  const tx = event.payload.signature;

  try {
    const positionId =
      positionOpenedData.positionId instanceof BN
        ? positionOpenedData.positionId
        : new BN(positionOpenedData.positionId.toString());

    const positionPDA = await basktClient.getPositionPDA(positionOpenedData.owner, positionId);

    const isLong = positionOpenedData.isLong;

    const positionData = {
      positionPDA: positionPDA.toString(),
      positionId: positionId.toString(),
      owner: positionOpenedData.owner.toString(),
      basktId: positionOpenedData.basktId.toString(),
      size: positionOpenedData.size.toString(),
      remainingSize: positionOpenedData.size.toString(),
      collateral: positionOpenedData.collateral.toString(),
      entryPrice: positionOpenedData.entryPrice.toString(),
      status: PositionStatus.OPEN,
      isLong: isLong,
      openOrder: positionOpenedData.orderId.toString(),
      openPosition: {
        tx: tx,
        ts: positionOpenedData.timestamp.toString(),
      },
    };

    await querierClient.metadata.createPosition(positionData); 

    // Create fee event record
    await createPositionOpenedFeeEvent(positionOpenedData, tx, isLong);
  } catch (error) {
    console.error('Error processing position opened event:', error);
  }
}

export default {
  type: 'positionOpenedEvent',
  handler: positionOpenedHandler,
  source: EventSource.SOLANA,
};
