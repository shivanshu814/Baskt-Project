import { AccessControlRole } from '../types/role';
export function toRoleString(role) {
    switch (role) {
        case AccessControlRole.Owner:
            return 'Owner';
        case AccessControlRole.AssetManager:
            return 'AssetManager';
        case AccessControlRole.OracleManager:
            return 'OracleManager';
        case AccessControlRole.Rebalancer:
            return 'Rebalancer';
        default:
            return 'Unknown';
    }
}
export function stringToRole(roleStr) {
    switch (roleStr) {
        case 'AssetManager':
            return AccessControlRole.AssetManager;
        case 'OracleManager':
            return AccessControlRole.OracleManager;
        case 'Rebalancer':
            return AccessControlRole.Rebalancer;
        case 'Owner':
            // For Owner role, we can't actually add it as a role in the access control list
            // but we handle it specially in the hasPermission method
            throw new Error(`Cannot add ${AccessControlRole.Owner} as a role. Owner is set during protocol initialization.`);
        default:
            throw new Error(`Invalid role string: ${roleStr}`);
    }
}
