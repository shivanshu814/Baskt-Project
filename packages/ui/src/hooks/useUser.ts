
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

    console.log("Linked Wallets", user?.wallet?.address);
    console.log("Connected Wallets", wallets);

    const desiredWallet = wallets[0]; 

    console.log("Desired Wallet", desiredWallet);
  
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
