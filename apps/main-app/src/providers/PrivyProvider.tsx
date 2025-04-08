'use client';

import { PrivyProvider as BasePrivyProvider, usePrivy } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { useEffect } from 'react';
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
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#010b1d] to-[#011330]">
        <div className="text-center text-red-500">
          <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
          <p>Please set NEXT_PUBLIC_PRIVY_APP_ID in your environment variables</p>
        </div>
      </div>
    );
  }

  return (
    <BasePrivyProvider
      appId={appId}
      config={{
        loginMethods: ['wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#3B82F6',
          showWalletLoginFirst: true,
          walletChainType: 'solana-only',
        },
        embeddedWallets: {
          solana: {
            createOnLogin: 'all-users',
          },
        },
        externalWallets: {
          solana: {
            connectors,
          },
        },
        solanaClusters: [{ name: 'mainnet-beta', rpcUrl: 'https://api.mainnet-beta.solana.com' }],
      }}
    >
      <AuthStateHandler>{children}</AuthStateHandler>
    </BasePrivyProvider>
  );
}

export const PrivyProvider = dynamic(() => Promise.resolve(PrivyProviderComponent), {
  ssr: false,
});
