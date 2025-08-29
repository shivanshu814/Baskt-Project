import { querierClient, basktClient } from '../../utils/config';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { EventSource, ObserverEvent } from '../../types';
import {
  createPositionFeeEvent,
  calculatePositionFees,
  convertTimestampToDate,
} from '../../utils/fee-utils';
import { OnchainOrderStatus, PositionClosedEvent, PositionStatus } from '@baskt/types';
import { PartialCloseHistory, FeeEvents } from '@baskt/querier';
import { PRICE_PRECISION } from '@baskt/sdk';

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

  await createPositionFeeEvent(
    FeeEvents.POSITION_CLOSED,
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
      Number(positionClosedData.positionId),
    );


    const positionMetadata = await querierClient.metadata.findPositionByPDA(positionPDA.toString());
    const orderMetadata = await querierClient.metadata.findOrderById(Number(positionClosedData.orderId));

    if (!positionMetadata) {
      console.error('Position not found in metadata for PDA:', positionPDA.toString());
      return;
    }

    const isPartialClose =
      positionClosedData.sizeRemaining && positionClosedData.sizeRemaining.gt(new BN(0));


    const partialCloseEntry = {
      id: `${positionPDA.toString()}-${Date.now()}`,
      closeAmount: new BN(positionClosedData.sizeClosed?.toString() || '0'),
      closePrice: new BN(positionClosedData.exitPrice?.toString() || '0'),
      settlementDetails: {
        escrowToTreasury: new BN(positionClosedData.escrowToTreasury?.toString() || '0'),
        escrowToPool: new BN(positionClosedData.escrowToPool?.toString() || '0'),
        escrowToUser: new BN(positionClosedData.escrowToUser?.toString() || '0'),
        poolToUser: new BN(positionClosedData.poolToUser?.toString() || '0'),
        feeToTreasury: positionClosedData.feeToTreasury?.toNumber() || 0,
        feeToBlp: positionClosedData.feeToBlp?.toNumber() || 0,
        baseFee: positionClosedData.baseFee?.toNumber() || 0,
        rebalanceFee: positionClosedData.rebalanceFee?.toNumber() || 0,
        fundingAccumulated: new BN(positionClosedData.fundingAccumulated?.toString() || '0'),
        pnl: new BN(positionClosedData.pnl?.toString() || '0'),
        badDebtAmount: new BN(positionClosedData.badDebtAmount?.toString() || '0'),
        userPayout: new BN(positionClosedData.userTotalPayout?.toString() || '0'),
        collateralToRelease: new BN(positionClosedData.collateralReleased?.toString() || '0'),
      },
      closePosition: {
        tx: tx,
        ts: positionClosedData.timestamp?.toString() || Date.now().toString(),
      },
      order: orderMetadata!._id,
    } as PartialCloseHistory;

    positionMetadata!.remainingSize = positionClosedData.sizeRemaining.toString() as any  ;
    positionMetadata!.remainingCollateral = positionClosedData.collateralRemaining.toString() as any;
    positionMetadata!.partialCloseHistory.push(partialCloseEntry);

    if(positionMetadata.remainingSize.toString() === '0') {
      positionMetadata.status = PositionStatus.CLOSED;
      positionMetadata.closePosition = partialCloseEntry.closePosition;
    }

    await positionMetadata!.save();
    orderMetadata!.orderStatus = OnchainOrderStatus.FILLED;
    orderMetadata!.fullFillOrder = {
      tx: tx,
      ts: positionClosedData.timestamp.toString(),
    };
    await orderMetadata!.save();

    const baskt = await querierClient.metadata.findBasktById(positionClosedData.basktId.toString());
    baskt!.openPositions -= 1;
    if(positionMetadata.isLong) {
      baskt!.stats!.longAllTimeVolume = new BN(baskt!.stats!.longAllTimeVolume.toString()).add(positionClosedData.sizeClosed.mul(positionClosedData.exitPrice).div(new BN(PRICE_PRECISION))).toString() as any;
      baskt!.stats!.longOpenInterestContracts = new BN(baskt!.stats!.longOpenInterestContracts.toString()).sub(positionClosedData.sizeClosed).toString() as any;
 
    } else {
      baskt!.stats!.shortAllTimeVolume = new BN(baskt!.stats!.shortAllTimeVolume.toString()).add(positionClosedData.sizeClosed.mul(positionClosedData.exitPrice).div(new BN(PRICE_PRECISION))).toString() as any;
      baskt!.stats!.shortOpenInterestContracts = new BN(baskt!.stats!.shortOpenInterestContracts.toString()).sub(positionClosedData.sizeClosed).toString() as any;  
    }
    await baskt!.save();

    await querierClient.pool.resyncLiquidityPool();

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
