import { querierClient, basktClient } from '../../utils/config';
import BN from 'bn.js';
import { OnchainOrderStatus, PositionOpenedEvent, PositionStatus } from '@baskt/types';
import { EventSource, ObserverEvent } from '../../types';
import {
  createPositionFeeEvent,
  calculatePositionFees,
  convertTimestampToDate,
} from '../../utils/fee-utils';
import { FeeEvents } from '@baskt/querier';
import { PRICE_PRECISION } from '@baskt/sdk';

/**
 * Create fee event for position opened
 */
async function createPositionOpenedFeeEvent(
  positionOpenedData: PositionOpenedEvent,
  tx: string,
  isLong: boolean,
): Promise<void> {
  const fees = calculatePositionFees(positionOpenedData.feeToTreasury, positionOpenedData.feeToBlp);
  const timestamp = convertTimestampToDate(positionOpenedData.timestamp);

  await createPositionFeeEvent(
    FeeEvents.POSITION_OPENED,
    tx,
    timestamp,
    positionOpenedData.basktId.toString(),
    positionOpenedData.owner.toString(),
    fees.feeToTreasury,
    fees.feeToBlp,
    fees.totalFee,
    positionOpenedData.positionId.toString(),
    {
      orderId: positionOpenedData.orderId.toString(),
      positionSize: positionOpenedData.size.toString(),
      entryPrice: positionOpenedData.entryPrice.toString(),
      isLong,
    },
  );
}

async function positionOpenedHandler(event: ObserverEvent) {
  const positionOpenedData = event.payload.event as PositionOpenedEvent;
  const tx = event.payload.signature;

  try {
    const positionId = positionOpenedData.positionId;

    const positionPDA = await basktClient.getPositionPDA(positionOpenedData.owner, Number(positionId));
    const isLong = positionOpenedData.isLong;

    const baskt = await querierClient.metadata.findBasktById(positionOpenedData.basktId.toString());

    const order = await querierClient.metadata.findOrderById(Number(positionOpenedData.orderId.toString()));

    const positionData = await querierClient.metadata.createPosition({
        positionPDA: positionPDA.toString(),
        positionId: positionId.toString(),
        owner: positionOpenedData.owner.toString(),
        basktAddress: positionOpenedData.basktId.toString(),
        baskt: baskt!._id,
        size: new BN( positionOpenedData.size.toString()),
        remainingSize: new BN(positionOpenedData.size.toString()),
        collateral: new BN(positionOpenedData.collateral.toString()),
        remainingCollateral: new BN(positionOpenedData.collateral.toString()),
        entryPrice: positionOpenedData.entryPrice.toNumber(),
        status: PositionStatus.OPEN,
        isLong: isLong,
        openOrderId: positionOpenedData.orderId.toNumber(),
        openOrder: order!._id,
        openPosition: {
          feeToTreasury: positionOpenedData.feeToTreasury.toNumber(),
          feeToBlp: positionOpenedData.feeToBlp.toNumber(),
          tx: tx,
          ts: positionOpenedData.timestamp.toString(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        partialCloseHistory: [],
      }); 

      order!.orderStatus = OnchainOrderStatus.FILLED;
      order!.fullFillOrder = {
        tx: tx,
        ts: positionOpenedData.timestamp.toString(),
      };
      order!.positionCreated = positionData._id;
      await order!.save();

      baskt!.openPositions += 1;
      
      if(isLong) {
        baskt!.stats!.longAllTimeVolume = new BN(baskt!.stats!.longAllTimeVolume.toString()).add(positionOpenedData.size.mul(positionOpenedData.entryPrice).div(new BN(PRICE_PRECISION))).toString() as any;
        baskt!.stats!.longOpenInterestContracts = new BN(baskt!.stats!.longOpenInterestContracts.toString()).add(positionOpenedData.size).toString() as any ;
      } else {
        baskt!.stats!.shortAllTimeVolume = new BN(baskt!.stats!.shortAllTimeVolume.toString()).add(positionOpenedData.size.mul(positionOpenedData.entryPrice).div(new BN(PRICE_PRECISION))).toString() as any;
        baskt!.stats!.shortOpenInterestContracts = new BN(baskt!.stats!.shortOpenInterestContracts.toString()).add(positionOpenedData.size).toString() as any;
      }
      
      await baskt!.save();
  
      // Create fee event record
      await createPositionOpenedFeeEvent(positionOpenedData, tx, isLong);
  } catch (error) {
    console.error('Error processing position opened event:', error);
  }
}

export default {
  type: 'positionOpenedEvent',
  handler: positionOpenedHandler,
  source: EventSource.SOLANA,
};
