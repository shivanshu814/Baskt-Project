import { calculateCollateralAmount } from '@baskt/sdk';
import { BasktInfo } from '@baskt/types';
import BN from 'bn.js';
import {
  AssetCompositionData,
  OrderDetails,
  OrderHistoryDetails,
} from '../../types/baskt/trading/components/tabs';

export const formatOrderTime = (date: Date | string | number): string => {
  if (typeof date === 'string' || typeof date === 'number') {
    const timestamp = typeof date === 'string' ? parseInt(date) : date;
    const dateObj = new Date(timestamp * 1000);
    return dateObj.toLocaleString();
  }

  return date.toLocaleString();
};

export const formatPositionType = (isLong: boolean): string => (isLong ? 'Long' : 'Short');

export const getPositionTypeColor = (isLong: boolean): string =>
  isLong ? 'text-green-500' : 'text-red-500';

export const formatPriceChange = (change: number, showSign: boolean = true): string => {
  const sign = showSign && change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
};

export const calculatePerformanceColor = (performance: number): string =>
  performance >= 0 ? 'text-green-500' : 'text-red-500';

export function getBasktStatusColor(isActive: boolean): string {
  return isActive ? 'text-green-500' : 'text-yellow-500';
}

export function getBasktStatusText(isActive: boolean): string {
  return isActive ? 'Active' : 'Inactive';
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}

export function getDirectionText(direction: boolean): string {
  return direction ? 'Long' : 'Short';
}

export function getDirectionColor(direction: boolean): string {
  return direction ? 'text-green-500' : 'text-red-500';
}

export function getChangeColor(changePercentage: number): string {
  return changePercentage >= 0 ? 'text-green-500' : 'text-red-500';
}

export function formatChangePercentage(changePercentage: number): string {
  const sign = changePercentage >= 0 ? '+' : '';
  return `${sign}${changePercentage.toFixed(2)}%`;
}

export function getPositionTypeLabel(isLong: boolean): string {
  return isLong ? 'Long' : 'Short';
}

export function getPnlColor(pnl: number): string {
  return pnl >= 0 ? 'text-green-500' : 'text-red-500';
}

export function formatCloseAmount(closeAmount: string | number): string {
  const amount = Number(closeAmount);
  return amount.toFixed(2);
}

export function calculateAssetCompositionData(baskt: BasktInfo): AssetCompositionData[] {
  if (!baskt?.assets || baskt.assets.length === 0) {
    return [];
  }

  const calculateCurrentWeights = (assets: any[]) => {
    const weights = assets.map((asset) => asset.weight / 100);

    const returns = assets.map((asset) => {
      const baselinePrice = asset.baselinePrice || asset.price;

      if (!baselinePrice || baselinePrice === 0) {
        return 0;
      }

      const priceDiff = asset.price - baselinePrice;
      const returnValue = priceDiff / baselinePrice;

      return asset.direction ? returnValue : -returnValue;
    });

    const weightedReturns = weights.map((weight, index) => weight * (1 + returns[index]));
    const sumWeightedReturns = weightedReturns.reduce((sum, value) => sum + value, 0);

    if (sumWeightedReturns === 0) {
      return assets.map((asset) => asset.weight);
    }

    return weightedReturns.map((value) => (value / sumWeightedReturns) * 100);
  };

  const currentWeights = calculateCurrentWeights(baskt.assets);

  return baskt.assets.map((asset, index) => {
    const baselinePrice = asset.baselinePrice || asset.price;
    const change = asset.price - baselinePrice;
    const changePercentage = (change / baselinePrice) * 100;

    return {
      ticker: (asset.ticker || 'Asset') as string,
      logo: asset.logo || '',
      direction: asset.direction,
      weight: asset.weight,
      currentWeight: currentWeights[index] || asset.weight,
      baselinePrice,
      currentPrice: asset.price,
      change,
      changePercentage,
    };
  });
}

export function formatPerformanceValue(
  value: number | undefined,
  showSign: boolean = true,
): string {
  if (value === undefined) return '-';
  return formatPriceChange(value, showSign);
}

export function getMetricsData(baskt: BasktInfo) {
  return [
    {
      label: '30D Change',
      value: formatPerformanceValue(baskt?.performance?.month),
      isPercentage: true,
      showSign: true,
    },
    {
      label: '24h Change',
      value: formatPerformanceValue(baskt?.performance?.day),
      isPercentage: true,
      showSign: true,
    },
    {
      label: '7D Change',
      value: formatPerformanceValue(baskt?.performance?.week),
      isPercentage: true,
      showSign: true,
    },
    {
      label: 'Total Assets',
      value: baskt?.assets?.length?.toString() ?? '0',
    },
    {
      label: '30D Sharpe Ratio',
      value: '1.85',
    },
    {
      label: '30D Sortino Ratio',
      value: '2.12',
    },
    {
      label: '30D Volatility',
      value: '18.5%',
    },
    {
      label: '30D Return vs SOL',
      value: '+5.2%',
      className: 'text-green-400',
    },
  ];
}

export function getInfoItems(baskt: BasktInfo) {
  return [
    {
      label: 'Creation Date',
      value: formatDate(baskt?.creationDate?.toString()),
      isDate: true,
    },
    {
      label: 'Creator',
      value: baskt?.creator || '',
      isPublicKey: true,
    },
    {
      label: 'Baskt ID',
      value: baskt?.basktId || '',
      isPublicKey: true,
    },
    {
      label: 'Total Assets',
      value: baskt?.assets?.length?.toString() || '0',
    },
  ];
}

export function processOrderDetails(order: any, baskt: BasktInfo): OrderDetails {
  const orderTime = order.createdAt ? new Date(order.createdAt) : new Date();
  const orderType = order.orderType?.market ? 'Market' : 'Limit';

  let orderSize = 0;
  if (order.openParams?.notionalValue) {
    orderSize = parseFloat(order.openParams.notionalValue);
  } else if (order.closeParams?.sizeAsContracts) {
    orderSize = parseFloat(order.closeParams.sizeAsContracts);
  } else if (order.orderSize) {
    orderSize = parseFloat(order.orderSize);
  } else if (order.size) {
    orderSize = parseFloat(order.size);
  }

  const orderPrice = order.price || baskt?.price || 0;
  let orderCollateral = 0;

  if (order.collateral) {
    orderCollateral = parseFloat(order.collateral);
  } else if (orderSize > 0) {
    orderCollateral = calculateCollateralAmount(new BN(orderSize)).toNumber();
  }

  const limitPrice = order.orderType?.limit?.price || orderPrice;
  const isLong = order.isLong || false;

  return {
    orderTime,
    orderType,
    orderSize,
    orderPrice,
    orderCollateral,
    limitPrice,
    isLong,
    orderPDA: order.orderPDA,
    orderId: order.orderId,
  };
}

export function processOrderHistoryDetails(order: any, baskt: BasktInfo): OrderHistoryDetails {
  const orderTime = order.createdAt ? new Date(order.createdAt) : new Date();
  const orderType = order.orderType?.market ? 'Market' : 'Limit';

  let orderSize = 0;
  if (order.openParams?.notionalValue) {
    orderSize = parseFloat(order.openParams.notionalValue);
  } else if (order.closeParams?.sizeAsContracts) {
    orderSize = parseFloat(order.closeParams.sizeAsContracts);
  } else if (order.orderSize) {
    orderSize = parseFloat(order.orderSize);
  } else if (order.size) {
    orderSize = parseFloat(order.size);
  }

  const orderPrice = order.price || baskt?.price || 0;
  const filledAmount = order.filledAmount ? parseFloat(order.filledAmount) : orderSize;
  const fees = ((filledAmount * orderPrice) / 1e6) * 0.002; // 0.2% fee
  const status = order.status || 'Filled';
  const transactionHash = order.transactionHash || order.orderId;
  const isLong = order.isLong || false;

  return {
    orderTime,
    orderType,
    orderSize,
    orderPrice,
    filledAmount,
    fees,
    status,
    transactionHash,
    isLong,
    orderPDA: order.orderPDA,
    orderId: order.orderId,
  };
}

export function formatOrderHistoryTime(date: Date): { date: string; time: string } {
  const dateString = date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  const timeString = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return { date: dateString, time: timeString };
}
