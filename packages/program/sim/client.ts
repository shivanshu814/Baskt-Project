import { BaseClient } from '@baskt/sdk';
import { Keypair } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { getProvider } from '../scripts/utils';

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
}

export const { provider, wallet, program } = getProvider();

export const client = new SimClient(provider.wallet.payer!, provider.connection);
