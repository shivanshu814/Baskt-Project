import { EventSource, ObserverEvent } from '../../types';

export default {
  source: EventSource.SOLANA,
  type: 'positionLiquidatedEvent',
  handler: async function positionLiquidatedHandler(event: ObserverEvent) {
    console.log('position liquidated', event);
  },
};
