import { useState, useEffect } from 'react';
import { trpc } from '../../utils/trpc';
import { BasktInfo, UserBasktPositionInfo } from '@baskt/types';
import { processBasktData } from '../../utils/baskt/processBasktData';
import { useToast } from '../common/use-toast';

export const useBasktDetail = (basktId: string) => {
  const [baskt, setBaskt] = useState<BasktInfo | null>(null);
  const [userPosition, setUserPosition] = useState<UserBasktPositionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('1W');
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');
  const { toast } = useToast();
  const { data: cryptoNews = [] } = trpc.crypto.getCryptoNews.useQuery(undefined, {
    staleTime: 120 * 60 * 1000, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: basktInfo, isSuccess: isBasktDataLoaded } =
    trpc.baskt.getBasktMetadataById.useQuery({ basktId });

  useEffect(() => {
    const fetchBasktData = async () => {
      if (!isBasktDataLoaded) return;
      try {
        if (!basktInfo) {
          throw new Error('Baskt not found');
        }

        const tempPosition: UserBasktPositionInfo = {
          basktId: basktId,
          type: 'long',
          positionSize: 1000,
          entryPrice: 145.5,
          currentValue: 1502.5,
          pnl: 52.5,
          pnlPercentage: 3.61,
          openDate: '2024-03-20',
          collateral: 1500,
          userBalance: 5000,
        };

        const processedBaskts = processBasktData({
          success: true,
          data: 'data' in basktInfo ? [basktInfo.data] : [],
        });
        if (processedBaskts.length > 0) {
          setBaskt(processedBaskts[0]);
        } else {
          throw new Error('Failed to process baskt data');
        }

        setUserPosition(tempPosition);
      } catch (error) {
        toast({
          title: 'Warning',
          description: 'Failed to fetch baskt data',
          variant: 'destructive',
        });
        setBaskt(null);
        setUserPosition(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBasktData();
  }, [basktId, isBasktDataLoaded, basktInfo]);

  return {
    baskt,
    userPosition,
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
