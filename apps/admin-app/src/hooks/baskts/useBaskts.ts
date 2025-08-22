import { useBasktClient } from '@baskt/ui';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BasktAsset, BasktData } from '../../types/baskt';
import { trpc } from '../../utils/trpc';

export function useBaskts() {
  const [activatingBasktId, setActivatingBasktId] = useState<string | null>(null);
  const [selectedBaskt, setSelectedBaskt] = useState<BasktData | null>(null);
  const {
    data: trpcResponse,
    isLoading,
    error,
  } = trpc.baskt.getAllBaskts.useQuery({
    hidePrivateBaskts: true,
  });
  const { client } = useBasktClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const basktList = useMemo(() => {
    const response = trpcResponse as any;
    if (!response?.success || !Array.isArray(response.data)) {
      return [];
    }

    const filteredBaskts = response.data.filter((baskt: any): baskt is BasktData => {
      const isValid =
        baskt !== null &&
        baskt !== undefined &&
        !!baskt.basktId &&
        typeof baskt.basktId === 'string';
      return isValid;
    });

    return filteredBaskts;
  }, [trpcResponse]);

  useEffect(() => {
    const basktId = searchParams.get('basktId');
    if (basktId && basktList.length > 0) {
      const baskt = basktList.find((b: any) => b.basktId === basktId);
      if (baskt) {
        setSelectedBaskt(baskt);
      } else {
        toast.error('Baskt not found');
        setSelectedBaskt(null);
      }
    } else {
      setSelectedBaskt(null);
    }
  }, [basktList, searchParams]);

  const handleViewDetails = (basktId: string) => {
    try {
      if (!basktId || typeof basktId !== 'string') {
        toast.error('Invalid baskt ID');
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set('basktId', basktId);
      router.push(`?${params.toString()}`);

      const baskt = basktList.find((b: any) => b && b !== null && b.basktId === basktId);
      if (baskt) {
        setSelectedBaskt(baskt);
      } else {
        toast.error('Baskt not found');
      }
    } catch (error) {
      toast.error('Error viewing baskt details');
    }
  };

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('basktId');
    router.push(`?${params.toString()}`);
    setSelectedBaskt(null);
  };

  const activateBaskt = async (basktId: string) => {
    if (!basktId) {
      toast.error('Invalid baskt ID');
      return;
    }

    setActivatingBasktId(basktId);

    const basktInfo = basktList.find((baskt: BasktData) => baskt && baskt.basktId === basktId);

    if (!basktInfo) {
      toast.error('Baskt not found');
      setActivatingBasktId(null);
      return;
    }

    try {
      await client?.activateBaskt(
        new PublicKey(basktId),
        basktInfo.assets.map((asset: BasktAsset) => new anchor.BN(asset.priceRaw)),
      );
      toast.success('Baskt activated successfully');
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
