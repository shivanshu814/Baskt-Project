import { Transaction, VersionedTransaction } from '@solana/web3.js';

export interface OnchainLightweightProvider {
  sendAndConfirmV0: (tx: VersionedTransaction) => Promise<string>;
  sendAndConfirmLegacy: (tx: Transaction) => Promise<string>;
}
