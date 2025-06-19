/**
 * Tab IDs used in the admin dashboard
 */
export const TAB_IDS = {
  ASSETS: 'assets',
  BASKTS: 'baskts',
  PROTOCOL: 'protocol',
  ROLES: 'roles',
  LIQUIDITY: 'liquidity',
  ORDERS: 'orders',
  POSITIONS: 'positions',
  HISTORY: 'history',
} as const;

export type TabId = (typeof TAB_IDS)[keyof typeof TAB_IDS];
