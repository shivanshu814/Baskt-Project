import { EventSource, ObserverEvent } from '../../types';
import { querierClient } from '../../utils/config';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { 
  createLiquidityFeeEvent, 
  convertTimestampToDate 
} from '../../utils/fee-utils';

export type LiquidityRemovedEvent = {
  provider: PublicKey;
  liquidityPool: PublicKey;
  sharesBurned: BN;
  withdrawalAmount: BN;
  feeAmount: BN;
  netAmountReceived: BN;
  timestamp: BN;
};

/**
 * Create fee event for liquidity removed
 */
async function createLiquidityRemovedFeeEvent(
  liquidityRemovedData: LiquidityRemovedEvent,
  tx: string
): Promise<void> {
  const feeAmount = liquidityRemovedData.feeAmount.toString();
  const timestamp = convertTimestampToDate(liquidityRemovedData.timestamp);

  await createLiquidityFeeEvent(
    'LIQUIDITY_REMOVED',
    tx,
    timestamp,
    liquidityRemovedData.provider.toString(),
    feeAmount,
    liquidityRemovedData.provider.toString(),
    liquidityRemovedData.liquidityPool.toString(),
    liquidityRemovedData.withdrawalAmount.toString(),
    liquidityRemovedData.sharesBurned.toString()
  );
}

async function liquidityRemovedHandler(event: ObserverEvent) {
  const liquidityRemovedData = event.payload.event as LiquidityRemovedEvent;
  const tx = event.payload.signature;

  try {
    await createLiquidityRemovedFeeEvent(liquidityRemovedData, tx);
  } catch (error) {
    console.error('Error processing liquidity removed event:', error);
  }
}

export default {
  type: 'liquidityRemovedEvent',
  handler: liquidityRemovedHandler,
  source: EventSource.SOLANA,
}; 