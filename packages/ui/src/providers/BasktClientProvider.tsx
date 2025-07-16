'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ConnectedSolanaWallet, usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { Connection } from '@solana/web3.js';
import { PrivyClient } from './client';
import { useUser } from '../hooks/useUser';

// Context for the protocol client
type ProtocolClientContextType = {
  client: PrivyClient | null;
  connection: Connection | null;
  wallet: ConnectedSolanaWallet | null;
};

const ProtocolClientContext = createContext<ProtocolClientContextType>({
  client: null,
  connection: null,
  wallet: null,
});

// Provider component for the protocol client
export function BasktClientProvider({ children }: { children: React.ReactNode }) {

  const {wallet: activeWallet} = useUser();

  const [client, setClient] = useState<any | null>(null); //eslint-disable-line
  const [connection, setConnection] = useState<Connection | null>(null);

  useEffect(() => {
    const initializeClient = async () => {
      if (!activeWallet) {
        return;
      }

      try {
        // eslint-disable-next-line no-undef
        const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'http://localhost:8899';
        const basktClient = new PrivyClient(new Connection(rpcUrl), activeWallet);
        setConnection(new Connection(rpcUrl));
        setClient(basktClient);
      } catch (err) {
        console.error('Error initializing protocol client:', err); //eslint-disable-line
      }
    };

    initializeClient();
  }, [activeWallet]); //eslint-disable-line

  return (
    <ProtocolClientContext.Provider value={{ client, connection, wallet: activeWallet }}>
      {children}
    </ProtocolClientContext.Provider>
  );
}

// Hook to use the protocol client
export function useBasktClient() {
  const context = useContext(ProtocolClientContext);
  if (context === undefined) {
    throw new Error('useBasktClient must be used within a BasktClientProvider');
  }
  return context;
}
