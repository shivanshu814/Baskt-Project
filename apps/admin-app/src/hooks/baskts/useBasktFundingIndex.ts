import { useEffect, useState } from 'react';
import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export function useBasktFundingIndex(basktId: string) {
  const { client } = useBasktClient();
  const [fundingIndex, setFundingIndex] = useState<any>([]); //eslint-disable-line
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFundingIndexes = async () => {
    setLoading(true);
    try {
      setFundingIndex(await client?.getFundingIndex(new PublicKey(basktId)));
      setError(null);
    } catch (err) {
      setFundingIndex([]);
      setError(err instanceof Error ? err : new Error('Failed to fetch funding indexes'));
    } finally {
      setLoading(false);
    }
  };

  const updateFundingIndex = async (newRate: number) => {
    try {
      await client?.updateFundingIndex(new PublicKey(basktId), new BN(newRate));
      fetchFundingIndexes();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update funding index'));
    }
  };

  useEffect(() => {
    fetchFundingIndexes();
  }, [basktId]);

  return {
    fundingIndex,
    loading,
    error,
    updateFundingIndex,
  };
}
