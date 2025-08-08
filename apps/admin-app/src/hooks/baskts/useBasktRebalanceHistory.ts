import { useState, useEffect } from 'react';
import { useBasktClient } from '@baskt/ui';

export function useBasktRebalanceHistory(basktId: string) {
  const [rebalanceHistory, setRebalanceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { client } = useBasktClient();

  useEffect(() => {
    const fetchRebalanceHistory = async () => {
      if (!client || !basktId) return;

      setLoading(true);
      setError(null);

      // try {
      //   const basktPubkey = new PublicKey(basktId);

      //   const baskt = await client.getBasktRaw(basktPubkey);
      //   const lastRebalanceIndex =
      //     typeof baskt.lastRebalanceIndex === 'string'
      //       ? parseInt(baskt.lastRebalanceIndex, 10)
      //       : baskt.lastRebalanceIndex.toNumber();

      //   const history: OnchainRebalanceHistory[] = [];

      //   for (let i = 0; i < lastRebalanceIndex; i++) {
      //     try {
      //       const rebalanceEntry = await client.getRebalanceHistory(basktPubkey, i);
      //       history.push(rebalanceEntry);
      //     } catch (err) {
      //       toast(`Rebalance history not found for index ${i}`);
      //     }
      //   }

      //   setRebalanceHistory(history);
      // } catch (err) {
      //   setError(err instanceof Error ? err : new Error('Failed to fetch rebalance history'));
      // } finally {
      //   setLoading(false);
      // }
      setRebalanceHistory([]);
    };

    fetchRebalanceHistory();
  }, [client, basktId]);

  return {
    rebalanceHistory,
    loading,
    error,
  };
}
