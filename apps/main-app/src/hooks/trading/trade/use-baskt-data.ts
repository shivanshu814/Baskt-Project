import { useEffect } from 'react';
import { toast } from 'sonner';
import { trpc } from '../../../lib/api/trpc';
import { processBasktData } from '../../../utils/baskt/baskt';

export const useBasktData = (
  basktName: string,
  setBaskt: (baskt: any) => void,
  setIsLoading: (loading: boolean) => void,
  setIsNewlyCreated: (created: boolean) => void,
  retryCount: number,
  setRetryCount: (count: number) => void,
) => {
  const {
    data: basktInfo,
    isSuccess: isBasktDataLoaded,
    isError: isBasktDataError,
    isLoading: isBasktDataLoading,
    refetch,
  } = trpc.baskt.getBasktMetadataByName.useQuery(
    { basktName, withPerformance: true },
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
        setRetryCount(retryCount + 1);
        refetch();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [
    isBasktDataLoaded,
    basktInfo?.success,
    retryCount,
    refetch,
    setIsNewlyCreated,
    setRetryCount,
  ]);

  useEffect(() => {
    if (isBasktDataLoading) {
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
    setBaskt,
    setIsLoading,
    setIsNewlyCreated,
  ]);

  return {
    basktInfo,
    basktNavData,
    isBasktDataLoaded,
    isBasktDataError,
    isBasktDataLoading,
    isBasktNavDataLoaded,
    refetch,
  };
};
