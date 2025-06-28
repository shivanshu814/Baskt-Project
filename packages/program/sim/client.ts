import { BaseClient, USDC_MINT } from '@baskt/sdk';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { getProvider } from '../scripts/utils';
import {
  createAssociatedTokenAccount,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  mintTo,
} from '@solana/spl-token';

class SimClient extends BaseClient {
  public keypair: Keypair;

  constructor(keypair: Keypair, connection: Connection) {
    const anchorProvider = new anchor.AnchorProvider(connection, new anchor.Wallet(keypair));
    super(
      anchorProvider.connection,
      {
        sendAndConfirmLegacy: (tx) => {
          return anchorProvider.sendAndConfirm(tx);
        },
        sendAndConfirmV0: (tx) => {
          return anchorProvider.sendAndConfirm(tx);
        },
      },
      keypair.publicKey,
      anchorProvider,
    );
    this.keypair = keypair;
  }

  public getPublicKey() {
    return this.keypair.publicKey;
  }

  public async mintUSDC(destination: PublicKey, amount: number | anchor.BN): Promise<string> {
    const provider = this.program.provider as anchor.AnchorProvider;
    const payer = provider.wallet.payer as Keypair;
    // Convert amount for minting
    const mintAmount = typeof amount === 'number' ? amount : BigInt(amount.toString());

    const usdcMintAccount = await getMint(provider.connection, USDC_MINT);
    if (!usdcMintAccount) {
      throw new Error('USDC mint account not found');
    }

    // Mint USDC tokens to the destination account
    const signature = await mintTo(
      provider.connection,
      payer, // Payer for transaction fees
      USDC_MINT,
      destination,
      payer, // Use our controlled mint authority
      mintAmount,
    );
    await provider.connection.confirmTransaction(signature, 'confirmed');
    return signature;
  }

  public async getOrCreateUSDCAccount(owner: PublicKey): Promise<PublicKey> {

    // Find the associated token address
    const tokenAccount = await getAssociatedTokenAddress(USDC_MINT, owner);

    try {
      // Check if account exists
      await getAccount(this.program.provider.connection, tokenAccount);
      return tokenAccount;
    } catch (error) {
      // If account doesn't exist, create it
      const provider = this.program.provider as anchor.AnchorProvider | undefined;
      if (!provider) {
        throw new Error('Provider is undefined');
      }
      const payer = provider.wallet.payer as Keypair;
      await createAssociatedTokenAccount(provider.connection, payer, USDC_MINT, owner);
      return tokenAccount;
    }
  }
}

export const { provider, wallet, program } = getProvider();

export const client = new SimClient(provider.wallet.payer!, provider.connection);
