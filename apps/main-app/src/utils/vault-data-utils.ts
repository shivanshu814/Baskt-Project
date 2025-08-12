import { AssetExposure, OpenInterestData, VaultData } from '../types/vault';

// Constants
export const REFETCH_INTERVAL = 30 * 1000; // 30 seconds
export const STALE_TIME = 10 * 1000; // 10 seconds
export const MILLIONS_DENOMINATOR = 1e6;

// Default values
export const DEFAULT_VAULT_DATA: VaultData = {
  totalLiquidity: '0',
  totalShares: '0',
  depositFeeBps: 0,
  withdrawalFeeBps: 0,
  minDeposit: '0',
  lastUpdateTimestamp: new Date().toISOString(),
  lpMint: '',
  tokenVault: '',
  apr: '0.00',
  totalFeesEarned: '0.00',
};

// Utility functions
export const processVaultData = (data: any): VaultData => {
  return {
    totalLiquidity: data.totalLiquidity || '0',
    totalShares: data.totalShares || '0',
    depositFeeBps: data.depositFeeBps || 0,
    withdrawalFeeBps: data.withdrawalFeeBps || 0,
    minDeposit: data.minDeposit || '0',
    lastUpdateTimestamp: processTimestamp(data.lastUpdateTimestamp),
    lpMint: data.lpMint || '',
    tokenVault: data.tokenVault || '',
    apr: data.apr || '0.00',
    totalFeesEarned: data.totalFeesEarned || '0.00',
    recentFeeData: data.recentFeeData,
    feeStats: data.feeStats,
  };
};

export const processTimestamp = (timestamp: number | string | undefined): string => {
  if (typeof timestamp === 'number') {
    return new Date(timestamp).toISOString();
  }
  return timestamp || new Date().toISOString();
};

export const calculateExposurePercentages = (
  longExposure: number,
  shortExposure: number,
): { longPercentage: string; shortPercentage: string } => {
  const totalExposure = longExposure + shortExposure;
  if (totalExposure <= 0) {
    return { longPercentage: '0', shortPercentage: '0' };
  }

  return {
    longPercentage: ((longExposure / totalExposure) * 100).toFixed(2),
    shortPercentage: ((shortExposure / totalExposure) * 100).toFixed(2),
  };
};

export const getAssetImageUrl = (asset: AssetExposure): string => {
  if (asset.logo) return asset.logo;

  const ticker = asset.ticker?.toLowerCase();
  if (ticker) {
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${ticker}.png`;
  }

  return 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/2give.png';
};

export const processAssetData = (asset: AssetExposure) => {
  const longExposure = (asset.longExposure || 0) * 100;
  const shortExposure = (asset.shortExposure || 0) * 100;
  const netExposure =
    asset.netExposure !== undefined ? asset.netExposure * 100 : longExposure - shortExposure;
  const weight = asset.weight || 0;

  return {
    longExposure,
    shortExposure,
    netExposure,
    weight,
  };
};

export const calculateTotalTVL = (exposureData: OpenInterestData[]): string => {
  if (!exposureData || exposureData.length === 0) {
    return '0.00';
  }

  const totalTvl = exposureData.reduce((sum, baskt) => {
    return sum + (baskt.totalOpenInterest || 0);
  }, 0);

  return (totalTvl / MILLIONS_DENOMINATOR).toFixed(2);
};

export const aggregateAssetExposures = (exposureData: OpenInterestData[]): AssetExposure[] => {
  const allAssets = new Map<string, AssetExposure>();

  exposureData?.forEach((baskt: OpenInterestData) => {
    baskt.assetExposures?.forEach((asset: AssetExposure) => {
      const key = asset.assetId || asset.ticker || asset.name || 'unknown';

      if (allAssets.has(key)) {
        // Aggregate data for same asset across different baskts
        const existing = allAssets.get(key)!;
        allAssets.set(key, {
          ...existing,
          longExposure: (existing.longExposure || 0) + (asset.longExposure || 0),
          shortExposure: (existing.shortExposure || 0) + (asset.shortExposure || 0),
          netExposure: (existing.netExposure || 0) + (asset.netExposure || 0),
          weight: (existing.weight || 0) + (asset.weight || 0),
        });
      } else {
        allAssets.set(key, {
          ...asset,
          assetId: key,
        });
      }
    });
  });

  return Array.from(allAssets.values());
};
