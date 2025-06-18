//OrderCreatedEvent

import { PublicKey } from '@solana/web3.js';
import { OnchainOrder, OrderAction, OrderStatus } from '@baskt/types';
import { basktClient } from '../../utils/config';
import { BN } from 'bn.js';
import { trpcClient } from '../../utils/config';
import { EventSource, ObserverEvent } from '../../types';

export interface OrderCreatedEvent {
  owner: PublicKey;
  orderId: InstanceType<typeof BN> | number | string;
  basktId: PublicKey;
  size: InstanceType<typeof BN>;
  collateral: InstanceType<typeof BN>;
  isLong: boolean;
  action: OrderAction;
  targetPosition: PublicKey | null;
  timestamp: InstanceType<typeof BN>;
}

async function getCurrentNavForBaskt(basktId: PublicKey) {
  const baskt = await trpcClient.baskt.getBasktNAV.query({
    basktId: basktId.toString(),
  });

  if (!baskt.success) {
    const errorMessage =
      'error' in baskt ? baskt.error : 'message' in baskt ? baskt.message : 'Unknown error';
    console.error('Failed to fetch baskt metadata:', errorMessage);
    throw new Error('Failed to fetch baskt metadata');
  }

  if (!('data' in baskt)) {
    console.error('Baskt metadata not found for baskt:', basktId.toString());
    throw new Error('Baskt metadata not found');
  }

  const nav = baskt.data.nav === 0 ? 1000000 : baskt.data.nav;
  return new BN(nav);
}

async function handleOpenOrder(orderCreatedData: OrderCreatedEvent, onchainOrder: OnchainOrder) {
  try {
    const positionId = basktClient.newIdForPosition();
    const price = await getCurrentNavForBaskt(onchainOrder.basktId);

    if (price.isZero()) {
      console.error('Invalid NAV price: Price is zero for baskt:', onchainOrder.basktId.toString());
      throw new Error('Invalid NAV price: Price is zero');
    }

    await basktClient.updateOraclePrice(onchainOrder.basktId, price);

    // open position onchain
    const tx = await basktClient.openPosition({
      order: onchainOrder.address,
      positionId,
      entryPrice: price,
      baskt: onchainOrder.basktId,
      orderOwner: onchainOrder.owner,
    });

    const positionPDA = await basktClient.getPositionPDA(onchainOrder.owner, positionId);

    // update order status in db
    await trpcClient.order.updateOrderStatus.mutate({
      orderPDA: onchainOrder.address.toString(),
      orderStatus: 'FILLED',
      orderFullFillTx: tx,
      orderFullfillTs: onchainOrder.timestamp.toString(),
      position: positionPDA.toString(),
    });

    console.log('Position Opened', positionId.toString(), tx);
  } catch (error) {
    console.error('Error in handleOpenOrder:', error);
    throw error;
  }
}

async function handleCloseOrder(orderCreatedData: OrderCreatedEvent, onchainOrder: OnchainOrder) {
  try {
    const protocolAccount = await basktClient.getProtocolAccount();
    const positionAccount = await basktClient.getPosition(onchainOrder.targetPosition!);
    const exitPrice = await getCurrentNavForBaskt(onchainOrder.basktId);

    await basktClient.updateOraclePrice(onchainOrder.basktId, exitPrice);

    const ownerTokenAccount = await basktClient.getUSDCAccount(onchainOrder.owner);
    const treasuryTokenAccount = await basktClient.getUSDCAccount(protocolAccount.treasury);

    // close position onchain
    const tx = await basktClient.closePosition({
      orderPDA: onchainOrder.address,
      position: positionAccount.address,
      exitPrice: exitPrice,
      baskt: onchainOrder.basktId,
      ownerTokenAccount: ownerTokenAccount.address,
      treasury: protocolAccount.treasury,
      treasuryTokenAccount: treasuryTokenAccount.address,
      orderOwner: onchainOrder.owner,
    });

    // update order status in db
    await trpcClient.order.updateOrderStatus.mutate({
      orderPDA: onchainOrder.address.toString(),
      orderStatus: 'FILLED',
      orderFullFillTx: tx,
      orderFullfillTs: onchainOrder.timestamp.toString(),
    });

    console.log('Position closed successfully:', tx);
  } catch (error) {
    console.error('Error in handleCloseOrder:', error);
    throw error;
  }
}

async function orderCreatedHandler(event: ObserverEvent) {
  const orderCreatedData = event.payload.event as OrderCreatedEvent;
  const signature = event.payload.signature;

  try {
    if (!orderCreatedData.orderId) {
      throw new Error('orderId is undefined in the event data');
    }

    const orderId =
      orderCreatedData.orderId instanceof BN
        ? orderCreatedData.orderId
        : new BN(orderCreatedData.orderId.toString());

    const onchainOrder: OnchainOrder = await basktClient.readWithRetry(
      async () => await basktClient.getOrderById(orderId, orderCreatedData.owner, 'confirmed'),
      2,
      100,
    );

    const baskt = await trpcClient.baskt.getBasktMetadataById.query({
      basktId: onchainOrder.basktId.toString(),
    });

    if (!baskt.success || !('data' in baskt) || !baskt.data) {
      throw new Error('Baskt metadata not found or invalid response');
    }

    console.log('Baskt metadata found');

    // Create the order
    try {
      const orderResult = await trpcClient.order.createOrder.mutate({
        orderPDA: onchainOrder.address.toString(),
        orderId: onchainOrder.orderId.toString(),
        basktId: onchainOrder.basktId.toString(),
        orderStatus: OrderStatus.PENDING,
        orderAction: onchainOrder.action,
        owner: onchainOrder.owner.toString(),
        size: onchainOrder.size.toString(),
        collateral: onchainOrder.collateral.toString(),
        isLong: onchainOrder.isLong,
        createOrder: {
          tx: signature,
          ts: onchainOrder.timestamp.toString(),
        },
      });

      console.log('Order created successfully in DB');

      if (!orderResult.success) {
        console.error('Failed to create order:', orderResult);
        throw new Error(
          `Failed to create order: ${'error' in orderResult ? orderResult.error : 'Unknown error'}`,
        );
      }

      try {
        if (onchainOrder.action === OrderAction.Open) {
          await handleOpenOrder(orderCreatedData, onchainOrder);
        } else {
          await handleCloseOrder(orderCreatedData, onchainOrder);
        }
      } catch (error) {
        console.error('Error handling order:', error);
        await trpcClient.order.updateOrderStatus.mutate({
          orderPDA: onchainOrder.address.toString(),
          orderStatus: 'FAILED',
        });
        throw error;
      }
    } catch (error) {
      console.error('Error in order creation process:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in orderCreatedHandler:', error);
    throw error;
  }
}

export default {
  source: EventSource.SOLANA,
  type: 'orderCreatedEvent',
  handler: orderCreatedHandler,
};
