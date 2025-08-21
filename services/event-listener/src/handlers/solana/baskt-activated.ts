

import { BasktActivatedEvent, BasktStatus } from '@baskt/types';
import { ObserverEvent } from '../../types';
import { EventSource } from '../../types';
import { getStreamPublisher } from 'src/utils/stream-publisher';
import { querierClient } from '../../utils/config';
import { FeeEventMetadata, FeeEvents } from '@baskt/querier';



export default {
  source: EventSource.SOLANA,
  type: 'basktActivatedEvent',
  handler: async (event: ObserverEvent) => {
    const basktActivatedData = event.payload.event as BasktActivatedEvent;
  }
};
