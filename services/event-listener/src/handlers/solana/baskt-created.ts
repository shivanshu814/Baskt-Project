import { FeeEventMetadata, FeeEvents } from '@baskt/querier';
import { BasktCreatedEvent } from '@baskt/types';
import BN from 'bn.js';
import { EventSource, ObserverEvent } from '../../types';
import { querierClient } from '../../utils/config';

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
        },
      } as FeeEventMetadata);
      // DataBus events are handled by the backend when frontend creates basket
      return { success: true, message: 'Fee event created for baskt creation' };
    } catch (error) {
      console.error('Error processing baskt created event:', error);
      throw error;
    }
  },
};
