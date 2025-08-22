import { BasktCreatedEvent} from '@baskt/types';
import { ObserverEvent } from '../../types';
import { EventSource } from '../../types';
import { getStreamPublisher } from 'src/utils/stream-publisher';
import { querierClient } from '../../utils/config';
import { FeeEventMetadata, FeeEvents } from '@baskt/querier';
import BN from 'bn.js';

export default {
  source: EventSource.SOLANA,
  type: 'basktCreatedEvent',
  handler: async (event: ObserverEvent) => {
    const basktCreatedData = event.payload.event as BasktCreatedEvent;
    const signature = event.payload.signature;

    try {
      // Create fee event for baskt creation (if there are fees)
      // Note: Baskt creation typically doesn't have fees, but we can track the event
      querierClient.feeEvent.createFeeEvent({
        eventType: FeeEvents.BASKT_CREATED,
        transactionSignature: signature,
        payer: basktCreatedData.creator.toString(),
        feePaidIn: 'SOL',
        basktFee: {
          basktId: basktCreatedData.basktId.toString(),
          creationFee: new BN(basktCreatedData.basktCreationFee),
          rebalanceRequestFee: new BN(0),
        }
      } as FeeEventMetadata);

      return (await getStreamPublisher()).publishBasktCreated({
          basktId: basktCreatedData.basktId.toString(),
          timestamp: Date.now().toString(),
          txSignature: signature.toString(),
        });
    } catch (error) {
      console.error('Error processing baskt created event:', error);
      throw error;
    }
  },
};
