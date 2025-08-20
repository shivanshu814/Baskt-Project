import { useEffect } from 'react';
import { toast } from 'sonner';
import { trpc } from '../../../lib/api/trpc';
import { processBasktData } from '../../../utils/baskt/baskt';

export const useBasktData = (
  basktId: string,
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
  } = trpc.baskt.getBasktMetadataByAddress.useQuery(
    { basktId, withPerformance: true },
    {
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: !!basktId,
      retry: 3,
      retryDelay: 2000,
    },
  );

  const { data: basktNavData, isSuccess: isBasktNavDataLoaded } = trpc.baskt.getBasktNAV.useQuery(
    {
      basktId,
    },
    {
      refetchInterval: 2 * 1000,
      enabled: !!basktId,
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
          const processedBaskt = processBasktData([basktInfo.data as any]);
          if (processedBaskt[0]) {
            setBaskt(processedBaskt[0]);
            setIsNewlyCreated(false);
          } else {
            toast.error('Failed to load baskt data');
          }
        } catch (error) {
          console.error('Error processing baskt data:', error);
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
