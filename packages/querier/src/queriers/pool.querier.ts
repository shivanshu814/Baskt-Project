import { PublicKey } from '@solana/web3.js';
import { getAccount, getMint } from '@solana/spl-token';
import { QueryResult } from '../models/types';
import { LiquidityPool, PoolDeposit } from '../types/pool';

/**
 * PoolQuerier
 *
 * This class is responsible for fetching liquidity pool data and pool deposits.
 * It provides methods to get pool information and user deposits in the liquidity pool.
 */

export class PoolQuerier {
  constructor(private sdkClient: any) {}

  // get liquidity pool data
  async getLiquidityPool(): Promise<QueryResult<LiquidityPool>> {
    try {

      const poolData = await this.sdkClient.getLiquidityPool();

      const lpMintAccount = await getMint(
        this.sdkClient.connection,
        new PublicKey(poolData.lpMint),
      );
      const lpMint = lpMintAccount?.supply?.toString() || '0';

      return {
        success: true,
        data: {
          totalLiquidity: poolData.totalLiquidity?.toString() || '0',
          totalShares: lpMint || '0',
          depositFeeBps: poolData.depositFeeBps || 0,
          withdrawalFeeBps: poolData.withdrawalFeeBps || 0,
          minDeposit: poolData.minDeposit?.toString() || '0',
          lastUpdateTimestamp: poolData.lastUpdateTimestamp?.toNumber() || 0,
          lpMint: poolData.lpMint?.toString() || '',
          tokenVault: poolData.usdcVault?.toString() || '',
          bump: poolData.bump || 0,
          withdrawQueueHead: poolData.withdrawQueueHead?.toNumber() || 0,
          withdrawQueueTail: poolData.withdrawQueueTail?.toNumber() || 0,
          pendingLpTokens: poolData.pendingLpTokens?.toString() || '0',
          withdrawRateLimitBps: poolData.withdrawRateLimitBps || 0,
          rateLimitPeriodSecs: poolData.rateLimitPeriodSecs || 0,
          lastRateLimitReset: poolData.lastRateLimitReset?.toNumber() || 0,
          withdrawnInWindow: poolData.withdrawnInWindow?.toString() || '0',
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
    try {

      const poolData = await this.sdkClient.getLiquidityPool();
      const lpMint = new PublicKey(poolData.lpMint);

      // Try to get token accounts, but handle the case where getProgramAccounts is not supported
      let tokenAccounts: any[] = [];
      try {
        tokenAccounts = await this.sdkClient.connection.getProgramAccounts(
          new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          {
            filters: [
              {
                memcmp: {
                  offset: 0,
                  bytes: lpMint.toBase58(),
                },
              },
            ],
          },
        );
      } catch (getAccountsError: any) {
        // If getProgramAccounts is not supported, return empty deposits with a message
        if (getAccountsError.code === -32010) {
          return {
            success: true,
            data: [],
          };
        }
        throw getAccountsError;
      }

      const deposits = await Promise.all(
        tokenAccounts.map(async (account: any) => {
          const tokenAccount = await getAccount(this.sdkClient.connection, account.pubkey);
          if (tokenAccount.amount?.toString() === '0') return null;
          const sharePercentage =
            (Number(tokenAccount.amount?.toString() || '0') /
              Number(poolData.totalShares?.toString() || '0')) *
            100;
          const usdcValue = Number(tokenAccount.amount?.toString() || '0') / 1_000_000;
          return {
            address: tokenAccount.owner?.toString() || '',
            usdcDeposit: usdcValue,
            sharePercentage: sharePercentage.toFixed(2),
            lpTokens: Number(tokenAccount.amount?.toString() || '0') / 1_000_000,
          };
        }),
      );
      const validDeposits = deposits
        .filter((deposit): deposit is NonNullable<typeof deposit> => deposit !== null)
        .sort((a, b) => b.usdcDeposit - a.usdcDeposit);
      return {
        success: true,
        data: validDeposits,
      };
    } catch (error) {
      console.error('Error fetching pool deposits:', error);
      return {
        success: false,
        error: 'Failed to fetch pool deposits',
      };
    }
  }
}
