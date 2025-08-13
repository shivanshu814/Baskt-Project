import { BaseClient } from '@baskt/sdk';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { createQuerier, Querier } from '@baskt/querier';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Following guardian's pattern
export class ExecutionClient extends BaseClient {
  public keypair: Keypair;

  constructor() {
    const walletPath = process.env.ANCHOR_WALLET || join(homedir(), '.config', 'solana', 'id.json');
    const walletKeypair = JSON.parse(readFileSync(walletPath, 'utf-8'));
    const keypair = Keypair.fromSecretKey(new Uint8Array(walletKeypair));

    const anchorProvider = new anchor.AnchorProvider(
      new Connection(process.env.SOLANA_RPC_URL || 'http://localhost:8899'),
      new anchor.Wallet(keypair),
      { commitment: 'confirmed' }
    );

    super(
      anchorProvider.connection,
      {
        sendAndConfirmLegacy: (tx) => anchorProvider.sendAndConfirm(tx),
        sendAndConfirmV0: (tx) => anchorProvider.sendAndConfirm(tx),
      },
      keypair.publicKey,
      anchorProvider
    );

    this.keypair = keypair;
  }

  public getPublicKey(): PublicKey {
    return this.keypair.publicKey;
  }
}

// Export lazy-initialized clients directly
// They'll be created on first import AFTER env vars are loaded
export let basktClient: ExecutionClient;
export let querierClient: Querier;

// Initialize function to be called after env vars are loaded
export function initializeClients() {
  basktClient = new ExecutionClient();
  querierClient = createQuerier(basktClient);
}