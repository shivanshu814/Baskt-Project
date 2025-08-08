import { Commitment, Connection, TransactionSignature } from '@solana/web3.js';

const DEFAULT_COMMITMENT: Commitment = 'confirmed';

/**
 * Waits for a transaction to reach the specified commitment level.
 * @param conn The Solana connection object.
 * @param sig The transaction signature to wait for.
 * @param commitment The commitment level to wait for (default: 'confirmed').
 * @returns A promise that resolves when the transaction is confirmed.
 */
export async function waitForTx(
  conn: Connection,
  sig: TransactionSignature,
  commitment: Commitment = DEFAULT_COMMITMENT,
): Promise<void> {
  // Use signature-only confirmation to avoid fetching a fresh block-hash that
  // may not match the one the transaction was originally processed with. This
  // reduces RPC load and prevents needless time-outs when the validator is
  // under heavy throughput.
  await conn.confirmTransaction(sig, commitment);
}

/**
 * Waits for the next slot to be processed by the validator at the specified commitment level.
 * This ensures that any state changes from a recent transaction are likely reflected
 * in subsequent RPC calls.
 * @param conn The Solana connection object.
 * @param commitment The commitment level to observe slot changes (default: 'confirmed').
 * @returns A promise that resolves when the next slot is confirmed.
 */
export async function waitForNextSlot(
  conn: Connection,
  commitment: Commitment = DEFAULT_COMMITMENT,
): Promise<void> {
  const currentSlot = await conn.getSlot(commitment);

  return new Promise<void>((resolve) => {
    const subscriptionId = conn.onSlotChange((slotInfo) => {
      if (slotInfo.slot > currentSlot) {
        conn.removeSlotChangeListener(subscriptionId).catch(err => 
          console.warn('Error removing slot change listener:', err)
        );
        resolve();
      }
    });
  });
}
