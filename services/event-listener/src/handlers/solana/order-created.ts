//OrderCreatedEvent

import { OnchainOrder, OrderAction, OnchainOrderStatus, OrderType, OrderCreatedEvent } from '@baskt/types';
import { basktClient, querierClient } from '../../utils/config';
import { EventSource, ObserverEvent } from '../../types';
import { getStreamPublisher } from 'src/utils/stream-publisher';
import { OrderMetadata } from '@baskt/querier';

async function orderCreatedHandler(event: ObserverEvent) {
  const orderCreatedData = event.payload.event as OrderCreatedEvent;
  const signature = event.payload.signature;

  try {
    if (!orderCreatedData.orderId) {
      throw new Error('orderId is undefined in the event data');
    }

    const onchainOrder: OnchainOrder = await basktClient.readWithRetry(
      async () => await basktClient.getOrderById(orderCreatedData.orderId, orderCreatedData.owner, 'confirmed'),
      5,
      100,
    );
    console.log('onChainOrder', onchainOrder.closeParams?.sizeAsContracts.toString());

    const baskt = await querierClient.baskt.getBasktByAddress(onchainOrder.basktId.toString());

    if (!baskt.success || !baskt.data) {
      throw new Error('Baskt metadata not found or invalid response');
    }

    try {
      const orderData: OrderMetadata = {
        orderPDA: onchainOrder.address.toString(),
        orderId: onchainOrder.orderId,
        baskt: baskt.data?._id as any,
        basktAddress: baskt.data?.basktId,
        orderStatus: OnchainOrderStatus.PENDING,
        orderAction: onchainOrder.action,
        orderType: onchainOrder.orderType,
        owner: onchainOrder.owner.toString(),
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
        const position = await querierClient.position.getPositionByAddress(onchainOrder.closeParams.targetPosition.toString());
        orderData.closeParams = {
          sizeAsContracts: onchainOrder.closeParams.sizeAsContracts.toString(),
          targetPosition: position.data?._id,
          targetPositionAddress: onchainOrder.closeParams.targetPosition.toString(),
        };
      }

      // Add order type-specific parameters
      if (onchainOrder.orderType === OrderType.Market) {
        orderData.marketParams = {};
      }

      if (onchainOrder.orderType === OrderType.Limit && onchainOrder.limitParams) {
        orderData.limitParams = {
          limitPrice: onchainOrder.limitParams.limitPrice.toString(),
          maxSlippageBps: onchainOrder.limitParams.maxSlippageBps.toNumber(),
        };
      }

      const orderResult = await querierClient.metadata.createOrder(orderData);
  
      if (!orderResult) {
        console.error('Failed to create order:', orderResult);
        throw new Error('Failed to create order');
      }

      console.log('Publishing order to DataBus', onchainOrder.address.toString());
        // Publish OrderRequest to DataBus for Guardian validation and execution-engine processing
      const streamPublisher = await getStreamPublisher();
      await streamPublisher.publishOrderCreated({
          order: onchainOrder,
          timestamp: onchainOrder.timestamp.toString(),
          txSignature: signature,
      });
      
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
