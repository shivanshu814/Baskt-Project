1. We are not writing tests for pyth oracles

2. Baskt Implementation Notes:
   - Rebalance History:
     - Each rebalance event needs a separate account
     - Account seeds: [b"baskt", baskt_name.as_bytes(), rebalance_index.to_le_bytes()]
     - Account stores previous asset configs and NAV values
     - Main baskt account only tracks the last_rebalance_index
   - Asset Configurations:
     - Renamed asset_configs to current_asset_configs for clarity
     - Each asset config stores its baseline price
     - Weights must sum to 10000 (100%)
   - NAV Calculation:
     - Initial NAV is 1.0 (1e6 lamports)
     - NAV is updated based on price changes and weights
     - Baskt is deactivated if NAV reaches 0
   - Trading:
     - Trading is only allowed when baskt is active
     - Volume and fees can only be added to active baskts
   - PDA Derivation:
     - Baskt accounts use seeds: [b"baskt", baskt_name.as_bytes()]
     - Baskt name is limited to 10 characters
