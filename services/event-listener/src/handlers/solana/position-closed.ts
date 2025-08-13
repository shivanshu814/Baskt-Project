import { querierClient, basktClient } from '../../utils/config';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { EventSource, ObserverEvent } from '../../types';
import {
  createPositionFeeEvent,
  calculatePositionFees,
  convertTimestampToDate,
} from '../../utils/fee-utils';

export type PositionClosedEvent = {
  orderId: BN;
  owner: PublicKey;
  positionId: BN;
  basktId: PublicKey;
  sizeClosed: BN;
  sizeRemaining: BN;
  exitPrice: BN;
  pnl: BN;
  feeToTreasury: BN;
  feeToBlp: BN;
  fundingPayment: BN;
  settlementAmount: BN;
  poolPayout: BN;
  collateralRemaining: BN;
  timestamp: BN;
};

/**
 * Create fee event for position closed
 */
async function createPositionClosedFeeEvent(
  positionClosedData: PositionClosedEvent,
  tx: string,
  isPartialClose: boolean,
): Promise<void> {
  if (
    !positionClosedData.feeToTreasury ||
    !positionClosedData.feeToBlp ||
    !positionClosedData.timestamp
  ) {
    console.error('Missing required fee data for position closed event');
    return;
  }

  const fees = calculatePositionFees(positionClosedData.feeToTreasury, positionClosedData.feeToBlp);
  const timestamp = convertTimestampToDate(positionClosedData.timestamp);

  const eventType = isPartialClose ? 'POSITION_PARTIALLY_CLOSED' : 'POSITION_CLOSED';

  await createPositionFeeEvent(
    eventType,
    tx,
    timestamp,
    positionClosedData.basktId?.toString() || '',
    positionClosedData.owner?.toString() || '',
    fees.feeToTreasury,
    fees.feeToBlp,
    fees.totalFee,
    positionClosedData.positionId?.toString() || '',
    {
      orderId: positionClosedData.orderId?.toString() || '',
      positionSize: positionClosedData.sizeClosed?.toString() || '',
      exitPrice: positionClosedData.exitPrice?.toString() || '',
    },
  );
}

async function positionClosedHandler(event: ObserverEvent) {
  const positionClosedData = event.payload.event as PositionClosedEvent;
  const tx = event.payload.signature;

  try {
    if (!positionClosedData.owner || !positionClosedData.positionId) {
      console.error('Missing required position data for closed event');
      return;
    }

    const positionPDA = await basktClient.getPositionPDA(
      positionClosedData.owner,
      positionClosedData.positionId,
    );

    const isPartialClose =
      positionClosedData.sizeRemaining && positionClosedData.sizeRemaining.gt(new BN(0));

    if (isPartialClose) {
      console.log('Position PARTIAL CLOSE');
      const totalFees = positionClosedData.feeToTreasury.add(positionClosedData.feeToBlp);

      try {
        const position = await querierClient.metadata.findPositionByPDA(positionPDA.toString());

        if (!position) {
          console.error('Position not found in metadata for PDA:', positionPDA.toString());
          return;
        }

        const partialCloseEntry = {
          id: `${positionPDA.toString()}-${Date.now()}`,
          closeAmount: positionClosedData.sizeClosed?.toString() || '0',
          closePrice: positionClosedData.exitPrice?.toString() || '0',
          pnl: positionClosedData.pnl?.toString() || '0',
          feeCollected: totalFees.toString(),
          closePosition: {
            tx: tx,
            ts: positionClosedData.timestamp?.toString() || Date.now().toString(),
          },
          settlementAmount: positionClosedData.settlementAmount?.toString() || '0',
          poolPayout: positionClosedData.poolPayout?.toString() || '0',
          fundingPayment: positionClosedData.fundingPayment?.toString() || '0',
          collateralRemaining: positionClosedData.collateralRemaining?.toString() || '0',
        };

        const currentSize = new BN(position.remainingSize || position.size || '0');
        const closeAmountBN = new BN(positionClosedData.sizeClosed || '0');
        const remainingSize = new BN(positionClosedData.sizeRemaining || '0');

        const currentCollateral = new BN(position.collateral || '0');
        const closeAmountRatio = closeAmountBN.mul(new BN(1000000)).div(currentSize);
        const collateralToClose = currentCollateral.mul(closeAmountRatio).div(new BN(1000000));
        const remainingCollateral = currentCollateral.sub(collateralToClose);

        await querierClient.metadata.updatePositionByPDA(positionPDA.toString(), {
          size: remainingSize.toString(),
          remainingSize: remainingSize.toString(),
          collateral: remainingCollateral.toString(),
          partialCloseHistory: [...(position.partialCloseHistory || []), partialCloseEntry],
        });
      } catch (error) {
        console.error('Querier metadata update failed:', error);
      }
    } else {
      console.log('Position FULL CLOSE');
      await querierClient.metadata.updatePositionByPDA(positionPDA.toString(), {
        status: 'CLOSED',
        exitPrice: positionClosedData.exitPrice?.toString() || '0',
        closePosition: {
          tx: tx,
          ts: positionClosedData.timestamp?.toString() || Date.now().toString(),
        },
      });
    }

    await createPositionClosedFeeEvent(positionClosedData, tx, isPartialClose);
  } catch (error) {
    console.error('Error processing position closed event:', error);
  }
}

export default {
  type: 'positionClosedEvent',
  handler: positionClosedHandler,
  source: EventSource.SOLANA,
};
