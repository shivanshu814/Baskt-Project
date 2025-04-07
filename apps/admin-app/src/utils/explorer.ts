/**
 * Utility functions for blockchain explorers
 */

/**
 * Creates a Solscan URL for a transaction
 * @param txId The transaction ID/signature
 * @returns The full Solscan URL for the transaction
 */
export function getSolscanTxUrl(txId: string): string {
  return `https://solscan.io/tx/${txId}`;
}

/**
 * Creates a Solscan URL for an account/address
 * @param address The Solana address
 * @returns The full Solscan URL for the account
 */
export function getSolscanAddressUrl(address: string): string {
  return `https://solscan.io/account/${address}`;
}
