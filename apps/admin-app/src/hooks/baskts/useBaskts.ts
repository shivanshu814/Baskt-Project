import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '../../utils/trpc';
import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { BasktData, BasktAsset, BasktResponse } from '../../types/baskt';
import { toast } from 'sonner';

export function useBaskts() {
  const [activatingBasktId, setActivatingBasktId] = useState<string | null>(null);
  const [selectedBaskt, setSelectedBaskt] = useState<BasktData | null>(null);
  const { data: trpcResponse, isLoading, error } = trpc.baskt.getAllBaskts.useQuery();
  const { client } = useBasktClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const basktList = useMemo(
    () => ((trpcResponse as BasktResponse)?.success ? (trpcResponse as BasktResponse).data : []),
    [trpcResponse],
  );

  useEffect(() => {
    const basktId = searchParams.get('basktId');
    if (basktId && basktList.length > 0) {
      const baskt = basktList.find((b) => b.basktId === basktId);
      if (baskt) {
        setSelectedBaskt(baskt);
      }
    } else {
      setSelectedBaskt(null);
    }
  }, [basktList, searchParams]);

  const handleViewDetails = (basktId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('basktId', basktId);
    router.push(`?${params.toString()}`);
    const baskt = basktList.find((b) => b.basktId === basktId);
    if (baskt) {
      setSelectedBaskt(baskt);
    }
  };

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('basktId');
    router.push(`?${params.toString()}`);
    setSelectedBaskt(null);
  };

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
    } catch (error) {
      toast.error('Error activating baskt');
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
    selectedBaskt,
    handleViewDetails,
    handleBack,
  };
}
