import { BaseClient } from '@baskt/sdk';
import { Connection, Keypair } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { join } from 'path';
import { homedir } from 'os';
import { readFileSync } from 'fs';

export class SDKClient extends BaseClient {
  public keypair: Keypair;

  constructor() {
    const walletPath = process.env.ANCHOR_WALLET || join(homedir(), '.config', 'solana', 'id.json');
    const walletKeypair = JSON.parse(readFileSync(walletPath, 'utf-8'));
    const keypair = Keypair.fromSecretKey(new Uint8Array(walletKeypair));

    const anchorProvider = new anchor.AnchorProvider(
      new Connection(process.env.SOLANA_RPC_URL || 'http://localhost:8899', {
        disableRetryOnRateLimit: true
      }),
      new anchor.Wallet(keypair),
    );
    super(
      anchorProvider.connection,
      {
        sendAndConfirmLegacy: (tx) => {
          console.error('sendAndConfirmLegacy not implemented');
          return Promise.resolve('');
        },
        sendAndConfirmV0: (tx) => {
          console.error('sendAndConfirmV0 not implemented');
          return Promise.resolve('');
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
}

let sdkClientInstance: SDKClient | null = null;

export const sdkClient = () => {
  if (!sdkClientInstance) {
    sdkClientInstance = new SDKClient();
  }
  return sdkClientInstance;
};
