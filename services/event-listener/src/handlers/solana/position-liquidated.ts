import { EventSource, ObserverEvent } from '../../types';
import { querierClient, basktClient } from '../../utils/config';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { 
  createPositionFeeEvent, 
  calculatePositionFees, 
  convertTimestampToDate 
} from '../../utils/fee-utils';
import { PositionLiquidatedEvent } from '@baskt/types';
import { FeeEvents } from '@baskt/querier';

/**
 * Create fee event for position liquidated
 */
async function createPositionLiquidatedFeeEvent(
  positionLiquidatedData: PositionLiquidatedEvent,
  tx: string
): Promise<void> {
  const fees = calculatePositionFees(positionLiquidatedData.feeToTreasury, positionLiquidatedData.feeToBlp);
  const timestamp = convertTimestampToDate(positionLiquidatedData.timestamp);

  await createPositionFeeEvent(
    FeeEvents.POSITION_LIQUIDATED,
    tx,
    timestamp,
    positionLiquidatedData.basktId.toString(),
    positionLiquidatedData.owner.toString(),
    fees.feeToTreasury,
    fees.feeToBlp,
    fees.totalFee,
    positionLiquidatedData.positionId.toString(),
    {
      positionSize: positionLiquidatedData.sizeLiquidated.toString(),
      exitPrice: positionLiquidatedData.exitPrice.toString(),
    }
  );
}

async function positionLiquidatedHandler(event: ObserverEvent) {
  const positionLiquidatedData = event.payload.event as PositionLiquidatedEvent;
  const tx = event.payload.signature;

  try {
    const positionPDA = await basktClient.getPositionPDA(
      positionLiquidatedData.owner,
      Number(positionLiquidatedData.positionId)
    );

    // Update position status to LIQUIDATED
    await querierClient.metadata.updatePositionByPDA(positionPDA.toString(), {
      status: 'LIQUIDATED',
      exitPrice: positionLiquidatedData.exitPrice.toString(),
      closePosition: {
        tx: tx,
        ts: positionLiquidatedData.timestamp.toString(),
      },
    });

    await querierClient.pool.resyncLiquidityPool();

    // Create fee event record
    await createPositionLiquidatedFeeEvent(positionLiquidatedData, tx);
  } catch (error) {
    console.error('Error processing position liquidated event:', error);
  }
}

export default {
  type: 'positionLiquidatedEvent',
  handler: positionLiquidatedHandler,
  source: EventSource.SOLANA,
};
