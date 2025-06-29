import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccount,
  getAccount,
  getMint,
  mintTo,
} from '@solana/spl-token';
import { sdkClient } from '../../utils';
import { USDC_MINT } from '@baskt/sdk';

const USDC_DECIMALS = 6;

const minuAuthority = Keypair.fromSecretKey(
  Buffer.from(
    'uXb1D9H0qDO4o0EvSy6U0QB0seqk7gnpWpNJAQNXvFV/BE6Rod1zMqIb44vJgTFUtVrC1tZK+u+6MedlEk+k+w==',
    'base64',
  ),
);
//  send usdc to a user
export const faucet = publicProcedure
  .input(
    z.object({
      recipient: z.string().min(32),
      amount: z.number().positive(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const { recipient, amount } = input;
      const recipientPk = new PublicKey(recipient);
      const client = sdkClient();
      const connection = client.connection;
      const payer = client.keypair;

      const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, recipientPk);

      try {
        await getAccount(connection, userTokenAccount);
      } catch (error) {
        await createAssociatedTokenAccount(connection, payer, USDC_MINT, recipientPk);
      }

      const mintAmount = amount * 10 ** USDC_DECIMALS;

      const usdcMintAccount = await getMint(connection, USDC_MINT);
      if (!usdcMintAccount) {
        throw new Error('USDC mint account not found');
      }

      const signature = await mintTo(
        connection,
        payer,
        USDC_MINT,
        userTokenAccount,
        minuAuthority,
        mintAmount,
      );

      await connection.confirmTransaction(signature, 'confirmed');
      return { success: true, signature };
    } catch (error: any) {
      console.error('Faucet error:', error);
      return { success: false, error: error.message || 'Faucet failed' };
    }
  });

// automatic faucet when code is used - sends 100,000 USDC
export const autoFaucet = publicProcedure
  .input(
    z.object({
      recipient: z.string().min(32),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const { recipient } = input;
      const recipientPk = new PublicKey(recipient);
      const client = sdkClient();
      const connection = client.connection;
      const payer = client.keypair;

      // Auto amount: 100,000 USDC
      const amount = 100000;

      try {
        const balance = await connection.getBalance(payer.publicKey);
        if (balance < 1000000) {
          const airdropSig = await connection.requestAirdrop(payer.publicKey, 1000000000);
          await connection.confirmTransaction(airdropSig, 'confirmed');
        }
      } catch (error) {
        console.error('Error funding payer:', error);
      }

      const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, recipientPk);

      try {
        await getAccount(connection, userTokenAccount);
      } catch (error) {
        await createAssociatedTokenAccount(connection, payer, USDC_MINT, recipientPk);
      }

      const mintAmount = amount * 10 ** USDC_DECIMALS;

      const usdcMintAccount = await getMint(connection, USDC_MINT);
      if (!usdcMintAccount) {
        throw new Error('USDC mint account not found');
      }

      const signature = await mintTo(
        connection,
        payer,
        USDC_MINT,
        userTokenAccount,
        minuAuthority,
        mintAmount,
      );

      await connection.confirmTransaction(signature, 'confirmed');
      return { success: true, signature, amount };
    } catch (error: any) {
      console.error('Auto faucet error:', error);
      return { success: false, error: error.message || 'Auto faucet failed' };
    }
  });
