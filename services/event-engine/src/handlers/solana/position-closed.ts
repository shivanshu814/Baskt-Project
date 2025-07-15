import { querierClient, basktClient } from '../../utils/config';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { EventSource, ObserverEvent } from '../../types';
import { 
  createPositionFeeEvent, 
  calculatePositionFees, 
  convertTimestampToDate 
} from '../../utils/fee-utils';

export type PositionClosedEvent = {
  orderId: BN;
  owner: PublicKey;
  positionId: BN;
  basktId: PublicKey;
  size: BN;
  exitPrice: BN;
  pnl: BN;
  feeToTreasury: BN;
  feeToBlp: BN;
  fundingPayment: BN;
  settlementAmount: BN;
  poolPayout: BN;
  timestamp: BN;
};

/**
 * Create fee event for position closed
 */
async function createPositionClosedFeeEvent(
  positionClosedData: PositionClosedEvent,
  tx: string
): Promise<void> {
  const fees = calculatePositionFees(positionClosedData.feeToTreasury, positionClosedData.feeToBlp);
  const timestamp = convertTimestampToDate(positionClosedData.timestamp);

  await createPositionFeeEvent(
    'POSITION_CLOSED',
    tx,
    timestamp,
    positionClosedData.basktId.toString(),
    positionClosedData.owner.toString(),
    fees.feeToTreasury,
    fees.feeToBlp,
    fees.totalFee,
    positionClosedData.positionId.toString(),
    {
      orderId: positionClosedData.orderId.toString(),
      positionSize: positionClosedData.size.toString(),
      exitPrice: positionClosedData.exitPrice.toString(),
    }
  );
}

async function positionClosedHandler(event: ObserverEvent) {
  const positionClosedData = event.payload.event as PositionClosedEvent;
  const tx = event.payload.signature;

  try {
    const positionPDA = await basktClient.getPositionPDA(
      positionClosedData.owner,
      positionClosedData.positionId
    );

    // Update position status to CLOSED
    await querierClient.metadata.updatePosition(positionPDA.toString(), {
      status: 'CLOSED',
      exitPrice: positionClosedData.exitPrice.toString(),
      closePosition: {
        tx: tx,
        ts: positionClosedData.timestamp.toString(),
      },
    });

    // Create fee event record
    await createPositionClosedFeeEvent(positionClosedData, tx);
  } catch (error) {
    console.error('Error processing position closed event:', error);
  }
}

export default {
  type: 'positionClosedEvent',
  handler: positionClosedHandler,
  source: EventSource.SOLANA,
};
