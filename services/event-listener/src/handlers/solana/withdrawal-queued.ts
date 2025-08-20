import { EventSource, ObserverEvent } from '../../types';
import { WithdrawalQueuedEvent, WithdrawRequestStatus } from '@baskt/types';
import { basktClient, querierClient } from '../../utils/config';

async function withdrawalQueuedHandler(event: ObserverEvent) {
  const withdrawalQueuedData = event.payload.event as WithdrawalQueuedEvent;
  const tx = event.payload.signature;

  try {
    const requestId = withdrawalQueuedData.requestId.toNumber();
    console.log('requestId', requestId);
    // Try to get the withdrawal request from blockchain (it might not exist yet)
    let withdrawalRequest = await basktClient.readWithRetry(
      async () => await basktClient.getWithdrawalRequest(requestId),
      5,
      100,
    );

    if (!withdrawalRequest) {
      throw new Error('Withdrawal request not found');
    }
         // Create withdrawal request record with complete on-chain data
     await querierClient.pool.createWithdrawalRequest({
       requestId: requestId,
       withdrawalProcessAddress: withdrawalRequest.key.toString(),
       provider: withdrawalRequest.provider.toString(),
       requestedLpAmount: withdrawalRequest.remainingLp.toString(), // Original requested amount
       remainingLp: withdrawalRequest.remainingLp.toString(), // Current remaining amount
       providerUsdcAccount: withdrawalRequest.providerUsdcAccount.toString(),
       status: WithdrawRequestStatus.QUEUED, // Will be set by the model default
       requestedAt: {
         ts: withdrawalQueuedData.timestamp.toNumber(),
         tx: tx,
       },
       bump: withdrawalRequest.bump,
     });
     
     // Resync liquidity pool after queueing withdrawal
     await querierClient.pool.resyncLiquidityPool();
    
  } catch (error) {
    console.error('Error processing withdrawal queued event:', error);
  }
}

export default {
  type: 'withdrawalQueuedEvent',
  handler: withdrawalQueuedHandler,
  source: EventSource.SOLANA,
};
