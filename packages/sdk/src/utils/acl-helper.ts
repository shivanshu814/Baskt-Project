import { AccessControlRole } from "../types/role";

export function toRoleString(role: AccessControlRole): string {
  switch (role) {
    case AccessControlRole.Owner:
      return "Owner";
    case AccessControlRole.AssetManager:
      return "AssetManager";
    case AccessControlRole.OracleManager:
      return "OracleManager";
    default:
      return "Unknown";
  }
}
