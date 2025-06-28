import { publicProcedure } from '../../trpc/trpc';
import { sdkClient } from '../../utils';
import { PublicKey } from '@solana/web3.js';
import { getAccount, getMint } from '@solana/spl-token';

const sdkClientInstance = sdkClient();

export const getLiquidityPool = publicProcedure.query(async () => {
  try {
    const [liquidityPoolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('liquidity_pool'), sdkClientInstance.protocolPDA.toBuffer()],
      sdkClientInstance.program.programId,
    );

    const poolData = await sdkClientInstance.getLiquidityPool();

    const lpMintAccount = await getMint(sdkClientInstance.connection, new PublicKey(poolData.lpMint));
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
});

export const getPoolDeposits = publicProcedure.query(async () => {
  try {
    const [liquidityPoolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('liquidity_pool'), sdkClientInstance.protocolPDA.toBuffer()],
      sdkClientInstance.program.programId,
    );

    const poolData = await sdkClientInstance.getLiquidityPool();
    const lpMint = new PublicKey(poolData.lpMint);
    const tokenAccounts = await sdkClientInstance.connection.getProgramAccounts(
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

    const deposits = await Promise.all(
      tokenAccounts.map(async (account) => {
        const tokenAccount = await getAccount(sdkClientInstance.connection, account.pubkey);
        if (tokenAccount.amount.toString() === '0') return null;
        const sharePercentage =
          (Number(tokenAccount.amount.toString()) / Number(poolData.totalShares.toString())) * 100;
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
});

export const getRouter = {
  getLiquidityPool,
  getPoolDeposits,
};
