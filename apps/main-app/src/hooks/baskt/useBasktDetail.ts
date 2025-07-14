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
  const [retryCount, setRetryCount] = useState(0);
  const [isNewlyCreated, setIsNewlyCreated] = useState(false);

  const {
    data: basktInfo,
    isSuccess: isBasktDataLoaded,
    isError: isBasktDataError,
    isLoading: isBasktDataLoading,
    refetch,
  } = trpc.baskt.getBasktMetadataByName.useQuery(
    { basktName },
    {
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: !!basktName,
      retry: 3,
      retryDelay: 2000,
    },
  );

  const { data: basktNavData, isSuccess: isBasktNavDataLoaded } = trpc.baskt.getBasktNAV.useQuery(
    {
      basktId:
        basktInfo?.success && 'data' in basktInfo && basktInfo.data ? basktInfo.data.basktId : '',
    },
    {
      refetchInterval: 2 * 1000,
      enabled:
        basktInfo?.success && 'data' in basktInfo && basktInfo.data && !!basktInfo.data.basktId,
    },
  );

  useEffect(() => {
    if (isBasktDataLoaded && !basktInfo?.success && retryCount < 5) {
      setIsNewlyCreated(true);

      const timer = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        refetch();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isBasktDataLoaded, basktInfo?.success, retryCount, refetch]);

  useEffect(() => {
    if (!isBasktNavDataLoaded) return;
    if (!baskt) return;
    if (!basktNavData?.data?.nav) return;
    const basktCopy = baskt;
    if (!basktCopy) return;
    if (basktNavData?.data?.nav === basktCopy.price) return;

    setBaskt({
      ...basktCopy,
      price: basktNavData?.data?.nav,
    });
  }, [baskt, isBasktNavDataLoaded, basktNavData]);

  useEffect(() => {
    if (isBasktDataLoading) {
      setIsLoading(true);
      return;
    }

    if (isNewlyCreated && retryCount < 5) {
      setIsLoading(true);
      return;
    }

    if (isBasktDataLoaded) {
      if (basktInfo?.success && 'data' in basktInfo) {
        try {
          const processedBaskt = processBasktData({
            success: true,
            data: [basktInfo.data as any],
          })[0];

          if (processedBaskt) {
            setBaskt(processedBaskt);
            setIsNewlyCreated(false);
          } else {
            toast.error('Failed to load baskt data');
          }
        } catch (error) {
          toast.error('Failed to load baskt data');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        setIsNewlyCreated(false);
      }
    } else if (isBasktDataError) {
      toast.error('Failed to load baskt data');
      setIsLoading(false);
      setIsNewlyCreated(false);
    } else {
      toast.error('Failed to load baskt data');
    }
  }, [
    isBasktDataLoaded,
    isBasktDataError,
    isBasktDataLoading,
    basktInfo,
    retryCount,
    isNewlyCreated,
  ]);

  return {
    baskt,
    isLoading,
    isShareModalOpen,
    setIsShareModalOpen,
    chartPeriod,
    setChartPeriod,
    chartType,
    setChartType,
  };
};
