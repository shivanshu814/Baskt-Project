// Configuration Management
// Available commands in this category:
// - update-baskt-config: Updates baskt configuration parameters (fees, ratios, etc.)
// - update-funding-index: Updates the funding index rate for a baskt
// - faucet: Faucet for USDC or SOL

export const configHelp = `
Configuration Management:
  update-baskt-config - Updates baskt configuration parameters (fees, ratios, etc.)
  update-funding-index - Updates the funding index rate for a baskt
  faucet - Faucet for USDC or SOL

Baskt Config Parameters (via update-baskt-config):
  - basktId: Baskt public key
  - openingFeeBps: Opening fee in basis points (0-500, or null)
  - closingFeeBps: Closing fee in basis points (0-500, or null)
  - liquidationFeeBps: Liquidation fee in basis points (0-500, or null)
  - minCollateralRatioBps: Minimum collateral ratio in basis points (min 11000)
  - liquidationThresholdBps: Liquidation threshold in basis points (non-negative)

Funding Index:
  - update-funding-index <basktId> <rate>: Updates funding index rate for a baskt
`; 