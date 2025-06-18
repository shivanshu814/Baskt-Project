import { EventSource, ObserverEvent } from '../../types';

export default {
  source: EventSource.SOLANA,
  type: 'collateralAddedEvent',
  handler: async function collateralAddedHandler(event: ObserverEvent) {
    console.log('collateral added', event);
  },
};
