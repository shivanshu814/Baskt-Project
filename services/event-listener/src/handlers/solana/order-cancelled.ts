import { OrderCancelledEvent } from '@baskt/types/dist/onchain/events';
import { EventSource, ObserverEvent } from '../../types';
import { querierClient } from 'src/utils/config';
import { OnchainOrderStatus } from '@baskt/types/dist/onchain/order';

export default {
  source: EventSource.SOLANA,
  type: 'orderCancelledEvent',
  handler: async function orderCancelledHandler(event: ObserverEvent) {

    const orderCancelledData = event.payload.event as OrderCancelledEvent;

    const orderMetadata = await querierClient.metadata.findOrderById(Number(orderCancelledData.orderId));

    if (!orderMetadata) {
      console.error('Order not found in metadata for PDA:', orderCancelledData.orderId);
      return;
    }

    orderMetadata.orderStatus = OnchainOrderStatus.CANCELLED;
    orderMetadata.cancelOrder = {
      tx: event.payload.signature,
      ts: orderCancelledData.timestamp.toString(),
    };
    await orderMetadata.save();
  },
};
