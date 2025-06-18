import { trpcClient } from '../utils/config';
import { basktClient } from '../utils/config';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { OnchainPosition } from '@baskt/types';
import { PositionStatus } from '@baskt/types';

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

async function positionOpenedHandler(data: any, slot: number, tx: string) {
  console.log('Received position opened event data: ', data);
  const positionOpenedData = data as PositionOpenedEvent;

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

    const order = await trpcClient.order.getOrders.query({ orderPDA: orderPDA.toString() });
    if (
      !order.success ||
      !('data' in order) ||
      !order.data ||
      !order.data.length ||
      !(order.data[0] as any)._id
    ) {
      throw new Error('Order metadata not found');
    }
    const orderMetadata = order.data[0];

    const baskt = await trpcClient.baskt.getBasktMetadataById.query({
      basktId: onchainPosition.basktId.toString(),
    });
    if (!baskt.success || !('data' in baskt) || !(baskt.data as any)._id) {
      throw new Error(
        `Failed to get baskt metadata: ${'message' in baskt ? baskt.message : 'Unknown error'}`,
      );
    }

    console.log('Found Order Metadata');

    const positionResult = await trpcClient.position.createPosition.mutate({
      positionPDA: onchainPosition.address.toString(),
      positionId: onchainPosition.positionId.toString(),
      basktId: onchainPosition.basktId.toString(),
      openOrder: (orderMetadata as any)._id,
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

    if (!positionResult.success || !('data' in positionResult)) {
      throw new Error(
        `Failed to create position: ${
          'message' in positionResult ? positionResult.message : 'Unknown error'
        }`,
      );
    }

    console.log('Position created successfully in DB');

    return {
      success: true,
      data: {
        position: positionResult.data,
        baskt: baskt.data,
      },
    };
  } catch (error) {
    console.error(
      'Error in positionOpenedHandler:',
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

export default positionOpenedHandler;
