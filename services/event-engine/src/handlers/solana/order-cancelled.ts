import { EventSource, ObserverEvent } from '../../types';

export default {
  source: EventSource.SOLANA,
  type: 'orderCancelledEvent',
  handler: async function orderCancelledHandler(event: ObserverEvent) {
    console.log('order cancelled', event);
  },
};
