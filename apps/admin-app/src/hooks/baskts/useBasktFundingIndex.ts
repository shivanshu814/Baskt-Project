import { useEffect, useState } from 'react';
import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

// Interface representing the FundingIndex structure from the Rust program
export interface FundingIndex {
  basktId: string;
  cumulativeIndex: string; // i128 as string (scaled by FUNDING_PRECISION)
  lastUpdateTimestamp: number;
  currentRate: number; // Current hourly rate in BPS (can be positive or negative)
  bump: number;
}

export function useBasktFundingIndex(basktId: string) {
  const { client } = useBasktClient();
  const [fundingIndex, setFundingIndex] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch funding indexes
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

  // Initialize funding index
  // Note: The initializeFundingIndex method needs to be implemented in the TRPC router
  const initializeFundingIndex = async () => {
    try {
      await client?.initializeFundingIndex(new PublicKey(basktId));
      fetchFundingIndexes();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize funding index'));
    }
  };

  // Update funding index with new rate
  // Note: The updateFundingIndex method needs to be implemented in the TRPC router
  const updateFundingIndex = async (newRate: number) => {
    try {
      await client?.updateFundingIndex(new PublicKey(basktId), new BN(newRate));
      fetchFundingIndexes();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update funding index'));
    }
  };

  // Fetch funding indexes on mount and when basktId changes
  useEffect(() => {
    fetchFundingIndexes();
  }, [basktId]);

  return {
    fundingIndex,
    loading,
    error,
    initializeFundingIndex,
    updateFundingIndex,
  };
}
