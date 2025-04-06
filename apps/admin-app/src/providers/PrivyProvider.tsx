'use client';

import { PrivyProvider as BasePrivyProvider, usePrivy } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Cookies from 'js-cookie';

const SOLANA_CHAIN = {
  name: 'Solana Devnet',
  id: 1,
  rpcUrls: {
    default: { http: ['https://api.devnet.solana.com'] },
    public: { http: ['https://api.devnet.solana.com'] },
  },
  nativeCurrency: {
    name: 'SOL',
    symbol: 'SOL',
    decimals: 18,
  },
  blockExplorers: {
    default: {
      name: 'Solana Explorer',
      url: 'https://explorer.solana.com/?cluster=devnet',
    },
  },
  testnet: true,
};

function AuthStateHandler({ children }: { children: React.ReactNode }) {
  const { authenticated, ready, user } = usePrivy();
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    if (ready) {
      if (authenticated && user?.id) {
        Cookies.set('wallet-connected', 'true', { path: '/' });
      } else {
        Cookies.remove('wallet-connected', { path: '/' });
      }
    }
  }, [authenticated, ready, user]); // eslint-disable-line

  useEffect(() => {
    if (!ready || isNavigatingRef.current) return;

    const path = window.location.pathname;

    if (authenticated && path === '/login') {
      isNavigatingRef.current = true;
      window.location.href = '/dashboard';
    } else if (!authenticated && path !== '/login') {
      isNavigatingRef.current = true;
      window.location.href = '/login';
    }
  }, [authenticated, ready]);

  return <>{children}</>;
}

function PrivyProviderComponent({ children }: { children: React.ReactNode }) {
  const connectors = toSolanaWalletConnectors();
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
        supportedChains: [SOLANA_CHAIN],
        defaultChain: SOLANA_CHAIN,
      }}
    >
      <AuthStateHandler>{children}</AuthStateHandler>
    </BasePrivyProvider>
  );
}

export const PrivyProvider = dynamic(() => Promise.resolve(PrivyProviderComponent), {
  ssr: false,
});
