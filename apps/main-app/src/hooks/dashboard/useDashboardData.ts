import { useMemo, useCallback } from 'react';
import { useBasktClient, PRICE_PRECISION } from '@baskt/ui';
import { trpc } from '../../utils/common/trpc';
import { PositionStatus } from '@baskt/types';
import BN from 'bn.js';
import { PortfolioPosition, PortfolioSummary } from '../../types/portfolio';
import { AssetExposure } from '../../types/asset';
import { useOpenPositions } from '../baskt/trade/useOpenPositions';
import { useOpenOrders } from '../baskt/trade/useOpenOrders';
import { useOrderHistory } from '../baskt/trade/useOrderHistory';
import { useBasktList } from '../baskt/useBasktList';
import { useUSDCBalance } from '../pool/useUSDCBalance';

export const useDashboardData = () => {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();

  const { data: positionsData, isLoading: positionsLoading } = trpc.position.getPositions.useQuery(
    { userId: userAddress || '' },
    {
      enabled: !!userAddress,
      refetchInterval: 10 * 1000,
    },
  );

  const { data: basketsData, isLoading: basketsLoading } = trpc.baskt.getAllBaskts.useQuery(
    undefined,
    {
      refetchInterval: 30 * 1000,
    },
  );

  const { orders: openOrders = [] } = useOpenOrders(undefined, userAddress);
  const { positions: openPositions = [] } = useOpenPositions(undefined, userAddress);
  const { history: orderHistory = [] } = useOrderHistory(userAddress);
  const { popularBaskts } = useBasktList();
  const { balance: usdcBalance } = useUSDCBalance(client?.wallet?.address);

  const myBaskts = useMemo(() => {
    if (!basketsData?.success || !('data' in basketsData) || !basketsData.data) return [];
    return basketsData.data.filter(
      // eslint-disable-next-line
      (b: any) =>
        b && b.creator && userAddress && b.creator.toLowerCase() === userAddress.toLowerCase(),
    );
  }, [basketsData, userAddress]);

  const portfolioSummary = useMemo((): PortfolioSummary => {
    if (!basketsData || !basketsData.data || !positionsData || !positionsData.data) {
      return {
        totalPnL: 0,
        totalPnLPercentage: 0,
        openPositions: 0,
        totalValue: 0,
        totalCollateral: 0,
        assetExposures: [],
      };
    }

    // eslint-disable-next-line
    const positions: PortfolioPosition[] = positionsData.data.map((pos: any) => ({
      positionId: pos.positionId || '',
      positionPDA: pos.positionPDA || '',
      basktId: pos.basktId || '',
      basktName: '',
      entryPrice: pos.entryPrice || '0',
      exitPrice: pos.exitPrice || '0',
      owner: pos.owner || '',
      status: pos.status || PositionStatus.OPEN,
      size: pos.size || '0',
      collateral: pos.collateral || '0',
      isLong: pos.isLong || false,
      usdcSize: pos.usdcSize || '0',
      timestampOpen: pos.timestampOpen,
    }));

    // eslint-disable-next-line
    const baskets = basketsData.data.filter((b) => b !== null) as any[];
    const openPositions = positions.filter((p) => p.status === PositionStatus.OPEN);
    const totalCollateral = openPositions.reduce((sum, pos) => {
      return sum + (pos.collateral ? new BN(pos.collateral).toNumber() : 0);
    }, 0);

    const assetExposuresMap = new Map<string, AssetExposure>();

    openPositions.forEach((position) => {
      // eslint-disable-next-line
      const basket = baskets.find((b: any) => b.basktId === position.basktId);
      if (!basket) return;

      position.basktName = basket.name || 'Unknown Basket';
      const basketAssets = basket.assets || [];
      const currentPrice = basket.price || 0;
      const positionSize = position.usdcSize ? new BN(position.usdcSize).toNumber() : 0;
      const entryPrice = position.entryPrice ? new BN(position.entryPrice).toNumber() : 0;

      const totalPositionPnL = position.isLong
        ? ((currentPrice - entryPrice) * positionSize) / entryPrice
        : ((entryPrice - currentPrice) * positionSize) / entryPrice;

      if (basketAssets.length > 0) {
        const assetCount = basketAssets.length;
        const sizePerAsset = positionSize / assetCount;
        const pnlPerAsset = totalPositionPnL / assetCount;

        // eslint-disable-next-line
        basketAssets.forEach((asset: any) => {
          const assetId = asset.assetAddress || `${position.basktId}-${asset.name}`;
          const assetName = asset.name || 'Unknown Asset';
          const assetTicker = asset.ticker || 'UNKNOWN';

          if (!assetExposuresMap.has(assetId)) {
            assetExposuresMap.set(assetId, {
              assetId,
              assetName,
              assetTicker,
              totalLongExposure: 0,
              totalShortExposure: 0,
              netExposure: 0,
              avgEntryPrice: 0,
              currentPrice,
              pnl: 0,
              pnlPercentage: 0,
              positions: [],
            });
          }

          const exposure = assetExposuresMap.get(assetId)!;

          if (position.isLong) {
            exposure.totalLongExposure += sizePerAsset;
          } else {
            exposure.totalShortExposure += sizePerAsset;
          }

          const assetPosition = {
            ...position,
            basktName: basket.name || 'Unknown Basket',
            currentPrice,
            pnl: pnlPerAsset,
            pnlPercentage: (pnlPerAsset / sizePerAsset) * 100,
            usdcSize: sizePerAsset.toString(),
          };

          exposure.positions.push(assetPosition);
        });
      }
    });

    const assetExposures = Array.from(assetExposuresMap.values()).map((exposure) => {
      const totalExposure = exposure.totalLongExposure + exposure.totalShortExposure;
      const netExposure = exposure.totalLongExposure - exposure.totalShortExposure;

      const totalEntryValue = exposure.positions.reduce((sum, pos) => {
        const entryPrice = pos.entryPrice ? new BN(pos.entryPrice).toNumber() : 0;
        const size = pos.usdcSize && !isNaN(Number(pos.usdcSize)) ? Number(pos.usdcSize) : 0;
        return sum + entryPrice * size;
      }, 0);

      const avgEntryPrice = totalExposure > 0 ? totalEntryValue / totalExposure : 0;
      const totalPnL = exposure.positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
      const pnlPercentage = totalExposure > 0 ? (totalPnL / totalExposure) * 100 : 0;

      return {
        ...exposure,
        netExposure,
        avgEntryPrice,
        pnl: totalPnL,
        pnlPercentage,
      };
    });

    const totalPnL = assetExposures.reduce((sum, asset) => sum + asset.pnl, 0);
    const totalValue = totalCollateral + totalPnL;
    const totalPnLPercentage = totalCollateral > 0 ? (totalPnL / totalCollateral) * 100 : 0;

    return {
      totalPnL,
      totalPnLPercentage,
      openPositions: openPositions.length,
      totalValue,
      totalCollateral,
      assetExposures,
    };
  }, [positionsData, basketsData]);

  const chartData = useMemo(() => {
    if (!positionsData?.success || !('data' in positionsData) || !positionsData.data) {
      return {
        basktDistribution: [],
        tokenAllocation: [],
      };
    }
    if (!basketsData?.success || !('data' in basketsData) || !basketsData.data) {
      return {
        basktDistribution: [],
        tokenAllocation: [],
      };
    }

    // eslint-disable-next-line
    const baskets = basketsData.data.filter((b) => b !== null) as any[];

    const basktTotals: Record<string, { name: string; value: number; id: string }> = {};
    // eslint-disable-next-line
    positionsData.data.forEach((pos: any) => {
      // eslint-disable-next-line
      const basket = baskets.find((b: any) => b.basktId === pos.basktId);
      const basketName = basket?.name || pos.basktId || 'Unknown Basket';

      if (!basktTotals[pos.basktId]) {
        basktTotals[pos.basktId] = { name: basketName, value: 0, id: pos.basktId };
      }

      // Calculate PNL for this position
      const currentPrice = basket?.price || 0;
      const positionSize = pos.usdcSize ? Number(pos.usdcSize) / PRICE_PRECISION : 0;
      const entryPrice = pos.entryPrice ? Number(pos.entryPrice) / PRICE_PRECISION : 0;

      let positionPnL = 0;
      if (entryPrice > 0 && currentPrice > 0) {
        positionPnL = pos.isLong
          ? ((currentPrice - entryPrice) * positionSize) / entryPrice
          : ((entryPrice - currentPrice) * positionSize) / entryPrice;
      }

      // Use PNL + collateral for distribution calculation
      const collateral = pos.collateral ? Number(pos.collateral) / PRICE_PRECISION : 0;
      basktTotals[pos.basktId].value += collateral + positionPnL;
    });

    const total = Object.values(basktTotals).reduce((sum, b) => sum + b.value, 0);
    const basktDistribution = Object.values(basktTotals)
      .map((b) => ({ ...b, percent: total > 0 ? (b.value / total) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);

    const assetTotals: Record<string, { name: string; value: number; color: string }> = {};
    const COLORS = [
      '#FFD600',
      '#4F8CFF',
      '#FF6EC7',
      '#FF7043',
      '#00C49F',
      '#8884d8',
      '#FFB300',
      '#00B8D9',
    ];
    let colorIdx = 0;

    // eslint-disable-next-line
    positionsData.data.forEach((pos: any) => {
      // eslint-disable-next-line
      const basket = baskets.find((b: any) => b.basktId === pos.basktId);
      const basketAssets = basket?.assets || [];
      const positionSize = pos.usdcSize ? Number(pos.usdcSize) / PRICE_PRECISION : 0;
      const currentPrice = basket?.price || 0;
      const entryPrice = pos.entryPrice ? Number(pos.entryPrice) / PRICE_PRECISION : 0;

      // Calculate PNL for this position
      let positionPnL = 0;
      if (entryPrice > 0 && currentPrice > 0) {
        positionPnL = pos.isLong
          ? ((currentPrice - entryPrice) * positionSize) / entryPrice
          : ((entryPrice - currentPrice) * positionSize) / entryPrice;
      }

      const collateral = pos.collateral ? Number(pos.collateral) / PRICE_PRECISION : 0;
      const totalPositionValue = collateral + positionPnL;

      if (basketAssets.length > 0) {
        const valuePerAsset = totalPositionValue / basketAssets.length;
        // eslint-disable-next-line
        basketAssets.forEach((asset: any) => {
          const assetKey = asset.assetAddress || asset.ticker || asset.name;
          const assetName = asset.name || asset.ticker || 'Unknown';

          if (!assetTotals[assetKey]) {
            assetTotals[assetKey] = {
              name: assetName,
              value: 0,
              color: COLORS[colorIdx % COLORS.length],
            };
            colorIdx++;
          }
          assetTotals[assetKey].value += valuePerAsset;
        });
      }
    });

    const tokenAllocation = Object.values(assetTotals).sort((a, b) => b.value - a.value);

    return {
      basktDistribution,
      tokenAllocation,
    };
  }, [positionsData, basketsData]);

  const recentActivity = useMemo(() => {
    const actualOpenPositions =
      positionsData?.success && 'data' in positionsData && positionsData.data
        ? positionsData.data
            // eslint-disable-next-line
            .filter((pos: any) => pos.status === PositionStatus.OPEN)
            // eslint-disable-next-line
            .map((pos: any) => ({
              positionId: pos.positionId || '',
              positionPDA: pos.positionPDA || '',
              basktId: pos.basktId || '',
              basktName: '',
              entryPrice: pos.entryPrice || '0',
              exitPrice: pos.exitPrice || '0',
              owner: pos.owner || '',
              status: pos.status || PositionStatus.OPEN,
              size: pos.size || '0',
              collateral: pos.collateral || '0',
              isLong: pos.isLong || false,
              usdcSize: pos.usdcSize || '0',
              timestampOpen: pos.timestampOpen,
              currentPrice: 0,
            }))
        : [];

    // Get baskets data for baskt name lookup
    const baskets =
      basketsData?.success && 'data' in basketsData && basketsData.data
        ? basketsData.data.filter((b) => b !== null)
        : [];

    const allActivity = [
      // eslint-disable-next-line
      ...actualOpenPositions.map((pos: any) => {
        // Find the corresponding basket to get the baskt name
        const basket = baskets.find((b) => b.basktId === pos.basktId);
        const basktName = basket?.name || 'Unknown Baskt';

        return {
          type: 'position' as const,
          action: pos.isLong ? 'Long Position Opened' : 'Short Position Opened',
          amount: pos.usdcSize ? new BN(pos.usdcSize).toNumber() / PRICE_PRECISION : 0,
          timestamp: pos.timestampOpen || Date.now(),
          basktName,
          basktId: pos.basktId || '',
          isPositive: true,
        };
      }),
      // eslint-disable-next-line
      ...openOrders.map((order: any) => ({
        type: 'order' as const,
        action: order.orderType === 'MARKET' ? 'Market Order Placed' : 'Limit Order Placed',
        amount: order.usdcSize ? new BN(order.usdcSize).toNumber() / PRICE_PRECISION : 0,
        timestamp: order.timestamp || Date.now(),
        basktName: 'Unknown',
        isPositive: true,
      })),
      // eslint-disable-next-line
      ...orderHistory.slice(0, 5).map((item: any) => ({
        type: 'history' as const,
        action:
          item.type === 'position'
            ? item.status === 'CLOSED' || item.status === 'LIQUIDATED'
              ? item.isLong
                ? 'Long Position Closed'
                : 'Short Position Closed'
              : item.isLong
              ? 'Long Position Opened'
              : 'Short Position Opened'
            : item.action === 'OPEN'
            ? 'Order Filled'
            : 'Order Cancelled',
        amount:
          item.type === 'position'
            ? item.size
              ? parseFloat(item.size) / PRICE_PRECISION
              : 0
            : item.usdcSize
            ? parseFloat(item.usdcSize) / PRICE_PRECISION
            : item.collateral
            ? parseFloat(item.collateral) / PRICE_PRECISION
            : item.size
            ? parseFloat(item.size) / PRICE_PRECISION
            : 0,
        timestamp: parseInt(item.timestamp) * 1000,
        basktName: item.basktName || 'Unknown',
        isPositive: item.pnl ? parseFloat(item.pnl) > 0 : true,
      })),
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    return allActivity;
  }, [positionsData, basketsData, openOrders, orderHistory, portfolioSummary.assetExposures]);

  const isLoading = positionsLoading || basketsLoading;

  const refreshData = useCallback(() => {}, []);

  return {
    portfolioSummary,
    chartData,
    recentActivity,
    openOrders,
    openPositions,
    orderHistory,
    popularBaskts,
    myBaskts,
    usdcBalance: usdcBalance ? Number(usdcBalance) : 0,
    isLoading,
    userAddress,
    refreshData,
  };
};
