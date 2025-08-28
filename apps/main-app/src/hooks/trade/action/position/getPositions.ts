import { trpc } from '../../../../lib/api/trpc';

export function useGetPositions(
  basktPrice: number,
  basktId?: string | number,
  userAddress?: string,
) {
  const positionsQuery = trpc.position.getPositions.useQuery(
    {
      basktId: basktId ? String(basktId) : undefined,
      userId: userAddress || undefined,
      isActive: true,
    },
    {
      enabled: !!userAddress,
      refetchInterval: 30 * 1000,
    },
  );

  const positions = (positionsQuery.data as any)?.data || [];

  const processedPositions = positions.map((position: any) => {
    const entryPrice = Number(position.entryPrice);
    const remainingSize = Number(position.remainingSize) / 1e6;
    const remainingCollateral = Number(position.remainingCollateral);
    const currentPrice = basktPrice;

    const positionValue = remainingSize * entryPrice;
    const pnl = (currentPrice - entryPrice) * remainingSize;
    const pnlPercentage = entryPrice > 0 ? (pnl / (entryPrice * remainingSize)) * 100 : 0;
    const fees =
      Number(position.openPosition?.feeToBlp || 0) +
      Number(position.openPosition?.feeToTreasury || 0);

    return {
      isLong: position.isLong,
      positionValue,
      entryPrice,
      currentPrice,
      pnl,
      pnlPercentage,
      remainingCollateral,
      fees,
      basktId: position.basktAddress,
      positionPDA: position.positionPDA,
      remainingSize: position.remainingSize,
    };
  });

  return {
    positions: processedPositions,
    error: positionsQuery.error,
    loading: positionsQuery.isLoading,
  };
}
