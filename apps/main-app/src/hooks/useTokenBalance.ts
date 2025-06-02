import { useState, useEffect, useCallback } from 'react';
import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import { usePrivy } from '@privy-io/react-auth';

/**
 * Fetches and returns the user's SPL token balance for a given mint as a string, plus loading, error, and a refetch function.
 * @param mint The mint address of the SPL token (string or PublicKey)
 * @param address Optional: the user's wallet address (string or PublicKey). Defaults to connected wallet.
 * @param decimals Optional: token decimals (default 6 for most SPL tokens)
 */
export function useTokenBalance(
  mint: string | PublicKey,
  address?: string | PublicKey,
  decimals: number = 6,
) {
  const { authenticated } = usePrivy();
  const { client, wallet } = useBasktClient();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    let targetAddress: string | undefined;
    if (address) {
      targetAddress = address instanceof PublicKey ? address.toBase58() : address;
    } else if (wallet?.address) {
      targetAddress = wallet.address;
    }
    if (!authenticated || !targetAddress || !client || !mint) {
      setBalance('0');
      setError(null);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const userPubkey = new PublicKey(targetAddress);
      const mintKey = mint instanceof PublicKey ? mint : new PublicKey(mint);
      const acc = await client.getUserTokenAccount(userPubkey, mintKey);
      setBalance((Number(acc?.amount) / Math.pow(10, decimals)).toString());
      setError(null);
      return acc;
    } catch (e: any) {
      setBalance('0');
      setError(e?.message || 'Failed to fetch token balance');
      return null;
    } finally {
      setLoading(false);
    }
  }, [authenticated, wallet, client, address, mint, decimals]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, error, refetch: fetchBalance };
}
