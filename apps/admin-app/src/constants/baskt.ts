/**
 * Constants for baskt-related functionality
 */

export const BASKT_TABLE_HEADER_IDS = {
  NAME: 'name',
  ADDRESS: 'address',
  ACTIVE: 'active',
  ACTIONS: 'actions',
} as const;

export type BasktTableHeaderId =
  (typeof BASKT_TABLE_HEADER_IDS)[keyof typeof BASKT_TABLE_HEADER_IDS];
