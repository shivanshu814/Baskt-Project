import { BaseClient } from '@baskt/sdk';
import { Connection, Keypair } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

export class SDKClient extends BaseClient {
  public keypair: Keypair;

  constructor() {
    const keypair = Keypair.generate();
    const anchorProvider = new anchor.AnchorProvider(
      new Connection(process.env.SOLANA_RPC_URL || 'http://localhost:8899'),
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
