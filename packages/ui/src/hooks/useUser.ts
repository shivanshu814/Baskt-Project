'use client';

import { ConnectedSolanaWallet, usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';


export function useUser() {
  const { logout, authenticated, user, ready } = usePrivy();
  const { wallets } = useSolanaWallets();
  const [wallet, setWallet] = useState<ConnectedSolanaWallet | null>(null);

  useEffect(() => {
    if(!ready || wallets.length === 0 ) {
      return
    }

    if(!authenticated) {
      setWallet(null);
      return;
    }
    const desiredWallet = wallets.find((wallet) => wallet.address === user?.wallet?.address);   
    if(!desiredWallet) {
      console.log("No desired wallet found");
      logout();
      return
    }

    setWallet(desiredWallet);
  }, [wallets, authenticated, user]);

  return {
    wallet,
    isAuthenticated: authenticated,
    userAddress: wallet?.address,
  }

}
