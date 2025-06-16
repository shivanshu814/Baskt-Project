export const CATEGORIES = ['all', 'defi', 'metaverse', 'ai', 'gaming', 'layer1'] as const;
export const SORT_OPTIONS = ['popular', 'newest', 'performance'] as const;
export const ROLE_DISPLAY_MAP = {
  AssetManager: 'Asset Manager',
  OracleManager: 'Oracle Manager',
  Rebalancer: 'Rebalancer',
  Owner: 'Owner',
} as const;

// Crypto News types
export interface NewsItem {
  id: string;
  title: string;
  time: string;
  url: string;
  cover: string;
}

export interface CryptoNewsProps {
  news: NewsItem[];
}

// Suggested Baskts types
export interface SuggestedBaskt {
  id: string;
  name: string;
  price: number;
  change24h: number;
}

export interface SuggestedBasktsProps {
  suggestedBaskts: SuggestedBaskt[];
}

// Type definitions for the constants
export type Category = (typeof CATEGORIES)[number];
export type SortOption = (typeof SORT_OPTIONS)[number];
export type RoleType = keyof typeof ROLE_DISPLAY_MAP;
