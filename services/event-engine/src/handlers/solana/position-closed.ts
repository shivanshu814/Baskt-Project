import { trpcClient } from '../../utils/config';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { EventSource, ObserverEvent } from '../../types';

export type PositionClosedEvent = {
  orderId: BN;
  owner: PublicKey;
  positionId: BN;
  basktId: PublicKey;
  size: BN;
  collateral: BN;
  isLong: boolean;
  entryPrice: BN;
  entryFundingIndex: BN;
  timestamp: BN;
  exitPrice: BN;
};

async function positionClosedHandler(event: ObserverEvent) {
  console.log('Position closed event:', event);
  const positionClosedData = event.payload.event as PositionClosedEvent;
  const tx = event.payload.signature;

  // close position in DB
  await trpcClient.position.closePosition.mutate({
    positionId: positionClosedData.positionId.toString(),
    exitPrice: positionClosedData.exitPrice.toString(),
    tx,
    ts: positionClosedData.timestamp.toString(),
    //TODO add the order in which it was closed
  });
}

export default {
  source: EventSource.SOLANA,
  type: 'positionClosedEvent',
  handler: positionClosedHandler,
};
