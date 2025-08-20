import { Querier } from '@baskt/querier';
import { BaseClient } from '@baskt/sdk';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair } from '@solana/web3.js';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import logger from './logger';

export class SDKClient extends BaseClient {
  public keypair: Keypair;

  constructor() {
    const walletPath = process.env.ANCHOR_WALLET || join(homedir(), '.config', 'solana', 'id.json');
    const walletKeypair = JSON.parse(readFileSync(walletPath, 'utf-8'));
    const keypair = Keypair.fromSecretKey(new Uint8Array(walletKeypair));

    const anchorProvider = new anchor.AnchorProvider(
      new Connection(process.env.SOLANA_RPC_URL || 'http://localhost:8899', {
        disableRetryOnRateLimit: true,
      }),
      new anchor.Wallet(keypair),
    );
    super(
      anchorProvider.connection,
      {
        sendAndConfirmLegacy: (tx) => {
          logger.error('sendAndConfirmLegacy not implemented');
          return Promise.resolve('');
        },
        sendAndConfirmV0: (tx) => {
          logger.error('sendAndConfirmV0 not implemented');
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

export const querier = Querier.getInstance(sdkClient());

export const initializeQuerier = async () => {
  try {
    await querier.init();
    logger.info('Backend Querier initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Backend Querier:', error);
    throw error;
  }
};

export const shutdownQuerier = async () => {
  try {
    await querier.shutdown();
    logger.info('Backend Querier shutdown successfully');
  } catch (error) {
    logger.error('Error during Backend Querier shutdown:', error);
    throw error;
  }
};
