import { useBasktClient } from '@baskt/ui';
import { usePrivy } from '@privy-io/react-auth';
import { Account } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { useCallback, useEffect, useState } from 'react';

export function useTokenBalance(
  mint: string | PublicKey,
  address?: string | PublicKey,
  decimals: number = 6,
  refetchInterval: number = 10 * 1000,
) {
  const { authenticated } = usePrivy();
  const { client, wallet } = useBasktClient();
  const [balance, setBalance] = useState<string>('0');
  const [account, setAccount] = useState<Account>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialData, setHasInitialData] = useState(false);

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
      setAccount(undefined);
      return null;
    }

    if (!hasInitialData) {
      setLoading(true);
    }
    setError(null);

    try {
      const userPubkey = new PublicKey(targetAddress);
      const mintKey = mint instanceof PublicKey ? mint : new PublicKey(mint);
      const acc = await client.getUserTokenAccount(userPubkey, mintKey);

      if (acc && acc.amount) {
        setBalance((Number(acc.amount) / Math.pow(10, decimals)).toString());
        setAccount(acc);
        setError(null);
        if (!hasInitialData) {
          setHasInitialData(true);
        }
        return acc;
      } else {
        setBalance('0');
        setAccount(undefined);
        setError(null);
        if (!hasInitialData) {
          setHasInitialData(true);
        }
        return null;
      }
    } catch (e: any) {
      setBalance('0');
      setAccount(undefined);
      setError(e?.message || 'Failed to fetch token balance');
      if (!hasInitialData) {
        setHasInitialData(true);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [authenticated, wallet, client, address, mint, decimals, hasInitialData]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

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
    const interval = setInterval(fetchBalance, refetchInterval);
    return () => clearInterval(interval);
  }, [fetchBalance, refetchInterval]);

  const refetch = useCallback(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    account,
    loading,
    error,
    refetch,
  };
}
