import { QueryResult } from '../models/types';
import {
  WithdrawQueueItem,
  WithdrawQueueStats,
} from '../types/withdraw-queue';

export class WithdrawQueueQuerier {
  constructor(private sdkClient: any) {}

  async getWithdrawQueue(poolId?: string): Promise<QueryResult<WithdrawQueueItem[]>> {
    try {
      const poolData = await this.sdkClient.getLiquidityPool();

      if (!poolData.withdrawQueueHead || !poolData.withdrawQueueTail) {
        return {
          success: true,
          data: [],
        };
      }

      const queueHead = poolData.withdrawQueueHead.toNumber();
      const queueTail = poolData.withdrawQueueTail.toNumber();

      if (queueHead <= queueTail) {
        return {
          success: true,
          data: [],
        };
      }

      const queueItems: WithdrawQueueItem[] = [];
      let actualTail = queueTail;

      if (queueHead === 2 && queueTail === 0) {
        actualTail = 1;
      } else {
        for (let i = queueTail; i <= queueHead; i++) {
          try {
            const withdrawRequestPDA = await this.sdkClient.findWithdrawRequestPDA(i);
            const withdrawRequest = await this.sdkClient.program.account.withdrawRequest.fetch(
              withdrawRequestPDA,
            );

            if (withdrawRequest) {
              actualTail = i;
              break;
            }
          } catch (error) {
            continue;
          }
        }
      }

      for (let i = actualTail; i <= queueHead; i++) {
        try {
          const withdrawRequestPDA = await this.sdkClient.findWithdrawRequestPDA(i);

          const withdrawRequest = await this.sdkClient.program.account.withdrawRequest.fetch(
            withdrawRequestPDA,
          );

          if (withdrawRequest) {
            const queueItem: WithdrawQueueItem = {
              id: withdrawRequest.id.toString(),
              poolId: poolId || 'default',
              providerAddress: withdrawRequest.provider.toString(),
              lpAmount: withdrawRequest.remainingLp.toString(),
              remainingLp: withdrawRequest.remainingLp.toString(),
              providerTokenAccount: withdrawRequest.providerTokenAccount?.toString() || '',
              queuePosition: i - actualTail + 1,
              status: 'pending',
              requestedAt: new Date(withdrawRequest.requestedTs * 1000).toISOString(),
              tx: 'blockchain-tx',
            };

            queueItems.push(queueItem);
          }
        } catch (error) {
          console.warn(`Failed to fetch withdrawal request ${i}:`, error);
        }
      }

      return {
        success: true,
        data: queueItems,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get withdrawal queue: ${error}`,
      };
    }
  }

  async getWithdrawQueueStats(userAddress?: string): Promise<QueryResult<WithdrawQueueStats>> {
    try {
      const poolData = await this.sdkClient.getLiquidityPool();

      const queueHead = poolData.withdrawQueueHead.toNumber();
      const queueTail = poolData.withdrawQueueTail.toNumber();
      const totalQueueItems = queueHead - queueTail;
      const rateLimitPeriodSecs = poolData.rateLimitPeriodSecs;

      const processingRate = rateLimitPeriodSecs > 0 ? (1 / rateLimitPeriodSecs) * 3600 : 0;
      const averageProcessingTime = rateLimitPeriodSecs > 0 ? rateLimitPeriodSecs / 3600 : 0;

      let userQueuePosition: number | undefined;
      let estimatedWaitTime: number | undefined;

      if (userAddress) {
        try {
          for (let i = queueTail; i < queueHead; i++) {
            const withdrawRequestPDA = await this.sdkClient.findWithdrawRequestPDA(i);
            const withdrawRequest = await this.sdkClient.program.account.withdrawRequest.fetch(
              withdrawRequestPDA,
            );

            if (withdrawRequest && withdrawRequest.provider.toString() === userAddress) {
              userQueuePosition = i - queueTail + 1;
              estimatedWaitTime =
                processingRate > 0 ? userQueuePosition / processingRate : undefined;
              break;
            }
          }
        } catch (error) {
          console.error('Failed to find user queue position:', error);
        }
      }

      const now = Math.floor(Date.now() / 1000);
      const lastReset = poolData.lastRateLimitReset.toNumber();
      const isProcessingNow = now - lastReset < rateLimitPeriodSecs;

      const nextProcessingTime = new Date((lastReset + rateLimitPeriodSecs) * 1000).toISOString();

      const realStats: WithdrawQueueStats = {
        totalQueueItems,
        averageProcessingTime,
        queueProcessingRate: processingRate,
        estimatedWaitTime,
        userQueuePosition,
        isProcessingNow,
        nextProcessingTime,
        processingInterval: rateLimitPeriodSecs / 60,
      };

      return {
        success: true,
        data: realStats,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get withdrawal queue stats: ${error}`,
      };
    }
  }

  async getUserWithdrawQueueItems(
    userAddress: string,
    poolId?: string,
  ): Promise<QueryResult<WithdrawQueueItem[]>> {
    try {
      const allItems = await this.getWithdrawQueue(poolId);

      if (!allItems.success || !allItems.data) {
        return {
          success: true,
          data: [],
        };
      }

      const userItems = allItems.data.filter((item) => item.providerAddress === userAddress);
      console.log('User items:', userItems);
      return {
        success: true,
        data: userItems,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get user withdrawal queue items: ${error}`,
      };
    }
  }
}
