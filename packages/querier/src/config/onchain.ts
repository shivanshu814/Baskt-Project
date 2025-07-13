import { Connection, Keypair } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import dotenv from 'dotenv';

dotenv.config();

const RETRY_CONFIG = {
  maxAttempts: 5,
  initialDelay: 1 * 1000,
  maxDelay: 30 * 1000,
  backoffMultiplier: 2,
};

const calculateDelay = (attempt: number): number => {
  const delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export interface OnchainConfig {
  connection: Connection;
  provider: AnchorProvider;
  program: any; // Will be properly typed when we have the correct IDL
}

let onchainConfig: OnchainConfig | null = null;

export const getOnchainConfig = (): OnchainConfig => {
  if (onchainConfig) {
    return onchainConfig;
  }

  const cluster = process.env.ANCHOR_PROVIDER_URL || 'http://127.0.0.1:8899';
  const connection = new Connection(cluster, 'confirmed');

  // Create a dummy wallet for read-only operations
  const keypair = Keypair.generate();
  const wallet = {
    publicKey: keypair.publicKey,
    signTransaction: async (tx: any) => {
      tx.partialSign(keypair);
      return tx;
    },
    signAllTransactions: async (txs: any[]) => {
      return txs.map((tx) => {
        tx.partialSign(keypair);
        return tx;
      });
    },
  };

  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });

  // For now, we'll create a placeholder program
  // This will be properly implemented when we have the correct IDL
  const program = {} as any;

  onchainConfig = {
    connection,
    provider,
    program,
  };

  return onchainConfig;
};

export const connectOnchain = async (): Promise<void> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      const config = getOnchainConfig();
      await config.connection.getLatestBlockhash();
      console.log('Onchain connection established successfully');
      return;
    } catch (error) {
      lastError = error as Error;
      console.error(
        `Onchain connection attempt ${attempt}/${RETRY_CONFIG.maxAttempts} failed:`,
        error,
      );

      if (attempt < RETRY_CONFIG.maxAttempts) {
        const delay = calculateDelay(attempt);
        console.log(`Retrying in ${delay}ms...`);
        await wait(delay);
      }
    }
  }

  console.error('Onchain connection failed after all retry attempts');
  throw lastError;
};
