import { EventSource, ObserverEvent } from '../../types';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { 
  createLiquidityFeeEvent, 
  convertTimestampToDate 
} from '../../utils/fee-utils';
import { LiquidityAddedEvent } from '@baskt/types';
import { querierClient } from '../../utils/config';
import { FeeEvents } from '@baskt/querier';

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
    FeeEvents.LIQUIDITY_ADDED,
    tx,
    timestamp,
    liquidityAddedData.provider.toString(),
    feeAmount,
  );
}

async function liquidityAddedHandler(event: ObserverEvent) {
  const liquidityAddedData = event.payload.event as LiquidityAddedEvent;
  const tx = event.payload.signature;

  try {
    await createLiquidityAddedFeeEvent(liquidityAddedData, tx);
    await querierClient.pool.resyncLiquidityPool();
    
    // Create deposit record
    const netDeposit = liquidityAddedData.depositAmount.sub(liquidityAddedData.feeAmount).toString();
    await querierClient.pool.createLiquidityDeposit({
      provider: liquidityAddedData.provider.toString(),
      liquidityPool: liquidityAddedData.liquidityPool.toString(),
      depositAmount: liquidityAddedData.depositAmount.toString(),
      feeAmount: liquidityAddedData.feeAmount.toString(),
      sharesMinted: liquidityAddedData.sharesMinted.toString(),
      timestamp: liquidityAddedData.timestamp.toNumber(),
      transactionSignature: tx,
      netDeposit,
    });
  } catch (error) {
    console.error('Error processing liquidity added event:', error);
  }
}

export default {
  type: 'liquidityAddedEvent',
  handler: liquidityAddedHandler,
  source: EventSource.SOLANA,
}; 