import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';
import { TestClient } from '../../../tests/utils/test-client';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { USDC_MINT } from '@baskt/sdk';

const depositBlp = async (args: string[]) => {
  try {
    if (args.length < 1) {
      throw new Error('Usage: deposit-blp <amount>');
    }

    const depositAmount = new BN(parseFloat(args[0]) * 1e6);
    console.log('Depositing amount:', depositAmount.toString());

    const protocolAccount = await client.getProtocolAccount();
    if (!protocolAccount) {
      throw new Error('Protocol account not found');
    }

    const userTokenAccount = await client.getUSDCAccount(client.getPublicKey());

    const liquidityPool = await client.liquidityPoolPDA;
    const poolData = await client.getLiquidityPool();
    if (!poolData) {
      throw new Error('Pool data not found');
    }

    const userLPAta = getAssociatedTokenAddressSync(
      new PublicKey(poolData.lpMint),
      client.getPublicKey(),
    );

    const itx = [];

    try {
      await client.getUserTokenAccount(client.getPublicKey(), new PublicKey(poolData.lpMint));
    } catch (error) {
      const createAtaIx = createAssociatedTokenAccountInstruction(
        client.getPublicKey(),
        userLPAta,
        client.getPublicKey(),
        new PublicKey(poolData.lpMint),
      );
      itx.push(createAtaIx);
    }

    const treasuryTokenAccount = getAssociatedTokenAddressSync(
      USDC_MINT,
      protocolAccount.treasury,
    );

    const minSharesOut = new BN(0);

    const tx = await client.addLiquidityWithItx(
      liquidityPool,
      depositAmount,
      minSharesOut,
      userTokenAccount.address,
      new PublicKey(poolData.usdcVault),
      userLPAta,
      new PublicKey(poolData.lpMint),
      treasuryTokenAccount,
      protocolAccount.treasury,
      itx,
    );

    console.log('Deposit successful! Transaction:', tx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

depositBlp.description = 'Deposits USDC into the BLP pool. Usage: deposit-blp <amount>';
depositBlp.aliases = ['deposit'];

export default depositBlp;
