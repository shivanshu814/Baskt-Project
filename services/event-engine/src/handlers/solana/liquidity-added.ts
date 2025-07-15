import { EventSource, ObserverEvent } from '../../types';
import { querierClient } from '../../utils/config';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { 
  createLiquidityFeeEvent, 
  convertTimestampToDate 
} from '../../utils/fee-utils';

export type LiquidityAddedEvent = {
  provider: PublicKey;
  liquidityPool: PublicKey;
  depositAmount: BN;
  feeAmount: BN;
  sharesMinted: BN;
  timestamp: BN;
};

/**
 * Create fee event for liquidity added
 */
async function createLiquidityAddedFeeEvent(
  liquidityAddedData: LiquidityAddedEvent,
  tx: string
): Promise<void> {
  const feeAmount = liquidityAddedData.feeAmount.toString();
  const timestamp = convertTimestampToDate(liquidityAddedData.timestamp);

  await createLiquidityFeeEvent(
    'LIQUIDITY_ADDED',
    tx,
    timestamp,
    liquidityAddedData.provider.toString(),
    feeAmount,
    liquidityAddedData.provider.toString(),
    liquidityAddedData.liquidityPool.toString(),
    liquidityAddedData.depositAmount.toString(),
    liquidityAddedData.sharesMinted.toString()
  );
}

async function liquidityAddedHandler(event: ObserverEvent) {
  const liquidityAddedData = event.payload.event as LiquidityAddedEvent;
  const tx = event.payload.signature;

  try {
    await createLiquidityAddedFeeEvent(liquidityAddedData, tx);
  } catch (error) {
    console.error('Error processing liquidity added event:', error);
  }
}

export default {
  type: 'liquidityAddedEvent',
  handler: liquidityAddedHandler,
  source: EventSource.SOLANA,
}; 