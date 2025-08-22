import { basktClient, querierClient } from '../../utils/config';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { EventSource, ObserverEvent } from '../../types';
import { CollateralAddedEvent } from '@baskt/types';



async function collateralAddedHandler(event: ObserverEvent) { 
  const collateralAddedData = event.payload.event as CollateralAddedEvent;

  try {
    if (!collateralAddedData.owner || !collateralAddedData.positionId) {
      console.error('Missing required position data for collateral added event');
      return;
    }

    const positionPDA = await basktClient.getPositionPDA(
      collateralAddedData.owner,
      collateralAddedData.positionId.toNumber(),
    );

    try {
      const position = await querierClient.metadata.findPositionByPDA(positionPDA.toString());

      if (!position) {
        console.error('Position not found in metadata for PDA:', positionPDA.toString());
        return;
      }

      await querierClient.metadata.updatePositionByPDA(positionPDA.toString(), {
        collateral: collateralAddedData.newTotalCollateral.toString(),
        remainingCollateral: collateralAddedData.newTotalCollateral.toString(),
      });
    } catch (error) {
      console.error('Querier metadata update failed:', error);
    }
  } catch (error) {
    console.error('Error processing collateral added event:', error);
  }
}

export default {
  type: 'collateralAddedEvent',
  handler: collateralAddedHandler,
  source: EventSource.SOLANA,
};
