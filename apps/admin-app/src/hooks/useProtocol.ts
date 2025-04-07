'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBasktClient } from '../providers/BasktClientProvider';
import { ProtocolInterface } from '@baskt/sdk';

export function useProtocol() {
  const { client } = useBasktClient();
  const [protocol, setProtocol] = useState<ProtocolInterface | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fetchProtocol = useCallback(async () => {
    if (!client) return;

    try {
      // The getProtocolAccount method now returns a standardized ProtocolInterface
      const protocolAccount = await client.getProtocolAccount();

      // We can directly use the protocol account without any transformation
      setProtocol(protocolAccount);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error fetching protocol'));
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      fetchProtocol();
    }
  }, [client, fetchProtocol]);

  return {
    protocol,
    error,
  };
}
