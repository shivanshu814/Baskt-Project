import { BaseClient } from '@baskt/sdk';
import { Connection, Keypair } from '@solana/web3.js';

export class SDKClient extends BaseClient {
  public keypair: Keypair;
  constructor() {
    const keypair = Keypair.generate();
    super(
      new Connection(process.env.SOLANA_RPC_URL || 'http://localhost:8899'),
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
    );
    this.keypair = keypair;
  }

  public getPublicKey() {
    return this.keypair.publicKey;
  }
}

export const sdkClient = new SDKClient();
