/**
 * Constants for baskt-related functionality
 */

export const BASKT_TABLE_HEADER_IDS = {
  NAME: 'name',
  ADDRESS: 'address',
  CREATOR: 'creator',
  IS_PUBLIC: 'isPublic',
  CREATION_TIME: 'creationTime',
  LAST_REBALANCE_INDEX: 'lastRebalanceIndex',
  ACTIVE: 'active',
  LAST_REBALANCE_TIME: 'lastRebalanceTime',
  BASELINE_NAV: 'baselineNav',
  TOTAL_ASSETS: 'totalAssets',
  PRICE: 'price',
  CHANGE_24H: 'change24h',
  ACTIONS: 'actions',
} as const;

export type BasktTableHeaderId =
  (typeof BASKT_TABLE_HEADER_IDS)[keyof typeof BASKT_TABLE_HEADER_IDS];
