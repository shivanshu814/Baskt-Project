import { BasktClosed, BasktCreatedEvent, BasktDecommissioningInitiated, BasktStatus} from '@baskt/types';
import { ObserverEvent } from '../../types';
import { EventSource } from '../../types';
import { getStreamPublisher } from 'src/utils/stream-publisher';
import { querierClient } from '../../utils/config';
import { FeeEventMetadata, FeeEvents } from '@baskt/querier';



export const basktClosedHandler = {
  source: EventSource.SOLANA,
  type: 'basktClosed',
  handler: async (event: ObserverEvent) => {
    const basktClosedEvent = event.payload.event as BasktClosed;
    
    const basktMetadata = await querierClient.metadata.findBasktById(basktClosedEvent.baskt.toString());
    if(!basktMetadata){
      console.error('Baskt not found in metadata for address:', basktClosedEvent.baskt.toString());
      return;
    }
    await querierClient.metadata.updateBaskt(basktClosedEvent.baskt.toString(), {
      status: BasktStatus.Closed,
      closeBasktTxSignature: event.payload.signature,
    });

  },
};

export const basktDecommissioningInitiatedHandler = {
  source: EventSource.SOLANA,
  type: 'basktDecommissioningInitiated',
  handler: async (event: ObserverEvent) => {
    const basktDecommissioningInitiatedEvent = event.payload.event as BasktDecommissioningInitiated;
    const basktMetadata = await querierClient.metadata.findBasktById(basktDecommissioningInitiatedEvent.baskt.toString());
    if(!basktMetadata){
      console.error('Baskt not found in metadata for address:', basktDecommissioningInitiatedEvent.baskt.toString());
      return;
    }
    await querierClient.metadata.updateBaskt(basktDecommissioningInitiatedEvent.baskt.toString(), {
      status: BasktStatus.Decommissioning,
      decomissionBasktTxSignature: event.payload.signature,
    });
  },
};