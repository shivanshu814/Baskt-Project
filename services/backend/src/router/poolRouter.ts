import { publicProcedure, router } from '../trpc/trpc';
import { sdkClient } from '../utils';
import { PublicKey } from '@solana/web3.js';

const sdkClientInstance = sdkClient();

export const poolRouter = router({
  getLiquidityPool: publicProcedure.query(async () => {
    try {
      const [liquidityPoolPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('liquidity_pool'), sdkClientInstance.protocolPDA.toBuffer()],
        sdkClientInstance.program.programId,
      );

      const poolData = await sdkClientInstance.getLiquidityPool(liquidityPoolPDA);

      return {
        success: true,
        data: {
          totalLiquidity: poolData.totalLiquidity.toString(),
          totalShares: poolData.totalShares.toString(),
          depositFeeBps: poolData.depositFeeBps,
          withdrawalFeeBps: poolData.withdrawalFeeBps,
          minDeposit: poolData.minDeposit.toString(),
          lastUpdateTimestamp: poolData.lastUpdateTimestamp,
          lpMint: poolData.lpMint.toString(),
          tokenVault: poolData.tokenVault.toString(),
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
});
