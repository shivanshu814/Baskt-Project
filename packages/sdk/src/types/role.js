/**
 * Roles that can be assigned to accounts for access control
 */
export var AccessControlRole;
(function (AccessControlRole) {
    AccessControlRole[AccessControlRole["Owner"] = 0] = "Owner";
    AccessControlRole[AccessControlRole["AssetManager"] = 1] = "AssetManager";
    AccessControlRole[AccessControlRole["OracleManager"] = 2] = "OracleManager";
    AccessControlRole[AccessControlRole["Rebalancer"] = 3] = "Rebalancer";
})(AccessControlRole || (AccessControlRole = {}));
