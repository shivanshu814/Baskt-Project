import { AccessControlRole } from '@baskt/types';

export function toRoleString(role: AccessControlRole): string {
  switch (role) {
    case AccessControlRole.Owner:
      return 'Owner';
    case AccessControlRole.AssetManager:
      return 'AssetManager';
    case AccessControlRole.BasktManager:
      return 'BasktManager';
    case AccessControlRole.Rebalancer:
      return 'Rebalancer';
    case AccessControlRole.Matcher:
      return 'Matcher';
    case AccessControlRole.Liquidator:
      return 'Liquidator';
    case AccessControlRole.FundingManager:
      return 'FundingManager';
    case AccessControlRole.ConfigManager:
      return 'ConfigManager';
    case AccessControlRole.Keeper:
      return 'Keeper';
    default:
      return 'Unknown';
  }
}
export function stringToRole(roleStr: string): AccessControlRole {
  switch (roleStr.toLowerCase()) {
    case 'assetmanager':
      return AccessControlRole.AssetManager;
    case 'basktmanager':
      return AccessControlRole.BasktManager;
    case 'rebalancer':
      return AccessControlRole.Rebalancer;
    case 'matcher':
      return AccessControlRole.Matcher;
    case 'liquidator':
      return AccessControlRole.Liquidator;
    case 'fundingmanager':
      return AccessControlRole.FundingManager;
    case 'configmanager':
      return AccessControlRole.ConfigManager;
    case 'keeper':
      return AccessControlRole.Keeper;
    case 'owner':
      return AccessControlRole.Owner;
    default:
      throw new Error(`Invalid role string: ${roleStr}`);
  }
}
