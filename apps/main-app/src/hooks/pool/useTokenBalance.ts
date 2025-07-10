import { useState, useEffect, useCallback } from 'react';
import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import { usePrivy } from '@privy-io/react-auth';
import { Account } from '@solana/spl-token';

export function useTokenBalance(
  mint: string | PublicKey,
  address?: string | PublicKey,
  decimals: number = 6,
  refetchInterval: number = 10 * 1000, // Reduced to 10s for faster updates
) {
  const { authenticated } = usePrivy();
  const { client, wallet } = useBasktClient();
  const [balance, setBalance] = useState<string>('0');
  const [account, setAccount] = useState<Account>();
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
      setAccount(acc);
      setError(null);
      return acc;
      // eslint-disable-next-line
    } catch (e: any) {
      setBalance('0');
      setError(e?.message || 'Failed to fetch token balance');
      return null;
    } finally {
      setLoading(false);
    }
  }, [authenticated, wallet, client, address, mint, decimals]);

  // Listen for external transaction events
  useEffect(() => {
    const handleExternalTransaction = () => {
      // Immediate fetch for manual refresh
      fetchBalance();
    };

    // Listen for various transaction events that might affect balance
    window.addEventListener('external-transaction', handleExternalTransaction);
    window.addEventListener('token-received', handleExternalTransaction);
    window.addEventListener('balance-updated', handleExternalTransaction);

    return () => {
      window.removeEventListener('external-transaction', handleExternalTransaction);
      window.removeEventListener('token-received', handleExternalTransaction);
      window.removeEventListener('balance-updated', handleExternalTransaction);
    };
  }, [fetchBalance]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(() => {
      fetchBalance();
    }, refetchInterval);
    return () => clearInterval(interval);
  }, [fetchBalance, refetchInterval]);

  return { balance, account, loading, error, refetch: fetchBalance };
}
