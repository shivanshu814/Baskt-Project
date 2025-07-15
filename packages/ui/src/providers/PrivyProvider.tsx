'use client';

import { PrivyProvider as BasePrivyProvider, usePrivy } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Cookies from 'js-cookie';


function AuthStateHandler({ children }: { children: React.ReactNode }) {
  const { authenticated, ready, user } = usePrivy();

  useEffect(() => {
    if (ready) {
      if (authenticated && user?.id) {
        Cookies.set('wallet-connected', 'true', { path: '/' });
      } else {
        Cookies.remove('wallet-connected', { path: '/' });
      }
    }
  }, [authenticated, ready, user]);

  return <>{children}</>;
}

function PrivyProviderComponent({ children }: { children: React.ReactNode }) {
  const connectors = toSolanaWalletConnectors();
  // eslint-disable-next-line no-undef
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  return (
    <BasePrivyProvider
      appId={appId || ''}
      config={{
        loginMethods: ['wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#3B82F6',
          showWalletLoginFirst: true,
          walletChainType: 'solana-only',
        },
        externalWallets: {
          solana: {
            connectors,
          },
        },
        solanaClusters: [{ name: 'mainnet-beta', rpcUrl: 'https://api.mainnet-beta.solana.com' }]
      }}
    >
      <AuthStateHandler>{children}</AuthStateHandler>
    </BasePrivyProvider>
  );
}

export const PrivyProvider = dynamic(() => Promise.resolve(PrivyProviderComponent), {
  ssr: false,
});