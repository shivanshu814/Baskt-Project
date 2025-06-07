'use client';

import { useBasktClient } from '@baskt/ui';
import { useEffect, useState } from 'react';

//TODO: This may just be temp and will be removed
interface RegistryData {
  protocol: string;
  treasury: string;
  treasuryToken: string;
  liquidityPool: string;
  tokenVault: string;
  poolAuthority: string;
  poolAuthorityBump: number;
  programAuthority: string;
  programAuthorityBump: number;
  escrowMint: string;
  bump: number;
}

interface UseRegistryResult {
  registry: RegistryData | undefined;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useRegistry(): UseRegistryResult {
  const { client } = useBasktClient();
  const [registry, setRegistry] = useState<RegistryData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRegistry = async () => {
    if (!client) return;

    setLoading(true);
    setError(null);

    try {
      const registryData = await client.getProtocolRegistry();

      if (registryData) {
        setRegistry({
          protocol: registryData.protocol.toString(),
          treasury: registryData.treasury.toString(),
          treasuryToken: registryData.treasuryToken.toString(),
          liquidityPool: registryData.liquidityPool.toString(),
          tokenVault: registryData.tokenVault.toString(),
          poolAuthority: registryData.poolAuthority.toString(),
          poolAuthorityBump: registryData.poolAuthorityBump,
          programAuthority: registryData.programAuthority.toString(),
          programAuthorityBump: registryData.programAuthorityBump,
          escrowMint: registryData.escrowMint.toString(),
          bump: registryData.bump,
        });
      } else {
        setRegistry(undefined);
      }
    } catch (err) {
      console.error('Failed to fetch registry:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch registry'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, [client]);

  return { registry, loading, error, refresh: fetchRegistry };
}
