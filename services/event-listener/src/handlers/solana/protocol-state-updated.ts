import { ProtocolStateUpdatedEvent } from '@baskt/types/dist/onchain/events';
import { EventSource, ObserverEvent } from '../../types';
import { querierClient } from '../../utils/config';

export default {
  source: EventSource.SOLANA,
  type: 'protocolStateUpdatedEvent',
  handler: async function protocolStateUpdatedHandler(event: ObserverEvent) {
    try {
      const protocolStateData = event.payload.event as ProtocolStateUpdatedEvent;
      
      console.log(`Protocol state updated by ${protocolStateData.updatedBy.toString()} at ${protocolStateData.timestamp.toString()}`);
      
      // Resync protocol metadata from on-chain data
      await querierClient.protocol.resyncProtocolMetadata();
      
      console.log('Protocol metadata resynced successfully');
    } catch (error) {
      console.error('Failed to handle protocol state update:', error);
    }
  },
};
