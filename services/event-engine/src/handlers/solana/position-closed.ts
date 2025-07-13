import { querierClient, basktClient } from '../../utils/config';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { EventSource, ObserverEvent } from '../../types';

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

async function positionClosedHandler(event: ObserverEvent) {
  console.log('Position closed event:', event);
  const positionClosedData = event.payload.event as PositionClosedEvent;
  const tx = event.payload.signature;

  try {
    const positionPDA = await basktClient.getPositionPDA(
      positionClosedData.owner,
      positionClosedData.positionId,
    );

    const orderPDA = await basktClient.getOrderPDA(
      positionClosedData.orderId,
      positionClosedData.owner,
    );

    const result = await querierClient.metadata.updatePosition(positionPDA.toString(), {
      exitPrice: positionClosedData.exitPrice.toString(),
      tx,
      ts: positionClosedData.timestamp.toString(),
      closeOrder: orderPDA.toString(),
      status: 'CLOSED',
    });

    console.log('result', result);

    if (!result) {
      console.error('Failed to close position in DB');
    } else {
      console.log('Position closed successfully in DB');
    }
  } catch (error) {
    console.error('Error in positionClosedHandler:', error);
    throw error;
  }
}

export default {
  source: EventSource.SOLANA,
  type: 'positionClosedEvent',
  handler: positionClosedHandler,
};
