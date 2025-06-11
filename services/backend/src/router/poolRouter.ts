import { publicProcedure, router } from '../trpc/trpc';
import { sdkClient } from '../utils';
import { PublicKey } from '@solana/web3.js';
import { getAccount } from '@solana/spl-token';

const sdkClientInstance = sdkClient();

export const poolRouter = router({
  getLiquidityPool: publicProcedure.query(async () => {
    try {
      const [liquidityPoolPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('liquidity_pool'), sdkClientInstance.protocolPDA.toBuffer()],
        sdkClientInstance.program.programId,
      );

      const poolData = await sdkClientInstance.getLiquidityPool();
      return {
        success: true,
        data: {
          totalLiquidity: poolData.totalLiquidity.toString(),
          totalShares: poolData.totalShares.toString(),
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
  }),

  getPoolDeposits: publicProcedure.query(async () => {
    try {
      // Get liquidity pool PDA
      const [liquidityPoolPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('liquidity_pool'), sdkClientInstance.protocolPDA.toBuffer()],
        sdkClientInstance.program.programId,
      );

      // Get pool data
      const poolData = await sdkClientInstance.getLiquidityPool();

      // Get all token accounts for the LP mint
      const lpMint = new PublicKey(poolData.lpMint);
      const tokenAccounts = await sdkClientInstance.connection.getProgramAccounts(
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token program ID
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

      // Process each token account to get holder info
      const deposits = await Promise.all(
        tokenAccounts.map(async (account) => {
          const tokenAccount = await getAccount(sdkClientInstance.connection, account.pubkey);
          if (tokenAccount.amount.toString() === '0') return null;

          // Calculate share percentage
          const sharePercentage =
            (Number(tokenAccount.amount.toString()) / Number(poolData.totalShares.toString())) *
            100;

          // Calculate USDC value (assuming 1:1 ratio with LP tokens)
          const usdcValue = Number(tokenAccount.amount.toString()) / 1_000_000; // Convert from raw to USDC

          return {
            address: tokenAccount.owner.toString(),
            usdcDeposit: usdcValue,
            sharePercentage: sharePercentage.toFixed(2),
            lpTokens: Number(tokenAccount.amount.toString()) / 1_000_000,
          };
        }),
      );

      // Filter out null values and sort by deposit amount
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
  }),
});
