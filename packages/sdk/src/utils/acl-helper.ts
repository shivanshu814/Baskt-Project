import { AccessControlRole } from '@baskt/types';

export function toRoleString(role: AccessControlRole): string {
  switch (role) {
    case AccessControlRole.Owner:
      return 'Owner';
    case AccessControlRole.AssetManager:
      return 'AssetManager';
    case AccessControlRole.OracleManager:
      return 'OracleManager';
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
    default:
      return 'Unknown';
  }
}
export function stringToRole(roleStr: string): AccessControlRole {
  switch (roleStr) {
    case 'AssetManager':
      return AccessControlRole.AssetManager;
    case 'OracleManager':
      return AccessControlRole.OracleManager;
    case 'Rebalancer':
      return AccessControlRole.Rebalancer;
    case 'Matcher':
      return AccessControlRole.Matcher;
    case 'Liquidator':
      return AccessControlRole.Liquidator;
    case 'FundingManager':
      return AccessControlRole.FundingManager;
    case 'ConfigManager':
      return AccessControlRole.ConfigManager;
    case 'Owner':
      // For Owner role, we can't actually add it as a role in the access control list
      // but we handle it specially in the hasPermission method
      throw new Error(
        `Cannot add ${AccessControlRole.Owner} as a role. Owner is set during protocol initialization.`,
      );
    default:
      throw new Error(`Invalid role string: ${roleStr}`);
  }
}
