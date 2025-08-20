'use client';

import { OnchainProtocolInterface } from '@baskt/types';
import { useBasktClient } from '@baskt/ui';
import { useCallback, useEffect, useState } from 'react';

export function useProtocol() {
  const { client } = useBasktClient();
  const [protocol, setProtocol] = useState<OnchainProtocolInterface | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fetchProtocol = useCallback(async () => {
    if (!client) {
      return;
    }

    try {
      const protocolAccount = await client.getProtocolAccount();
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
