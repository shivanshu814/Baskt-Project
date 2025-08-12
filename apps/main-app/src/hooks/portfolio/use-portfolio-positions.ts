import { useBasktClient } from '@baskt/ui';
import { useEffect, useMemo } from 'react';
import { trpc } from '../../lib/api/trpc';

function processDashboardPosition(position: any, baskt: any) {
  const currentPrice = baskt?.price ? Number(baskt.price) / 1e6 : 0;
  const entryPrice = position.entryPrice ? Number(position.entryPrice) / 1e6 : 0;
  const usdcSize = position.usdcSize ? Number(position.usdcSize) / 1e6 : 0;
  const isLong = position.isLong;

  let pnl = 0;
  let pnlPercentage = 0;

  if (entryPrice > 0 && currentPrice > 0 && usdcSize > 0) {
    const positionSize = usdcSize / entryPrice; // units
    const currentValue = positionSize * currentPrice;
    const entryValue = usdcSize;

    if (isLong) {
      pnl = currentValue - entryValue;
    } else {
      pnl = entryValue - currentValue;
    }

    const collateral = position.collateral ? Number(position.collateral) / 1e6 : 0;
    pnlPercentage = collateral > 0 ? (pnl / collateral) * 100 : 0;
  }

  return {
    positionId: position.positionId,
    basktId: position.basktId,
    size: position.size,
    usdcSize: position.usdcSize,
    collateral: position.collateral,
    entryPrice: position.entryPrice,
    isLong: position.isLong,
    status: position.status,
    basktName: baskt.name,
    currentPrice,
    pnl,
    pnlPercentage,
  };
}

export function usePortfolioPositions() {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();

  const positionsQuery = trpc.position.getPositions.useQuery(
    { userId: userAddress || '' },
    {
      enabled: !!userAddress,
      refetchInterval: 5 * 60 * 1000,
      staleTime: 4 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  );

  const basktsQuery = trpc.baskt.getAllBaskts.useQuery(
    { withPerformance: true },
    {
      refetchInterval: 30 * 1000,
    },
  );

  useEffect(() => {
    const handleBlockchainInteraction = () => {
      positionsQuery.refetch();
    };

    window.addEventListener('position-opened', handleBlockchainInteraction);
    window.addEventListener('position-closed', handleBlockchainInteraction);
    window.addEventListener('collateral-added', handleBlockchainInteraction);

    return () => {
      window.removeEventListener('position-opened', handleBlockchainInteraction);
      window.removeEventListener('position-closed', handleBlockchainInteraction);
      window.removeEventListener('collateral-added', handleBlockchainInteraction);
    };
  }, [positionsQuery]);

  const processedPositions = useMemo(() => {
    const positions = (positionsQuery.data as any)?.data || [];
    const baskts = (basktsQuery.data as any)?.data || [];

    return positions
      .map((position: any) => {
        if (!position || !position.basktId) {
          return null;
        }

        const validBaskts = baskts.filter((b: any) => b && b.basktId);
        const baskt = validBaskts.find((b: any) => b.basktId === position.basktId);

        if (baskt && baskt.name && baskt.name.trim() !== '') {
          const processedPosition = processDashboardPosition(position, baskt);
          return {
            ...processedPosition,
            basktName: baskt.name,
            basktId: position.basktId,
          };
        } else {
          return null;
        }
      })
      .filter((position: any) => position !== null);
  }, [positionsQuery.data, basktsQuery.data]);

  const hasPositions = useMemo(() => {
    return processedPositions.length > 0;
  }, [processedPositions]);

  return {
    positions: processedPositions,
    hasPositions,
    totalPositions: processedPositions.length,
    isLoading: positionsQuery.isLoading || basktsQuery.isLoading,
    isError: positionsQuery.isError || basktsQuery.isError,
    error: positionsQuery.error || basktsQuery.error,
  };
}
