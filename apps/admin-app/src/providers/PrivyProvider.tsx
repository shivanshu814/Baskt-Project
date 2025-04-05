'use client';

import { PrivyProvider as BasePrivyProvider, usePrivy } from '@privy-io/react-auth';
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Cookies from 'js-cookie';

const SOLANA_CHAIN = {
  name: 'Solana Devnet',
  id: 1,
  rpcUrls: {
    default: {
      http: ['https://api.devnet.solana.com'],
    },
    public: {
      http: ['https://api.devnet.solana.com'],
    },
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
  }, [authenticated, ready, user]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (isNavigatingRef.current) {
      return;
    }

    const handleNavigation = async () => {
      if (authenticated && window.location.pathname === '/login') {
        isNavigatingRef.current = true;
        window.location.href = '/dashboard';
      } else if (!authenticated && window.location.pathname !== '/login') {
        isNavigatingRef.current = true;
        window.location.href = '/login';
      }
    };

    handleNavigation();
  }, [authenticated, ready, user]);

  return <>{children}</>;
}

function PrivyProviderComponent({ children }: { children: React.ReactNode }) {
  return (
    <BasePrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        loginMethods: ['wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#3B82F6',
          showWalletLoginFirst: true,
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
