import { RebalanceRequestEvent} from '@baskt/types';
import { ObserverEvent } from '../../types';
import { EventSource } from '../../types';
import { querierClient } from '../../utils/config';
import { FeeEventMetadata, FeeEvents } from '@baskt/querier';


async function createRebalanceRequest(rebalanceRequestData: RebalanceRequestEvent, signature: string) {
  const baskt = await querierClient.baskt.getBasktByAddress(rebalanceRequestData.basktId.toString());
  if (!baskt.success || !baskt.data) {
    throw new Error('Baskt not found');
  }

  await querierClient.baskt.createRebalanceRequest({
        baskt: baskt.data._id!,
        basktId: rebalanceRequestData.basktId.toString(),
        creator: rebalanceRequestData.creator.toString(),
        rebalanceRequestFee: rebalanceRequestData.rebalanceRequestFee.toString(),
        timestamp: rebalanceRequestData.timestamp.toNumber(),
        txSignature: signature,
  });
}

export default {
  source: EventSource.SOLANA,
  type: 'rebalanceRequestEvent',
  handler: async (event: ObserverEvent) => {
    const rebalanceRequestData = event.payload.event as RebalanceRequestEvent;
    const signature = event.payload.signature;


    try {
      const actions = [
      querierClient.feeEvent.createFeeEvent({
        eventType: FeeEvents.REBALANCE_REQUESTED,
        transactionSignature: signature,
        payer: rebalanceRequestData.creator.toString(),
        feePaidIn: 'SOL',
        basktFee: {
          basktId: rebalanceRequestData.basktId.toString(),
          rebalanceRequestFee: rebalanceRequestData.rebalanceRequestFee.toString(),
        }
      } as FeeEventMetadata),
      createRebalanceRequest(rebalanceRequestData, signature),
    ];

      await Promise.all(actions);

    

    } catch (error) {
      console.error('Error processing baskt created event:', error);
      throw error;
    }
  },
};
