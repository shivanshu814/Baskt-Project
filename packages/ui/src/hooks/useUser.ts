
import { ConnectedSolanaWallet, usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';


export function useUser() {
  const { logout, authenticated, user } = usePrivy();
  const { wallets } = useSolanaWallets();
  const [wallet, setWallet] = useState<ConnectedSolanaWallet | null>(null);

  useEffect(() => {
    if(!authenticated) {
      return
    }

    const desiredWallet = wallets.find((wallet) => wallet.address === user?.wallet?.address); 
  
    if(!desiredWallet) {
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
