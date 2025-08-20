import { useBasktClient } from '@baskt/ui';
import { useMemo } from 'react';
import { trpc } from '../../lib/api/trpc';
import { cleanBasktData } from '../../utils/baskt/baskt';

export const useBasktList = () => {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();

  const { data: basktsData, isLoading } = trpc.baskt.getAllBaskts.useQuery(
    { withPerformance: true },
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  );

  const rawBaskts = Array.isArray(basktsData?.data) ? basktsData.data : [];
  const baskts = rawBaskts.map(cleanBasktData);
  const basktIds = baskts.map((b) => b.basktId);

  const { data: batchNavData, isLoading: isNavLoading } = trpc.baskt.getBatchBasktNAV.useQuery(
    { basktIds },
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      enabled: basktIds.length > 0,
    },
  );

  const basktsWithNav = useMemo(() => {
    return baskts.map((baskt) => {
      let currentNav = parseFloat(baskt.baselineNav) || 0;

      if (batchNavData?.success && 'data' in batchNavData && batchNavData.data) {
        const navData = batchNavData.data.find((nav: any) => nav.basktId === baskt.basktId);
        if (navData?.success && navData.nav) {
          currentNav = navData.nav;
        }
      }

      return {
        ...baskt,
        currentNav,
      };
    });
  }, [baskts, batchNavData]);

  const publicBaskts = basktsWithNav.filter((b) => b.isPublic);
  const yourBaskts = userAddress ? basktsWithNav.filter((b) => b.creator === userAddress) : [];
  const combinedBaskts = userAddress
    ? Array.from(
        new Map([...publicBaskts, ...yourBaskts].map((baskt) => [baskt.basktId, baskt])).values(),
      )
    : publicBaskts;

  return {
    baskts: basktsWithNav,
    publicBaskts,
    yourBaskts,
    combinedBaskts,
    userAddress,
    isLoading: isLoading || isNavLoading,
  };
};
