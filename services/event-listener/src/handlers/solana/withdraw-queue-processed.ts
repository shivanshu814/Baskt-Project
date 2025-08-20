import { EventSource, ObserverEvent } from '../../types';
import { WithdrawQueueProcessedEvent, WithdrawRequestStatus } from '@baskt/types';
import { querierClient } from '../../utils/config';
import { createWithdrawQueueFeeEvent } from '../../utils/fee-utils';

async function withdrawQueueProcessedHandler(event: ObserverEvent) {
  const withdrawQueueProcessedData = event.payload.event as WithdrawQueueProcessedEvent;
  const tx = event.payload.signature;

  try {
    // Update withdrawal request status to completed
    // Note: We'll need to get the request ID from the queue tail position
    const requestId = withdrawQueueProcessedData.queueTailUpdated.toNumber();

    await querierClient.pool.updateWithdrawalRequestStatus(
      requestId,
      WithdrawRequestStatus.PROCESSING, // Start as PROCESSING, will be updated to COMPLETED if fully processed
      {
        processedTs:  Date.now() / 1000,
        processingTxSignature: tx,
        amountProcessed: withdrawQueueProcessedData.amountPaidToUser.toString(),
        lpTokensBurned: withdrawQueueProcessedData.lpTokensBurned.toString(), // Now correctly using the actual LP tokens burned
      }
    );
    
    // Create fee event for withdrawal fees
    if (withdrawQueueProcessedData.feesCollected.gtn(0)) {
      await createWithdrawQueueFeeEvent(
        tx,
        withdrawQueueProcessedData.provider.toString(), // Provider is the payer
        withdrawQueueProcessedData.feesCollected.toString(),
      );
    }
    
    // Resync liquidity pool after processing withdrawal
    await querierClient.pool.resyncLiquidityPool();
  } catch (error) {
    console.error('Error processing withdraw queue processed event:', error);
  }
}

export default {
  type: 'withdrawQueueProcessedEvent',
  handler: withdrawQueueProcessedHandler,
  source: EventSource.SOLANA,
};
