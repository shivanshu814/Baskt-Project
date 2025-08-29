import { OrderCancelledEvent } from '@baskt/types';
import { EventSource, ObserverEvent } from '../../types';
import { basktClient, querierClient } from '../../utils/config';
import { getStreamPublisher } from '../../utils/stream-publisher';
import { PublicKey } from '@solana/web3.js';

export default {
  source: EventSource.SOLANA,
  type: 'orderCancelledEvent',
  handler: async function orderCancelledHandler(event: ObserverEvent) {
    const { payload } = event;
    
    try {
      // Cast data to OrderCancelledEvent type
      const cancelledData = payload.event as OrderCancelledEvent;
      const signature = payload.signature as string;
      
      // Parse event data
      const owner = cancelledData.owner?.toString() || '';
      const orderId = cancelledData.orderId?.toString() || '';
      const basktId = cancelledData.basktId?.toString() || '';
      const timestamp = cancelledData.timestamp?.toString() || Date.now().toString();
      const txSignature = signature?.toString() || '';
      console.log(`Processing order cancelled event:`, {
        owner,
        orderId,
        basktId,
        timestamp,
        txSignature
      });
      
      if (!owner || !orderId) {
        throw new Error('Missing owner or orderId in OrderCancelledEvent payload');
      }
      
      // Update order status to CANCELLED
      const orderPDA = basktClient.getOrderPDA(Number(orderId), new PublicKey(owner));
      const updateResult = await querierClient.metadata.updateOrderByPDA(orderPDA.toString(), {
        orderStatus: 'CANCELLED',
        cancelTx: txSignature,
        cancelTs: timestamp,
      });
      
      if (!updateResult) {
        console.error('Failed to update order status to CANCELLED:', updateResult);
        // Continue anyway to publish the event
      }
      
      // Publish cancellation event to DataBus
      const streamPublisher = await getStreamPublisher();
      await streamPublisher.publishOrderCancelled({
        owner,
        orderId,
        basktId,
        timestamp,
        txSignature
      });
      
      console.log(`Order cancelled successfully: ${orderId} for owner ${owner}`);
    } catch (error) {
      console.error('Error in orderCancelledHandler:', error);
      throw error;
    }
  },
};