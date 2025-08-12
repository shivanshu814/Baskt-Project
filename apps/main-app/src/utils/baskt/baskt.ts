import { BasktInfo, OnchainAssetConfig } from '@baskt/types';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { ROUTES } from '../../routes/route';
import { Asset } from '../../types/asset';
import { BasktCardHandlers, RawBasktData } from '../../types/baskt';
import { AssetWithPosition } from '../../types/baskt/creation';

// Create baskt utilities
export function sanitizeBasktName(value: string): string {
  let sanitizedValue = value.replace(/[^a-zA-Z0-9_-]/g, '');
  sanitizedValue = sanitizedValue.replace(/_{2,}/g, '_');
  sanitizedValue = sanitizedValue.replace(/-{2,}/g, '-');
  return sanitizedValue.slice(0, 10);
}

export function validateBasktName(name: string): { isValid: boolean; error?: string } {
  if (!name.trim()) {
    return { isValid: false, error: 'Baskt name is required' };
  }

  if (name.length < 1) {
    return {
      isValid: false,
      error: `Baskt name must be at least 1 character`,
    };
  }

  if (name.length > 10) {
    return {
      isValid: false,
      error: `Baskt name must be 10 characters or less`,
    };
  }

  const validNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
  if (!validNameRegex.test(name)) {
    return {
      isValid: false,
      error: 'Baskt name can only contain letters, numbers, spaces, hyphens, and underscores',
    };
  }

  return { isValid: true };
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

// Baskt card handlers
export const createBasktCardHandlers = (
  setOpen: (value: string | undefined) => void,
  router: any,
  safeBasktName: string,
  open: string | undefined,
): BasktCardHandlers => {
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    setOpen(open === 'baskt' ? undefined : 'baskt');
  };

  const handleAccordionToggle = (value: string | undefined) => {
    setOpen(value);
  };

  const handleTradeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`${ROUTES.TRADE}/${encodeURIComponent(safeBasktName)}`);
  };

  const handleExternalLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return {
    handleCardClick,
    handleAccordionToggle,
    handleTradeClick,
    handleExternalLinkClick,
  };
};

// Process baskt utilities
export const processBasktData = (
  data: { success: boolean; data?: (RawBasktData | null)[]; message?: string } | undefined,
): BasktInfo[] => {
  if (!data?.success || !data.data) {
    return [];
  }

  const processedBaskts = data.data
    .filter(
      (baskt): baskt is RawBasktData => baskt !== null && 'basktId' in baskt && 'account' in baskt,
    )
    .map((baskt) => {
      const processedBaskt = {
        ...baskt,
        basktId: baskt.basktId?.toString() || '',
        name: baskt.name || '',
        price: baskt.price ?? 0,
        change24h: baskt.change24h ?? 0,
        aum: baskt.aum ?? 0,
        totalAssets: baskt.totalAssets ?? 0,
        isActive: baskt.account?.isActive ?? false,
        isPublic: baskt.account?.isPublic ?? false,
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
        priceHistory: {
          daily:
            baskt.priceHistory?.daily?.map((entry) => ({
              ...entry,
              volume: 0,
              price: Number(entry.price),
            })) || [],
          weekly:
            baskt.priceHistory?.weekly?.map((entry) => ({
              ...entry,
              volume: 0,
              price: Number(entry.price),
            })) || [],
          monthly:
            baskt.priceHistory?.monthly?.map((entry) => ({
              ...entry,
              volume: 0,
              price: Number(entry.price),
            })) || [],
          yearly:
            baskt.priceHistory?.yearly?.map((entry) => ({
              ...entry,
              volume: 0,
              price: Number(entry.price),
            })) || [],
        },
        sparkline: baskt.sparkline || [],
        txSignature: baskt.txSignature || '',
        categories: baskt.categories || [],
        creator: baskt.creator || '',
        account: baskt.account || null,
      };

      return processedBaskt;
    });

  return processedBaskts;
};
