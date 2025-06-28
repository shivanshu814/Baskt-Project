import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { USDC_MINT } from '@baskt/sdk';

const withdrawBlp = async (args: string[]) => {
  try {
    if (args.length < 1) {
      throw new Error('Usage: withdraw-blp <amount>');
    }

    const withdrawAmount = new BN(parseFloat(args[0]) * 1e6);
    console.log('Withdrawing amount:', withdrawAmount.toString());

    const protocolAccount = await client.getProtocolAccount();
    if (!protocolAccount) {
      throw new Error('Protocol account not found');
    }

    const userTokenAccount = await client.getUSDCAccount(client.getPublicKey());
    const liquidityPool = await client.findLiquidityPoolPDA();
    const poolData = await client.getLiquidityPool();
    if (!poolData) {
      throw new Error('Pool data not found');
    }

    const userLpAccount = await client.getUserTokenAccount(
      client.getPublicKey(),
      new PublicKey(poolData.lpMint),
    );
    console.log('Your LP balance:', userLpAccount.amount.toString());

    if (new BN(userLpAccount.amount.toString()).lt(withdrawAmount)) {
      throw new Error('Insufficient LP token balance for withdrawal');
    }

    const treasuryTokenAccount = getAssociatedTokenAddressSync(
      USDC_MINT,
      protocolAccount.treasury,
    );

    const minUsdcOut = new BN(0);

    const tx = await client.removeLiquidity(
      liquidityPool,
      withdrawAmount,
      minUsdcOut,
      userTokenAccount.address,
      new PublicKey(poolData.tokenVault),
      userLpAccount.address,
      new PublicKey(poolData.lpMint),
      treasuryTokenAccount,
      protocolAccount.treasury,
    );

    console.log('Withdrawal successful! Transaction:', tx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

withdrawBlp.description = 'Withdraws USDC from the BLP pool. Usage: withdraw-blp <amount>';
withdrawBlp.aliases = ['wb'];

export default withdrawBlp;
