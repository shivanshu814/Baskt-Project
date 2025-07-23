//OrderCreatedEvent

import { PublicKey } from '@solana/web3.js';
import { OnchainOrder, OrderAction, OrderStatus } from '@baskt/types';
import { basktClient, querierClient } from '../../utils/config';
import { BN } from 'bn.js';
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
  const baskt = await querierClient.baskt.getBasktNAV(basktId.toString());

  if (!baskt.success) {
    const errorMessage = baskt.error || baskt.message || 'Unknown error';
    console.error('Failed to fetch baskt metadata:', errorMessage);
    throw new Error('Failed to fetch baskt metadata');
  }

  if (!baskt.data) {
    console.error('Baskt metadata not found for baskt:', basktId.toString());
    throw new Error('Baskt metadata not found');
  }

  const nav = baskt.data.nav === 0 ? 1000000 : baskt.data.nav;
  return new BN(nav);
}

async function handleOpenOrder(orderCreatedData: OrderCreatedEvent, onchainOrder: OnchainOrder) {
  console.log("Opening position for order", onchainOrder.address.toString());
  try {
    const positionId = basktClient.newIdForPosition();
    const price = await getCurrentNavForBaskt(onchainOrder.basktId);

    if (price.isZero()) {
      console.error('Invalid NAV price: Price is zero for baskt:', onchainOrder.basktId.toString());
      throw new Error('Invalid NAV price: Price is zero');
    }

    // open position onchain
    const tx = await basktClient.openPosition({
      order: onchainOrder.address,
      positionId,
      entryPrice: price,
      baskt: onchainOrder.basktId,
      orderOwner: onchainOrder.owner,
      preInstructions: [await basktClient.updateOraclePriceWithItx(onchainOrder.basktId, price)],
    });

    console.log('Position Opened', positionId.toString(), tx);
    const positionPDA = await basktClient.getPositionPDA(onchainOrder.owner, positionId);

 
    // update order status in db
    await querierClient.metadata.updateOrder(onchainOrder.address.toString(), {
      orderStatus: 'FILLED',
      orderFullFillTx: tx,
      orderFullfillTs: onchainOrder.timestamp.toString(),
      position: positionPDA.toString(),
    });

    console.log("Order updated", onchainOrder.address.toString());
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
      position: positionAccount.positionPDA,
      exitPrice: exitPrice,
      baskt: onchainOrder.basktId,
      ownerTokenAccount: ownerTokenAccount.address,
      treasury: protocolAccount.treasury,
      treasuryTokenAccount: treasuryTokenAccount.address,
      orderOwner: onchainOrder.owner,
    });

    console.log("Position closed", positionAccount.positionPDA.toString(), tx);

    // update order status in db
    await querierClient.metadata.updateOrder(onchainOrder.address.toString(), {
      orderStatus: 'FILLED',
      orderFullFillTx: tx,
      orderFullfillTs: onchainOrder.timestamp.toString(),
    });
    console.log("Order updated", onchainOrder.address.toString());
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

    const baskt = await querierClient.baskt.getBasktById(onchainOrder.basktId.toString());

    if (!baskt.success || !baskt.data) {
      throw new Error('Baskt metadata not found or invalid response');
    }

    console.log('Baskt metadata found');

    // Create the order
    try {
      const orderResult = await querierClient.metadata.createOrder({
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
        orderType: onchainOrder.orderType,
        limitPrice: onchainOrder.limitPrice.toString(),
        maxSlippage: onchainOrder.maxSlippage.toString(),
      });

      console.log('Order created successfully in DB');

      if (!orderResult) {
        console.error('Failed to create order:', orderResult);
        throw new Error('Failed to create order');
      }

      try {
        if (onchainOrder.action === OrderAction.Open) {
          await handleOpenOrder(orderCreatedData, onchainOrder);
        } else {
          await handleCloseOrder(orderCreatedData, onchainOrder);
        }
      } catch (error) {
        console.error('Error handling order:', error);
        await querierClient.metadata.updateOrder(onchainOrder.address.toString(), {
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
