/**
 * Asset-related constants used in the admin dashboard
 */
export const ASSET_TABLE_IDS = {
  TICKER: 'ticker',
  ADDRESS: 'address',
  LISTING_TIME: 'listingTime',
  PRICE: 'price',
  ALLOW_LONG: 'allowLong',
  ALLOW_SHORT: 'allowShort',
  STATUS: 'status',
  LATEST_PRICE: 'latestPrice',
  LATEST_PRICE_TIME: 'latestPriceTime',
} as const;

export type AssetTableId = (typeof ASSET_TABLE_IDS)[keyof typeof ASSET_TABLE_IDS];

export const DATE_FORMAT_OPTIONS = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
} as const;
