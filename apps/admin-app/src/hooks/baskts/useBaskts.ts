import { useState } from 'react';
import { trpc } from '../../utils/trpc';
import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { BasktData, BasktAsset, BasktResponse } from '../../types/baskt';

export function useBaskts() {
  const [activatingBasktId, setActivatingBasktId] = useState<string | null>(null);
  const { data: trpcResponse, isLoading, error } = trpc.baskt.getAllBaskts.useQuery();
  const { client } = useBasktClient();

  const basktList = (trpcResponse as BasktResponse)?.success
    ? (trpcResponse as BasktResponse).data
    : [];

  const activateBaskt = async (basktId: string) => {
    setActivatingBasktId(basktId);

    const basktInfo = basktList.find((baskt: BasktData) => baskt.basktId === basktId);

    if (!basktInfo) {
      return;
    }

    try {
      await client?.activateBaskt(
        new PublicKey(basktId),
        basktInfo.assets.map((asset: BasktAsset) => new anchor.BN(asset.priceRaw)),
      );
      // eslint-disable-next-line
    } catch (error) {
      console.error('Error activating baskt:', error);
    } finally {
      setTimeout(() => setActivatingBasktId(null), 1000);
    }
  };

  return {
    basktList,
    isLoading,
    error,
    activatingBasktId,
    activateBaskt,
  };
}
