import { BaseClient } from '@baskt/sdk';
import { WithdrawRequestStatus } from '@baskt/types';
import {
  LiquidityDepositModel,
  LiquidityPoolModel,
  WithdrawalRequestModel,
} from '../models/mongodb';
import { QueryResult } from '../models/types';
import { LiquidityDeposit, WithdrawalRequest } from '../types';
import { LiquidityPoolMetadata } from '../types/models/LiquidityPool';
import { LiquidityPool, PoolDeposit } from '../types/pool';
import { ProtocolQuerier } from './protocol.querier';

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
      const data = await LiquidityPoolModel.findOne({
        poolAddress: liquidityPoolPDA.toString(),
      }).lean<LiquidityPoolMetadata>();
      const protocolMetadata = await ProtocolQuerier.getInstance(
        this.sdkClient,
      ).getProtocolMetadata();
      const minDeposit = protocolMetadata?.config.minLiquidity;
      const [tokenVault] = await this.sdkClient.getUsdcVaultPda();

      if (!data) {
        try {
          await this.resyncLiquidityPool();

          const syncedData = await LiquidityPoolModel.findOne({
            poolAddress: liquidityPoolPDA.toString(),
          }).lean<LiquidityPoolMetadata>();

          if (syncedData) {

            return {
              success: true,
              data: {
                tokenVault: tokenVault.toString(),
                minDeposit: minDeposit?.toString() || '0',
                ...syncedData,
              },
            };
          }
        } catch (syncError) {
          console.log(`[PoolQuerier] Failed to sync liquidity pool:`, syncError);
        }

        return {
          success: false,
          error: 'Liquidity pool not found and sync failed',
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
      console.log(`[PoolQuerier] Error fetching liquidity pool:`, error);

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

  // get user deposits
  async getUserDeposits(userAddress: string): Promise<
    QueryResult<{
      deposits: any[];
      totalDeposits: number;
      totalShares: number;
      depositCount: number;
    }>
  > {
    try {
      const deposits = await LiquidityDepositModel.find({
        provider: userAddress,
      }).lean<LiquidityDeposit[]>();

      const totalDeposits = deposits.reduce((total, deposit) => {
        return total + deposit.netDeposit.toNumber() / 1000000;
      }, 0);

      const totalShares = deposits.reduce((total, deposit) => {
        return total + deposit.sharesMinted.toNumber() / 1000000;
      }, 0);

      return {
        success: true,
        data: {
          deposits,
          totalDeposits,
          totalShares,
          depositCount: deposits.length,
        },
      };
    } catch (error) {
      console.log(`[PoolQuerier] Error fetching user deposits:`, error);
      return {
        success: false,
        error: 'Failed to fetch user deposits',
      };
    }
  }

  // get all users deposits for full data
  async getAllUsersDeposits(): Promise<QueryResult<any[]>> {
    try {
      const deposits = await LiquidityDepositModel.aggregate([
        {
          $group: {
            _id: '$provider',
            totalDeposit: { $sum: { $toDouble: '$netDeposit' } },
            totalShares: { $sum: { $toDouble: '$sharesMinted' } },
            depositCount: { $sum: 1 },
            lastDeposit: { $max: '$timestamp' },
          },
        },
        {
          $project: {
            userAddress: '$_id',
            depositAmount: { $divide: ['$totalDeposit', 1000000] },
            shares: { $divide: ['$totalShares', 1000000] },
            depositCount: 1,
            lastDeposit: 1,
          },
        },
      ]).exec();

      return {
        success: true,
        data: deposits,
      };
    } catch (error) {
      console.log(`[PoolQuerier] Error fetching all users deposits:`, error);
      return {
        success: false,
        error: 'Failed to fetch all users deposits',
      };
    }
  }

  // get user withdrawal data
  async getUserWithdrawals(userAddress: string): Promise<QueryResult<any[]>> {
    try {
      const withdrawals = await WithdrawalRequestModel.find({
        provider: userAddress,
        status: { $in: ['QUEUED', 'PROCESSING', 'COMPLETED'] },
      }).lean();

      return {
        success: true,
        data: withdrawals,
      };
    } catch (error) {
      console.log(`[PoolQuerier] Error fetching user withdrawals:`, error);
      return {
        success: false,
        error: 'Failed to fetch user withdrawals',
      };
    }
  }

  // get all users withdrawal data for full data
  async getAllUsersWithdrawals(): Promise<QueryResult<any[]>> {
    try {
      const withdrawals = await WithdrawalRequestModel.aggregate([
        {
          $match: {
            status: { $in: ['QUEUED', 'PROCESSING', 'COMPLETED'] },
          },
        },
        {
          $group: {
            _id: '$provider',
            totalRequested: { $sum: { $toDouble: '$requestedLpAmount' } },
            totalRemaining: { $sum: { $toDouble: '$remainingLp' } },
            withdrawalCount: { $sum: 1 },
            lastWithdrawal: { $max: '$requestedAt.ts' },
          },
        },
        {
          $project: {
            userAddress: '$_id',
            LPBalance: { $divide: ['$totalRemaining', 1000000] },
            totalRequested: { $divide: ['$totalRequested', 1000000] },
            withdrawalCount: 1,
            lastWithdrawal: 1,
          },
        },
      ]).exec();

      return {
        success: true,
        data: withdrawals,
      };
    } catch (error) {
      console.log(`[PoolQuerier] Error fetching all users withdrawals:`, error);
      return {
        success: false,
        error: 'Failed to fetch all users withdrawals',
      };
    }
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
        { upsert: true, new: true },
      );
    } catch (error) {
      console.log(`[PoolQuerier] Error resyncing liquidity pool:`, error);
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
      console.log(`[PoolQuerier] Error creating liquidity deposit:`, error);
      throw error;
    }
  }

  async createWithdrawalRequest(withdrawalRequest: WithdrawalRequest): Promise<void> {
    try {
      console.log('withdrawalRequest', withdrawalRequest);
      await WithdrawalRequestModel.create(withdrawalRequest);
    } catch (error) {
      console.log(`[PoolQuerier] Error creating withdrawal request:`, error);
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
    },
  ): Promise<void> {
    try {
      const updateData: any = { status };

      if (processingData) {
        updateData['processedAt.processedTs'] = processingData.processedTs;
        updateData['processedAt.tx'] = processingData.processingTxSignature;

        const processingEntry = {
          ts: processingData.processedTs,
          tx: processingData.processingTxSignature,
          amountProcessed: processingData.amountProcessed,
          lpTokensBurned: processingData.lpTokensBurned,
        };

        updateData.$push = {
          processingHistory: processingEntry,
        };
      }

      await WithdrawalRequestModel.findOneAndUpdate({ requestId }, updateData, { new: true });

      await this.checkAndUpdateWithdrawalRequestStatus(requestId);
    } catch (error) {
      console.log(`[PoolQuerier] Error updating withdrawal request status:`, error);
      throw error;
    }
  }

  async checkAndUpdateWithdrawalRequestStatus(requestId: number): Promise<void> {
    try {
      const withdrawalRequest = await WithdrawalRequestModel.findOne({ requestId }).lean<WithdrawalRequest>();

      if (!withdrawalRequest) {
        console.log(`[PoolQuerier] Withdrawal request ${requestId} not found`);
        return;
      }

      const totalLpProcessed =
        withdrawalRequest.processingHistory?.reduce((total, entry) => {
          return total + entry.lpTokensBurned.toNumber();
        }, 0) || 0;

      const requestedLpAmount = withdrawalRequest.requestedLpAmount.toNumber();

      if (totalLpProcessed >= requestedLpAmount) {
        await WithdrawalRequestModel.findOneAndUpdate(
          { requestId },
          { status: WithdrawRequestStatus.COMPLETED },
          { new: true },
        );
        console.log(`Withdrawal request ${requestId} marked as COMPLETED`);
      } else {
        await WithdrawalRequestModel.findOneAndUpdate(
          { requestId },
          { status: WithdrawRequestStatus.PROCESSING },
          { new: true },
        );
        console.log(
          `Withdrawal request ${requestId} marked as PROCESSING (${totalLpProcessed}/${requestedLpAmount} LP tokens processed)`,
        );
      }
    } catch (error) {
      console.log(
        `[PoolQuerier] Error checking withdrawal request status for ${requestId}:`,
        error,
      );
      throw error;
    }
  }
}
