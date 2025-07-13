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
      const [liquidityPoolPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('liquidity_pool'), this.sdkClient.protocolPDA.toBuffer()],
        this.sdkClient.program.programId,
      );

      const poolData = await this.sdkClient.getLiquidityPool();

      const lpMintAccount = await getMint(
        this.sdkClient.connection,
        new PublicKey(poolData.lpMint),
      );
      const lpMint = lpMintAccount?.supply.toString();

      return {
        success: true,
        data: {
          totalLiquidity: poolData.totalLiquidity.toString(),
          totalShares: lpMint,
          depositFeeBps: poolData.depositFeeBps,
          withdrawalFeeBps: poolData.withdrawalFeeBps,
          minDeposit: poolData.minDeposit.toString(),
          lastUpdateTimestamp: poolData.lastUpdateTimestamp.toNumber(),
          lpMint: poolData.lpMint.toString(),
          tokenVault: poolData.tokenVault.toString(),
          bump: poolData.bump,
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
      const [liquidityPoolPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('liquidity_pool'), this.sdkClient.protocolPDA.toBuffer()],
        this.sdkClient.program.programId,
      );

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
          if (tokenAccount.amount.toString() === '0') return null;
          const sharePercentage =
            (Number(tokenAccount.amount.toString()) / Number(poolData.totalShares.toString())) *
            100;
          const usdcValue = Number(tokenAccount.amount.toString()) / 1_000_000;
          return {
            address: tokenAccount.owner.toString(),
            usdcDeposit: usdcValue,
            sharePercentage: sharePercentage.toFixed(2),
            lpTokens: Number(tokenAccount.amount.toString()) / 1_000_000,
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
