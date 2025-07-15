/**
 * Types for asset-related components and data
 */

import { z } from 'zod';

export interface Asset {
  _id: string;
  ticker: string;
  name?: string;
  logo?: string;
  price: number;
  config: {
    provider: {
      id: string;
      chain: string;
      name: string;
    };
    twp?: {
      seconds: number;
    };
    updateFrequencySeconds?: number;
    units?: number;
    coingeckoId?: string;
  };
  account: {
    address: string;
    listingTime: number;
    permissions: {
      allowLongs: boolean;
      allowShorts: boolean;
    };
    isActive: boolean;
  };
  latestPrice: {
    time: number;
    price: number;
    rawPrice: number;
  };
}

export interface AssetTableProps {
  assets: Asset[];
  isLoading: boolean;
  onViewPrices: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

export interface AssetTableCellProps {
  asset: Asset;
  id: string;
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface MutationError {
  message: string;
}

export interface MutationResponse<T> {
  data?: T;
  error?: MutationError;
}

export interface AssetMutationInput {
  assetAddress: string;
  ticker: string;
  name: string;
  logo: string;
  priceConfig: {
    provider: {
      id: string;
      chain: string;
      name: string;
    };
    twp: {
      seconds: number;
    };
    updateFrequencySeconds: number;
    units: number;
  };
  coingeckoId?: string;
}

export interface AssetPriceHistoryPageProps {
  assetAddress: string;
  assetName: string;
  assetLogo?: string;
  ticker?: string;
  onBack?: () => void;
}

export interface FetchParams {
  assetId: string;
  startDate: number;
  endDate: number;
}

export const providerOptions = ['Binance', 'Dexscreener', 'USDC', 'Coingecko'] as const;

export const assetFormSchema = z.object({
  ticker: z.string().min(1, { message: 'Ticker is required' }),
  name: z.string().min(1, { message: 'Asset name is required' }),
  priceConfig: z.object({
    provider: z.object({
      name: z.enum(providerOptions.map((option) => option.toLowerCase()) as [string, ...string[]], {
        required_error: 'Provider name is required',
      }),
      id: z.string().min(1, { message: 'Provider ID is required' }),
      chain: z.string().optional(),
    }),
    twp: z.object({
      seconds: z.coerce.number().int().min(1, { message: 'TWP seconds required' }),
    }),
    updateFrequencySeconds: z.coerce
      .number()
      .int()
      .min(1, { message: 'Update frequency required' }),
    units: z.coerce.number().positive({ message: 'Units must be positive' }).default(1),
  }),
  coingeckoId: z.string().optional(),
  logo: z.string().url({ message: 'Please enter a valid logo URL' }),
  permissions: z.object({
    allowLong: z.boolean().default(true),
    allowShort: z.boolean().default(true),
  }),
});

export type AssetFormValues = z.infer<typeof assetFormSchema>;

export interface PriceHistoryTableProps {
  data: any[]; // eslint-disable-line
  isLoading: boolean;
  error?: Error | null;
}

export interface FiltersSectionProps {
  range: {
    start: Date;
    end: Date;
  };
  all: boolean;
  onRangeChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => void;
  onAllChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFetch: () => void;
  onBack?: () => void;
}

export interface AssetHeaderProps {
  assetName: string;
  assetAddress: string;
  assetLogo?: string;
  ticker?: string;
}

export interface EditAssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assetId: string, data: {
    name?: string;
    logo?: string;
    priceConfig?: {
      provider?: {
        id?: string;
        name?: string;
        chain?: string;
      };
      twp?: {
        seconds?: number;
      };
      updateFrequencySeconds?: number;
      units?: number;
    };
    coingeckoId?: string;
  }) => void;
  asset: Asset | null;
}

export interface DeleteAssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (assetId: string) => void;
  asset: Asset | null;
}
