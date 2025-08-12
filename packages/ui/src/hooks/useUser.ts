'use client';

import { ConnectedSolanaWallet, usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { useCallback, useEffect, useState } from 'react';

export function useUser() {
  const { logout, authenticated, user, ready, getAccessToken } = usePrivy();
  const { wallets } = useSolanaWallets();
  const [wallet, setWallet] = useState<ConnectedSolanaWallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || wallets.length === 0) {
      return;
    }

    if (!authenticated) {
      setWallet(null);
      return;
    }
    const desiredWallet = wallets.find((wallet) => wallet.address === user?.wallet?.address);
    if (!desiredWallet) {
      console.log('No desired wallet found');
      logout();
      return;
    }

    setWallet(desiredWallet);
  }, [wallets, authenticated, user]);

  const getJwtToken = useCallback(async () => {
    if (!authenticated) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      return token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get JWT token';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, getAccessToken]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    wallet,
    isAuthenticated: authenticated,
    userAddress: wallet?.address,
    getJwtToken,
    isLoading,
    error,
    clearError,
  };
}
