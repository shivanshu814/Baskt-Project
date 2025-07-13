import { querierClient, basktClient } from '../../utils/config';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { OnchainPosition } from '@baskt/types';
import { PositionStatus } from '@baskt/types';
import { EventSource, ObserverEvent } from '../../types';

interface PositionOpenedEvent {
  orderId: BN;
  owner: PublicKey;
  positionId: BN | number | string;
  basktId: PublicKey;
  size: BN;
  collateral: BN;
  isLong: number;
  entryPrice: BN;
  entryFundingIndex: BN;
  timestamp: BN;
}

async function positionOpenedHandler(event: ObserverEvent) {
  console.log('Received position opened event data: ', event);
  const positionOpenedData = event.payload.event as PositionOpenedEvent;
  const tx = event.payload.signature;

  try {
    if (!positionOpenedData.positionId) {
      throw new Error('positionId is undefined in the event data');
    }

    const positionId: BN =
      positionOpenedData.positionId instanceof BN
        ? positionOpenedData.positionId
        : new BN(positionOpenedData.positionId.toString());

    const positionPDA = await basktClient.getPositionPDA(positionOpenedData.owner, positionId);

    const onchainPosition: OnchainPosition = await basktClient.readWithRetry(
      async () => await basktClient.getPosition(positionPDA, 'confirmed'),
      2,
      100,
    );
    if (!onchainPosition) {
      throw new Error(`Onchain position not found for PDA: ${positionPDA.toString()}`);
    }

    const orderPDA = await basktClient.getOrderPDA(
      positionOpenedData.orderId,
      positionOpenedData.owner,
    );
    if (!orderPDA) {
      throw new Error('Order PDA could not be derived');
    }

    console.log('Found Order PDA: ', orderPDA.toString());
    console.log('Found Position PDA: ', positionPDA.toString());

    const positionResult = await querierClient.metadata.createPosition({
      positionPDA: positionPDA.toString(),
      positionId: onchainPosition.positionId.toString(),
      basktId: onchainPosition.basktId.toString(),
      openOrder: orderPDA.toString(),
      openPosition: {
        tx: tx,
        ts: onchainPosition.timestampOpen.toString(),
      },
      entryPrice: onchainPosition.entryPrice.toString(),
      owner: onchainPosition.owner.toString(),
      status: PositionStatus.OPEN,
      size: onchainPosition.size.toString(),
      collateral: onchainPosition.collateral.toString(),
      isLong: onchainPosition.isLong,
    });

    if (!positionResult) {
      throw new Error('Failed to create position');
    }

    console.log('Position created successfully in DB');

    return;
  } catch (error) {
    console.error(
      'Error in positionOpenedHandler:',
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

export default {
  source: EventSource.SOLANA,
  type: 'positionOpenedEvent',
  handler: positionOpenedHandler,
};
