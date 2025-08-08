/**
 * Roles that can be assigned to accounts for access control
 */
export enum AccessControlRole {
  Owner = 0,
  AssetManager = 1,
  BasktManager = 2,
  Rebalancer = 3,
  Matcher = 4,
  Liquidator = 5,
  FundingManager = 6,
  ConfigManager = 7,
  Keeper = 8,
}
