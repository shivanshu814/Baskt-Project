import { useState, useEffect } from 'react';
import { trpc } from '../../utils/trpc';
import { BasktInfo } from '@baskt/types';
import { processBasktData } from '../../utils/baskt/processBasktData';
import { toast } from 'sonner';

export const useBasktDetail = (basktId: string) => {
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
    trpc.baskt.getBasktMetadataById.useQuery(
      { basktId },
      {
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    );

  const { data: basktNavData, isSuccess: isBasktNavDataLoaded } = trpc.baskt.getBasktNAV.useQuery(
    { basktId },
    {
      refetchInterval: 2 * 1000,
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
    const fetchBasktData = async () => {
      if (!isBasktDataLoaded) return;
      try {
        if (!basktInfo) {
          throw new Error('Baskt not found');
        }

        const processedBaskts = processBasktData({
          success: true,
          data: 'data' in basktInfo ? [basktInfo.data] : [],
        });
        if (processedBaskts.length > 0) {
          setBaskt(processedBaskts[0]);
        } else {
          throw new Error('Failed to process baskt data');
        }
      } catch (error) {
        toast.error('Failed to fetch baskt data');
        setBaskt(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBasktData();
  }, [basktId, isBasktDataLoaded, basktInfo]);

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
