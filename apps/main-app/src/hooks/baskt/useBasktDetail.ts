import { useState, useEffect } from 'react';
import { trpc } from '../../utils/trpc';
import { BasktInfo } from '@baskt/types';
import { processBasktData } from '../../utils/baskt/processBasktData';
import { toast } from 'sonner';

export const useBasktDetail = (basktName: string) => {
  const [baskt, setBaskt] = useState<BasktInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('1W');
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');
  const { data: cryptoNews = [] } = trpc.crypto.getCryptoNews.useQuery(undefined, {
    staleTime: 120 * 60 * 1000, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: basktInfo, isSuccess: isBasktDataLoaded } =
    trpc.baskt.getBasktMetadataByName.useQuery(
      { basktName },
      {
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    );

  const { data: basktNavData, isSuccess: isBasktNavDataLoaded } = trpc.baskt.getBasktNAV.useQuery(
    { basktId: basktInfo?.success && 'data' in basktInfo ? basktInfo.data.basktId : '' },
    {
      refetchInterval: 2 * 1000,
      enabled: basktInfo?.success && 'data' in basktInfo && !!basktInfo.data.basktId,
    },
  );

  useEffect(() => {
    if (!isBasktNavDataLoaded) return;
    if (!baskt) return;
    // @ts-expect-error data is expected to be present
    if (!basktNavData?.data?.nav) return;
    const basktCopy = baskt;
    if (!basktCopy) return;
    // @ts-expect-error data is expected to be present
    if (basktNavData?.data?.nav === basktCopy.price) return;
    setBaskt({
      ...basktCopy,
      // @ts-expect-error data is expected to be present
      price: basktNavData?.data?.nav,
    });
  }, [baskt, isBasktNavDataLoaded, basktNavData]);

  useEffect(() => {
    if (!isBasktDataLoaded || !basktInfo?.success || !('data' in basktInfo)) {
      setIsLoading(false);
      return;
    }

    try {
      const processedBaskt = processBasktData({
        success: true,
        data: [basktInfo.data],
      })[0];

      if (processedBaskt) {
        setBaskt(processedBaskt);
      }
    } catch (error) {
      toast.error('Failed to load baskt data');
    } finally {
      setIsLoading(false);
    }
  }, [isBasktDataLoaded, basktInfo]);

  return {
    baskt,
    isLoading,
    isShareModalOpen,
    setIsShareModalOpen,
    chartPeriod,
    setChartPeriod,
    chartType,
    setChartType,
    cryptoNews,
  };
};
