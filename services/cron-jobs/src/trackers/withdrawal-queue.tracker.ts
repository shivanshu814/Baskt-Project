import { BaseJob } from '../job';
import { basktClient, querierClient } from '../config/client';
import { WithdrawalRequestModel } from '@baskt/querier';
import { WithdrawRequestStatus } from '@baskt/types';
import BN from 'bn.js';

// Configure the processing delay in hours (from environment variable or default to 24 hours)
const defaultWithdrawalProcessingDelaySeconds = 24 * 60 * 60;
const WITHDRAWAL_PROCESSING_DELAY_SECONDS = parseInt(process.env.WITHDRAWAL_PROCESSING_DELAY_SECONDS || defaultWithdrawalProcessingDelaySeconds.toString());
const WITHDRAWAL_CHECK_INTERVAL_SECONDS = parseInt(process.env.WITHDRAWAL_CHECK_INTERVAL_SECONDS || '300'); // 5 minutes default

export class WithdrawalQueueTracker extends BaseJob {
  constructor() {
    super('withdrawal-queue-tracker', WITHDRAWAL_CHECK_INTERVAL_SECONDS);
  }

  private async getEligibleWithdrawalRequests(): Promise<any[]> {
    try {
      // Calculate the timestamp threshold (current time - delay hours)
      const delayMs = WITHDRAWAL_PROCESSING_DELAY_SECONDS * 1000;
      const timestampThreshold = Date.now() - delayMs;
      
      // Query for withdrawal requests that are:
      // 1. In QUEUED status
      // 2. Created before the threshold timestamp
      const eligibleRequests = await WithdrawalRequestModel.find({
        status: WithdrawRequestStatus.QUEUED,
        'requestedAt.ts': { $lte: timestampThreshold }
      }).sort({ requestId: 1 }); // Process in order of request ID
      
      return eligibleRequests;
    } catch (error) {
      console.error('Error fetching eligible withdrawal requests:', error);
      return [];
    }
  }

  private async processWithdrawalRequest(request: any): Promise<boolean> {
    try {
      console.log(`Processing withdrawal request ${request.requestId} for provider ${request.provider}`);
      
      // Get the liquidity pool to check the queue status
      const liquidityPool = await basktClient.getLiquidityPool();
      if (!liquidityPool) {
        console.error('Liquidity pool not found');
        return false;
      }

      // Get the withdrawal request from the blockchain to ensure it exists
      const withdrawRequest = await basktClient.getWithdrawalRequest(new BN(request.requestId));
      if (!withdrawRequest) {
        console.error(`Withdrawal request ${request.requestId} not found on-chain`);
        // Update the status in MongoDB to reflect this
        await WithdrawalRequestModel.updateOne(
          { requestId: request.requestId },
          { status: WithdrawRequestStatus.FAILED }
        );
        return false;
      }

      // Process the withdrawal queue
      await basktClient.processWithdrawQueue(
        withdrawRequest.provider,
        withdrawRequest.key,
        withdrawRequest.providerUsdcAccount,
      );

      console.log(`✅ Withdrawal request ${request.requestId} processed successfully`);
      
      // The event listener will handle updating the MongoDB record when it receives
      // the WithdrawQueueProcessed event
      
      return true;
    } catch (error) {
      console.error(`Error processing withdrawal request ${request.requestId}:`, error);
      
      // If it's a specific error that indicates the request can't be processed yet
      // (e.g., insufficient liquidity), we should keep it in QUEUED status
      // Otherwise, we might want to mark it as failed
      
      return false;
    }
  }

  async run(): Promise<void> {
    const startTime = Date.now();
    console.log(`🚀 [${new Date().toISOString()}] Starting withdrawal queue processing...`);
    console.log(`   Processing delay: ${WITHDRAWAL_PROCESSING_DELAY_SECONDS} hours`);
    
    try {
      // Get all eligible withdrawal requests
      const eligibleRequests = await this.getEligibleWithdrawalRequests();
      
      if (eligibleRequests.length === 0) {
        console.log('📋 No eligible withdrawal requests to process');
        return;
      }
      
      console.log(`📋 Found ${eligibleRequests.length} eligible withdrawal requests`);
      
      let successCount = 0;
      let failureCount = 0;
      
      // Process each request
      for (const request of eligibleRequests) {
        const success = await this.processWithdrawalRequest(request);
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
        
        // Add a small delay between processing requests to avoid rate limiting
        if (eligibleRequests.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`🏁 Withdrawal queue processing completed in ${duration}ms`);
      console.log(`   ✅ Success: ${successCount}, ❌ Failed: ${failureCount}`);
      
      // Optionally, resync the liquidity pool data after processing
      if (successCount > 0) {
        try {
          await querierClient.pool.resyncLiquidityPool();
          console.log('💾 Liquidity pool data resynced');
        } catch (error) {
          console.error('Error resyncing liquidity pool:', error);
        }
      }
      
    } catch (err) {
      console.error('❌ Error in withdrawal queue processing:', err);
      throw err;
    }
  }
}