// Protocol Management
// Available commands in this category:
// - update-protocol-config: Updates protocol configuration parameters (fees, ratios, treasury, etc.)
// - update-feature-flags: Updates protocol feature flags
// - add-role: Adds a role to an account
// - remove-role: Removes a role from an account

export const protocolHelp = `
Protocol Management:
  update-protocol-config - Updates protocol configuration parameters (fees, ratios, treasury, etc.)
  update-feature-flags - Updates protocol feature flags
  add-role - Adds a role to an account
  remove-role - Removes a role from an account

Protocol Config Parameters (via update-protocol-config):
  - openingfeebps: Opening fee in basis points
  - closingfeebps: Closing fee in basis points  
  - liquidationfeebps: Liquidation fee in basis points
  - mincollateralratiobps: Minimum collateral ratio in basis points
  - liquidationthresholdbps: Liquidation threshold in basis points
  - minliquidity: Minimum liquidity requirement
  - rebalancerequestfee: Rebalance request fee in lamports
  - basktcreationfee: Baskt creation fee in lamports
  - treasury: Treasury public key

Role Management:
  - add-role <account> <role>: Adds a role to an account
  - remove-role <account> <role>: Removes a role from an account
  - Available roles: ADMIN, OPERATOR, GUARDIAN, LIQUIDATOR, TRADER
`; 