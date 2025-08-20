import { BasktInfo, OnchainAssetConfig } from '@baskt/types';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Asset } from '../../types/asset';
import { RawBasktData } from '../../types/baskt';
import { AssetWithPosition } from '../../types/baskt/creation';

export function sanitizeBasktName(value: string): string {
  let sanitizedValue = value.replace(/[^a-zA-Z0-9_-]/g, '');
  sanitizedValue = sanitizedValue.replace(/_{2,}/g, '_');
  sanitizedValue = sanitizedValue.replace(/-{2,}/g, '-');
  return sanitizedValue.slice(0, 10);
}

export const createBasktAssetConfigs = (
  assetDetails: AssetWithPosition[],
  selectedAssets: Asset[],
): OnchainAssetConfig[] => {
  return assetDetails.map((assetDetail) => {
    const selectedAsset = selectedAssets.find((asset) => asset.ticker === assetDetail.ticker);

    if (!selectedAsset) {
      throw new Error(`Asset ${assetDetail.ticker} not found`);
    }

    const weight = (parseFloat(assetDetail.weight) / 100) * 10_000;
    const direction = assetDetail.position === 'long';

    return {
      assetId: new PublicKey(selectedAsset.assetAddress),
      baselinePrice: new anchor.BN(0),
      direction: direction,
      weight: new anchor.BN(weight),
    } as OnchainAssetConfig;
  });
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const errorMessage = error.message;

    if (
      errorMessage.includes('insufficient lamports') ||
      errorMessage.includes('Transfer: insufficient lamports')
    ) {
      return 'Insufficient SOL balance. Please add more SOL to your wallet to create a baskt.';
    } else if (errorMessage.includes('custom program error')) {
      return 'Transaction failed. Please try again or check your wallet balance.';
    } else if (errorMessage.includes('User rejected')) {
      return 'Transaction was cancelled.';
    } else if (errorMessage.includes('Network request failed')) {
      return 'Network error. Please check your connection and try again.';
    } else {
      return 'Something went wrong. Please try again.';
    }
  }

  return 'Failed to create baskt';
};

export function validateWeightInput(weight: string): boolean {
  return /^\d*\.?\d*$/.test(weight);
}

export function calculateTotalWeight(assetDetails: AssetWithPosition[]): number {
  return assetDetails.reduce((sum, asset) => {
    const weight = parseFloat(asset.weight) || 0;
    return sum + weight;
  }, 0);
}

export function hasLowWeightAssets(assetDetails: AssetWithPosition[]): boolean {
  return assetDetails.some((asset) => {
    const weight = parseFloat(asset.weight) || 0;
    return weight > 0 && weight < 5;
  });
}

export function isWeightExceeded(totalWeight: number): boolean {
  return totalWeight > 100;
}

export function formatRebalancingDisplay(
  rebalancingType: 'automatic' | 'manual',
  rebalancingPeriod: number,
  rebalancingUnit: 'days' | 'weeks' | 'months',
): string {
  if (rebalancingType === 'automatic') {
    return rebalancingPeriod > 0
      ? `Automatic - Every ${rebalancingPeriod} ${rebalancingUnit}`
      : 'Automatic - Set period';
  }
  return 'Manual';
}

export const processBasktData = (rawBasktData: RawBasktData[]): BasktInfo[] => {
  if (!rawBasktData) {
    return [];
  }
  const processedBaskts = rawBasktData
    .filter((baskt): baskt is RawBasktData => baskt !== null && 'basktId' in baskt)
    .map((baskt) => {
      const processedBaskt = {
        ...baskt,
        basktId: baskt.basktId?.toString() || '',
        name: baskt.name || '',
        price: baskt.price ?? 0,
        change24h: baskt.change24h ?? 0,
        aum: baskt.aum ?? 0,
        totalAssets: baskt.totalAssets ?? 0,
        isActive: (baskt as any)?.status === 'Active',
        isPublic: (baskt as any)?.isPublic ?? false,
        creationDate: baskt.creationDate ? new Date(baskt.creationDate) : new Date(),
        performance: {
          day: (baskt.performance as any)?.day || baskt.performance?.daily || 0,
          week: (baskt.performance as any)?.week || baskt.performance?.weekly || 0,
          month: (baskt.performance as any)?.month || baskt.performance?.monthly || 0,
          year: baskt.performance?.year || 0,
        },
        assets:
          baskt.assets?.map((asset) => {
            const processedAsset = {
              ...asset,
              weight: Number(asset.weight),
              direction: asset.direction,
              id: asset.id,
              name: asset.name,
              ticker: asset.ticker,
              symbol: asset.ticker ?? '',
              price: asset.price,
              change24h: asset.change24h,
              volume24h: asset.volume24h,
              marketCap: asset.marketCap,
              assetAddress: asset.assetAddress,
              logo: asset.logo,
            };

            return processedAsset;
          }) || [],
        sparkline: baskt.sparkline || [],
        txSignature: baskt.txSignature || '',
        categories: baskt.categories || [],
        creator: baskt.creator || '',
        account: {
          uid: (baskt as any)?.uid || 0,
          basktId: baskt.basktId as any,
          currentAssetConfigs: [],
          isPublic: (baskt as any)?.isPublic ?? false,
          creator: baskt.creator as any,
          status: (baskt as any)?.status || 'pending',
          lastRebalanceTime: (baskt as any)?.lastRebalanceTime || '0',
          baselineNav: (baskt as any)?.baselineNav || '0',
          bump: 0,
          isActive: (baskt as any)?.status === 'Active',
          rebalancePeriod: (baskt as any)?.rebalancePeriod || '0',
          fundingIndex: {
            cumulativeIndex: '0',
            lastUpdateTimestamp: '0',
            currentRate: '0',
          },
          rebalanceFeeIndex: {
            cumulativeIndex: '0',
            lastUpdateTimestamp: '0',
            currentFeePerUnit: '0',
          },
          config: {
            openingFeeBps: null,
            closingFeeBps: null,
            liquidationFeeBps: null,
            minCollateralRatioBps: null,
            liquidationThresholdBps: null,
          },
          openPositions: (baskt as any)?.openPositions || '0',
        },
      };

      return processedBaskt;
    });

  return processedBaskts;
};

export const cleanBasktData = (baskt: any) => {
  const assets = (baskt?.assets || []).map((asset: any) => {
    const matchedConfig = (baskt?.currentAssetConfigs || []).find(
      (config: any) => config.assetId === asset.assetAddress,
    );
    return {
      id: asset?.id,
      assetAddress: asset?.assetAddress,
      logo: asset?.logo,
      name: asset?.name,
      ticker: asset?.ticker,
      priceProvider: asset?.priceConfig?.provider || {},
      baselinePrice: matchedConfig?.baselinePrice || '',
      direction: matchedConfig?.direction || false,
      weight: matchedConfig?.weight || 0,
    };
  });

  return {
    name: baskt?.name || '',
    performance: baskt?.performance || { daily: 0, weekly: 0, monthly: 0, year: 0 },
    rebalancePeriod: baskt?.rebalancePeriod || 0,
    isPublic: baskt?.isPublic || false,
    baselineNav: baskt?.baselineNav || '0',
    basktId: baskt?.basktId || '',
    openPositions: baskt?.openPositions || 0,
    lastRebalanceTime: baskt?.lastRebalanceTime || 0,
    status: baskt?.status || '',
    creator: baskt?.creator || '',
    assets,
    totalAssets: assets.length,
  };
};
