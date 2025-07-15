import { BaseClient } from '@baskt/sdk';
import { Connection, Keypair } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { join } from 'path';
import { homedir } from 'os';
import { readFileSync } from 'fs';
import { createQuerier } from '@baskt/querier';

export class SDKClient extends BaseClient {
  public keypair: Keypair;

  constructor() {
    const walletPath = process.env.ANCHOR_WALLET || join(homedir(), '.config', 'solana', 'id.json');
    const walletKeypair = JSON.parse(readFileSync(walletPath, 'utf-8'));
    const keypair = Keypair.fromSecretKey(new Uint8Array(walletKeypair));

    const anchorProvider = new anchor.AnchorProvider(
      new Connection(process.env.SOLANA_RPC_URL || 'http://localhost:8899'),
      new anchor.Wallet(keypair),
      {
        commitment: 'confirmed',
      },
    );

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

export const basktClient: SDKClient = new SDKClient();

export const querierClient = createQuerier(basktClient);
