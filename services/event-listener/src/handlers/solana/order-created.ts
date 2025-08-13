//OrderCreatedEvent

import { PublicKey } from '@solana/web3.js';
import { OnchainOrder, OrderAction, OnchainOrderStatus, OrderType, OrderCreatedEvent } from '@baskt/types';
import { basktClient, querierClient } from '../../utils/config';
import { BN } from 'bn.js';
import { EventSource, ObserverEvent } from '../../types';
import { FLAG_MIGRATE_TO_DATABUS } from 'src/utils/const';
import { getStreamPublisher } from 'src/utils/stream-publisher';

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
    const positionId = basktClient.newUID();
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
    });

    console.log('Position Opened', positionId.toString(), tx);
    const positionPDA = await basktClient.getPositionPDA(onchainOrder.owner, positionId);

 
    // update order status in db
    await querierClient.metadata.updateOrderByPDA(onchainOrder.address.toString(), {
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
    const positionAccount = await basktClient.getPosition(onchainOrder.closeParams!.targetPosition);
    const exitPrice = await getCurrentNavForBaskt(onchainOrder.basktId);


    const ownerTokenAccount = await basktClient.getUSDCAccount(onchainOrder.owner);
    const treasuryTokenAccount = await basktClient.getUSDCAccount(protocolAccount.treasury);

    const isPartialClose = onchainOrder.closeParams!.sizeAsContracts.lt(positionAccount.size);
    const sizeToClose = isPartialClose ? onchainOrder.closeParams!.sizeAsContracts : undefined;

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
      sizeToClose: sizeToClose,
    });

    console.log("Position closed", positionAccount.positionPDA.toString(), tx);

    // update order status in db
    await querierClient.metadata.updateOrderByPDA(onchainOrder.address.toString(), {
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

    const onchainOrder: OnchainOrder = await basktClient.readWithRetry(
      async () => await basktClient.getOrderById(orderCreatedData.orderId, orderCreatedData.owner, 'confirmed'),
      3,
      100,
    );

    const baskt = await querierClient.baskt.getBasktById(onchainOrder.basktId.toString());

    if (!baskt.success || !baskt.data) {
      throw new Error('Baskt metadata not found or invalid response');
    }

    try {
      const orderData: any = {
        orderPDA: onchainOrder.address.toString(),
        orderId: onchainOrder.orderId.toString(),
        basktId: onchainOrder.basktId.toString(),
        orderStatus: OnchainOrderStatus.PENDING,
        orderAction: onchainOrder.action,
        orderType: onchainOrder.orderType,
        owner: onchainOrder.owner.toString(),
        timestamp: onchainOrder.timestamp.toString(),
        createOrder: {
          tx: signature,
          ts: onchainOrder.timestamp.toString(),
        },
      };

      // Add action-specific parameters
      if (onchainOrder.action === OrderAction.Open && onchainOrder.openParams) {
        orderData.openParams = {
          notionalValue: onchainOrder.openParams.notionalValue.toString(),
          leverageBps: onchainOrder.openParams.leverageBps.toString(),
          collateral: onchainOrder.openParams.collateral.toString(),
          isLong: onchainOrder.openParams.isLong,
        };
      }

      if (onchainOrder.action === OrderAction.Close && onchainOrder.closeParams) {
        orderData.closeParams = {
          sizeAsContracts: onchainOrder.closeParams.sizeAsContracts.toString(),
          targetPosition: onchainOrder.closeParams.targetPosition.toString(),
        };
      }

      // Add order type-specific parameters
      if (onchainOrder.orderType === OrderType.Market) {
        orderData.marketParams = {};
      }

      if (onchainOrder.orderType === OrderType.Limit && onchainOrder.limitParams) {
        orderData.limitParams = {
          limitPrice: onchainOrder.limitParams.limitPrice.toString(),
          maxSlippageBps: onchainOrder.limitParams.maxSlippageBps.toString(),
        };
      }

      const orderResult = await querierClient.metadata.createOrder(orderData);

      console.log('Order created successfully in DB');

      if (!orderResult) {
        console.error('Failed to create order:', orderResult);
        throw new Error('Failed to create order');
      }

      if (FLAG_MIGRATE_TO_DATABUS) {
        console.log('Publishing order to DataBus', onchainOrder.address.toString(), onchainOrder.openParams!.notionalValue.toString());
        // Publish OrderRequest to DataBus for Guardian validation and execution-engine processing
        const streamPublisher = await getStreamPublisher();
        await streamPublisher.publishOrderCreated({
          order: onchainOrder,
          timestamp: onchainOrder.timestamp.toString(),
          txSignature: signature,
        });
      } else {
        try {
          if (onchainOrder.action === OrderAction.Open) {
            await handleOpenOrder(orderCreatedData, onchainOrder);
          } else {
            await handleCloseOrder(orderCreatedData, onchainOrder);
          }
        } catch (error) {
          console.error('Error handling order:', error);
          await querierClient.metadata.updateOrderByPDA(onchainOrder.address.toString(), {
            orderStatus: 'FAILED',
          });
          throw error;
        }
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
