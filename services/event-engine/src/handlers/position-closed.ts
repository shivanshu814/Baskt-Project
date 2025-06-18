import { trpcClient } from '../utils/config';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';

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

export default async function positionClosedHandler(data: any, slot: number, tx: string) {
  console.log('Position closed event:', data);
  const positionClosedData = data as PositionClosedEvent;

  // close position in DB
  await trpcClient.position.closePosition.mutate({
    positionId: positionClosedData.positionId.toString(),
    exitPrice: positionClosedData.exitPrice.toString(),
    tx,
    ts: positionClosedData.timestamp.toString(),
    //TODO add the orderId as well in which we closed it
  });
}
