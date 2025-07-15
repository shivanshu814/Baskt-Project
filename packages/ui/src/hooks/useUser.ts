
import { usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';


export function useUser() {
    const { logout, authenticated, user } = usePrivy();
  const { wallets } = useSolanaWallets();
  const [userAddress, setUserAddress] = useState<string | null>(null);

  console.log(wallets, userAddress, user?.wallet);

  useEffect(() => {
    if(!authenticated) {
      return
    }

    if(authenticated && wallets.length === 0) {
      logout();
      return
    }

    if(authenticated && user?.wallet?.address.toLowerCase() !== wallets[0].address.toLowerCase()) {
      logout();
      return
    }

    if(wallets.length > 0) {
      setUserAddress(wallets[0].address);
    } 
    
  }, [wallets, authenticated]);

  return {
    userAddress,
    isAuthenticated: authenticated,
    wallet: wallets[0],
  }

}
