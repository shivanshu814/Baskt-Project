/**
 * Asset configuration for the admin dashboard
 */
import { ASSET_TABLE_IDS } from '../constants/assets';

export const ASSET_TABLE_CONFIG = [
  {
    id: ASSET_TABLE_IDS.TICKER,
    label: 'Ticker',
  },
  {
    id: ASSET_TABLE_IDS.ADDRESS,
    label: 'Asset Address',
  },
  {
    id: ASSET_TABLE_IDS.LISTING_TIME,
    label: 'Listing Time',
  },
  {
    id: ASSET_TABLE_IDS.PRICE,
    label: 'Asset Price',
  },
  {
    id: ASSET_TABLE_IDS.ALLOW_LONG,
    label: 'Allow Long',
  },
  {
    id: ASSET_TABLE_IDS.ALLOW_SHORT,
    label: 'Allow Short',
  },
  {
    id: ASSET_TABLE_IDS.STATUS,
    label: 'Status',
  }
] as const;
