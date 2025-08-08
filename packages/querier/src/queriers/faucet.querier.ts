import { Keypair, PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccount,
  getAccount,
  getMint,
  mintTo,
} from '@solana/spl-token';
import { QueryResult } from '../models/types';
import { FaucetResult, AutoFaucetResult, FaucetStatus, FaucetSendParams, AutoFaucetParams } from '../types/faucet';
import { USDC_MINT } from '@baskt/sdk';
// USDC mint address
const USDC_DECIMALS = 6;

// Mint authority keypair (this should be moved to environment variables)
const mintAuthority = Keypair.fromSecretKey(
  Buffer.from(
    'uXb1D9H0qDO4o0EvSy6U0QB0seqk7gnpWpNJAQNXvFV/BE6Rod1zMqIb44vJgTFUtVrC1tZK+u+6MedlEk+k+w==',
    'base64',
  ),
);

/**
 * FaucetQuerier
 *
 * This class is responsible for sending USDC to a recipient wallet.
 * It is used to send USDC to a recipient wallet.
 */

export class FaucetQuerier {
  private sdkClient: any;

  constructor(sdkClient: any) {
    this.sdkClient = sdkClient;
  }

  // send USDC to a recipient wallet
  async sendUSDC(params: FaucetSendParams): Promise<FaucetResult> {
    try {
      const { recipient, amount } = params;
      const recipientPk = new PublicKey(recipient);
      const client = this.sdkClient;
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
        mintAuthority,
        mintAmount,
      );

      await connection.confirmTransaction(signature, 'confirmed');
      return { success: true, signature };
    } catch (error: any) {
      console.error('Faucet error:', error);
      return { success: false, error: error.message || 'Faucet failed' };
    }
  }

  // auto faucet USDC to a recipient wallet
  async autoFaucet(params: AutoFaucetParams): Promise<AutoFaucetResult> {
    try {
      const { recipient } = params;
      const recipientPk = new PublicKey(recipient);
      const client = this.sdkClient;
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
        mintAuthority,
        mintAmount,
      );

      await connection.confirmTransaction(signature, 'confirmed');
      return { success: true, signature, amount };
    } catch (error: any) {
      console.error('Auto faucet error:', error);
      return { success: false, error: error.message || 'Auto faucet failed' };
    }
  }

  // get faucet status
  async getFaucetStatus(): Promise<QueryResult<FaucetStatus>> {
    try {
      return {
        success: true,
        data: {
          isEnabled: true,
          maxAmount: 1000000, // 1M USDC max
          autoAmount: 100000, // 100K USDC auto
          usdcMint: USDC_MINT.toString(),
        },
      };
    } catch (error) {
      console.error('Error getting faucet status:', error);
      return {
        success: false,
        error: 'Failed to get faucet status',
      };
    }
  }
}
