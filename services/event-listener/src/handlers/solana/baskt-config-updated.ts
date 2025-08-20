import { BasktConfigUpdatedEvent } from '@baskt/types/dist/onchain/events';
import { EventSource, ObserverEvent } from '../../types';
import { querierClient } from '../../utils/config';

export default {
  source: EventSource.SOLANA,
  type: 'basktConfigUpdatedEvent',
  handler: async function basktConfigUpdatedHandler(event: ObserverEvent) {
    try {
      const basktConfigData = event.payload.event as BasktConfigUpdatedEvent;
      
      console.log(`Baskt config updated by ${basktConfigData.updatedBy.toString()} at ${basktConfigData.timestamp.toString()}`);
      
      // Get the baskt metadata to find the basktId
      const basktMetadata = await querierClient.metadata.findBasktById(basktConfigData.baskt.toString());
      
      if (!basktMetadata) {
        console.error('Baskt not found in metadata for address:', basktConfigData.baskt.toString());
        return;
      }
      
      // Resync baskt metadata from on-chain data
      await querierClient.baskt.resyncBasktMetadata(basktConfigData.baskt.toString());
      
      console.log(`Baskt metadata resynced successfully for baskt: ${basktConfigData.baskt.toString()}`);
    } catch (error) {
      console.error('Failed to handle baskt config update:', error);
    }
  },
};
