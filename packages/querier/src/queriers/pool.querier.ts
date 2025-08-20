import { PublicKey } from '@solana/web3.js';
import { getAccount, getMint } from '@solana/spl-token';
import { QueryResult } from '../models/types';
import { LiquidityPool, PoolDeposit } from '../types/pool';
import { LiquidityPoolModel, LiquidityDepositModel, WithdrawalRequestModel } from '../models/mongodb';
import { WithdrawRequestStatus } from '@baskt/types';
import { BaseClient } from '@baskt/sdk';
import { LiquidityPoolMetadata } from '../types/models/LiquidityPool';
import { ProtocolQuerier } from './protocol.querier';
import { WithdrawalRequest } from '../types';

/**
 * PoolQuerier
 *
 * This class is responsible for fetching liquidity pool data and pool deposits.
 * It provides methods to get pool information and user deposits in the liquidity pool.
 */

export class PoolQuerier {

  private sdkClient: BaseClient;
  private static instance: PoolQuerier;

  constructor(sdkClient: BaseClient) {
    this.sdkClient = sdkClient;
  }

  public static getInstance(sdkClient: BaseClient): PoolQuerier {
    if (!PoolQuerier.instance) {
      PoolQuerier.instance = new PoolQuerier(sdkClient);
    }
    return PoolQuerier.instance;
  }

  // get liquidity pool data
  async getLiquidityPool(): Promise<QueryResult<LiquidityPool>> {
    try {

      const liquidityPoolPDA = await this.sdkClient.liquidityPoolPDA;
      const data =  await LiquidityPoolModel.findOne({ poolAddress: liquidityPoolPDA.toString() }).lean<LiquidityPoolMetadata>();
      const protocolMetadata = await ProtocolQuerier.getInstance(this.sdkClient).getProtocolMetadata();
      const minDeposit = protocolMetadata?.config.minLiquidity;
      const [tokenVault] = await this.sdkClient.getUsdcVaultPda();
      if (!data) {
        return {  
          success: false,
          error: 'Liquidity pool not found',
        };
      }
      return {  
        success: true,
        data: {
          tokenVault: tokenVault.toString(),
          minDeposit: minDeposit?.toString() || '0',
          ...data,
        },
      };
    } catch (error) {
      console.error('Error fetching liquidity pool:', error);
      return {
        success: false,
        error: 'Failed to fetch liquidity pool data',
      };
    }
  }

  // get pool deposits
  async getPoolDeposits(): Promise<QueryResult<PoolDeposit[]>> {
    return {
      success: true,
      data: [],
    };
  }

  async resyncLiquidityPool(): Promise<void> {
    try {
      const poolData = await this.sdkClient.getLiquidityPool();
      const poolAddress = this.sdkClient.liquidityPoolPDA.toString();
      
      await LiquidityPoolModel.findOneAndUpdate(
        { poolAddress },
        {
          totalLiquidity: poolData.totalLiquidity?.toString() || '0',
          lpMint: poolData.lpMint?.toString() || '',
          totalShares: poolData.totalShares?.toString() || '0',
          lastUpdateTimestamp: poolData.lastUpdateTimestamp?.toNumber() || 0,
          depositFeeBps: poolData.depositFeeBps || 0,
          withdrawalFeeBps: poolData.withdrawalFeeBps || 0,
          bump: poolData.bump || 0,
          poolAuthorityBump: poolData.poolAuthorityBump || 0,
          pendingLpTokens: poolData.pendingLpTokens?.toString() || '0',
          withdrawQueueHead: poolData.withdrawQueueHead?.toNumber() || 0,
          withdrawQueueTail: poolData.withdrawQueueTail?.toNumber() || 0,
          poolAddress,
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error resyncing liquidity pool:', error);
      throw error;
    }
  }

  async createLiquidityDeposit(depositData: {
    provider: string;
    liquidityPool: string;
    depositAmount: string;
    feeAmount: string;
    sharesMinted: string;
    timestamp: number;
    transactionSignature: string;
    netDeposit: string;
  }): Promise<void> {
    try {
      await LiquidityDepositModel.create(depositData);
    } catch (error) {
      console.error('Error creating liquidity deposit:', error);
      throw error;
    }
  }

  async createWithdrawalRequest(withdrawalRequest: WithdrawalRequest): Promise<void> {
    try {
      console.log('withdrawalRequest', withdrawalRequest);
      await WithdrawalRequestModel.create(withdrawalRequest);
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      throw error;
    }
  }

  async updateWithdrawalRequestStatus(
    requestId: number,
    status: WithdrawRequestStatus,
    processingData?: {
      processedTs: number;
      processingTxSignature: string;
      amountProcessed: string;
      lpTokensBurned: string;
    }
  ): Promise<void> {
    try {
      const updateData: any = { status };
      
      if (processingData) {
        updateData['processedAt.processedTs'] = processingData.processedTs;
        updateData['processedAt.tx'] = processingData.processingTxSignature;
        
        // Add to processing history
        const processingEntry = {
          ts: processingData.processedTs,
          tx: processingData.processingTxSignature,
          amountProcessed: processingData.amountProcessed,
          lpTokensBurned: processingData.lpTokensBurned,
        };
        
        updateData.$push = {
          processingHistory: processingEntry
        };
      }

      await WithdrawalRequestModel.findOneAndUpdate(
        { requestId },
        updateData,
        { new: true }
      );
      
      // Check if the withdrawal request is completely processed
      await this.checkAndUpdateWithdrawalRequestStatus(requestId);
    } catch (error) {
      console.error('Error updating withdrawal request status:', error);
      throw error;
    }
  }

  async checkAndUpdateWithdrawalRequestStatus(requestId: number): Promise<void> {
    try {
      const withdrawalRequest = await WithdrawalRequestModel.findOne({ requestId });
      
      if (!withdrawalRequest) {
        console.error(`Withdrawal request ${requestId} not found`);
        return;
      }
      
      // Calculate total LP tokens processed
      const totalLpProcessed = withdrawalRequest.processingHistory?.reduce((total, entry) => {
        return total + parseFloat(entry.lpTokensBurned);
      }, 0) || 0;
      
      const requestedLpAmount = parseFloat(withdrawalRequest.requestedLpAmount);
      
      // If all LP tokens have been processed, mark as COMPLETED
      if (totalLpProcessed >= requestedLpAmount) {
        await WithdrawalRequestModel.findOneAndUpdate(
          { requestId },
          { status: WithdrawRequestStatus.COMPLETED },
          { new: true }
        );
        console.log(`Withdrawal request ${requestId} marked as COMPLETED`);
      } else {
        // Otherwise, keep as PROCESSING
        await WithdrawalRequestModel.findOneAndUpdate(
          { requestId },
          { status: WithdrawRequestStatus.PROCESSING },
          { new: true }
        );
        console.log(`Withdrawal request ${requestId} marked as PROCESSING (${totalLpProcessed}/${requestedLpAmount} LP tokens processed)`);
      }
    } catch (error) {
      console.error(`Error checking withdrawal request status for ${requestId}:`, error);
      throw error;
    }
  }
}
