use anchor_lang::prelude::*;
use crate::error::PerpetualsError;
use crate::state::asset::SyntheticAsset;

#[derive(InitSpace, PartialEq, Debug, Default, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct AssetConfig {
    pub asset_id: Pubkey,
    pub direction: bool,
    pub weight: u64,
    pub baseline_price: u64, // Price when the asset was added to the baskt
}

#[account]
#[derive(Default, InitSpace)]
pub struct Baskt {
    pub baskt_id: Pubkey, // Unique identifier
    #[max_len(10)]
    pub baskt_name: String, // Name of the baskt (max 10 chars)
    #[max_len(20)]
    pub current_asset_configs: Vec<AssetConfig>, // Current asset configurations
    pub total_positions: u64, // Total positions within Baskt
    pub is_public: bool,  // is baskt public or private
    pub creator: Pubkey,  // Creator of the baskt
    pub creation_time: i64, // Time when the baskt was created
    pub total_volume: u64, // Total trading volume
    pub total_fees: u64,  // Total fees generated
    pub baseline_nav: u64, // NAV at the time of last rebalance (in lamports)
    pub last_rebalance_index: u64, // Index of the last rebalance
    pub is_active: bool, // Whether the baskt is active for trading
}

impl Baskt {
    /// Initialize a new baskt
    pub fn initialize(
        &mut self,
        baskt_id: Pubkey,
        baskt_name: String,
        asset_configs: Vec<AssetConfig>,
        is_public: bool,
        creator: Pubkey,
        creation_time: i64,
    ) -> Result<()> {
        require!(baskt_name.len() <= 10, PerpetualsError::InvalidBasktName);
        
        self.baskt_id = baskt_id;
        self.baskt_name = baskt_name;
        self.current_asset_configs = asset_configs;
        self.total_positions = 0;
        self.is_public = is_public;
        self.creator = creator;
        self.creation_time = creation_time;
        self.total_volume = 0;
        self.total_fees = 0;
        self.baseline_nav = 1_000_000; // Initial baseline NAV is 1.0 (1e6 lamports)
        self.last_rebalance_index = 0;
        self.is_active = true;

        Ok(())
    }

    /// Get the number of active assets in the baskt
    pub fn get_active_asset_count(&self) -> usize {
        self.current_asset_configs
            .iter()
            .take_while(|id| id.asset_id != Pubkey::default())
            .count()
    }

    /// Check if the baskt contains a specific asset
    pub fn contains_asset(&self, asset_id: &Pubkey) -> bool {
        self.current_asset_configs.iter().any(|id| id.asset_id == *asset_id)
    }

    /// Calculate the NAV of the baskt based on current prices
    pub fn calculate_nav(&self, current_prices: &[(Pubkey, u64)]) -> Result<u64> {
        let mut total_nav_impact: i64 = 0;
        
        for (asset_id, current_price) in current_prices {
            if let Some(asset_config) = self.current_asset_configs.iter().find(|ac| ac.asset_id == *asset_id) {
                // Direction: -1 if short, +1 if long
                let direction: i64 = if asset_config.direction { 1 } else { -1 };
                
                // Calculate price change percentage (scaled by 10000 for precision)
                let current_price_i64 = *current_price as i64;
                let baseline_price_i64 = asset_config.baseline_price as i64;
                
                if baseline_price_i64 == 0 {
                    return err!(PerpetualsError::MathOverflow);
                }
                
                // Calculate price change and apply direction and weight
                let price_change = ((current_price_i64 - baseline_price_i64) * 10000)
                    .checked_div(baseline_price_i64)
                    .ok_or(PerpetualsError::MathOverflow)?;
                
                let weighted_change = (price_change * direction * (asset_config.weight as i64))
                    .checked_div(10000)
                    .ok_or(PerpetualsError::MathOverflow)?;
                    
                // Calculate impact on NAV
                let nav_impact = (weighted_change * (self.baseline_nav as i64))
                    .checked_div(10000)
                    .ok_or(PerpetualsError::MathOverflow)?;
                
                // Add to total impact
                total_nav_impact = total_nav_impact
                    .checked_add(nav_impact)
                    .ok_or(PerpetualsError::MathOverflow)?;
            }
        }
        
        // Calculate new NAV
        let new_nav_i64 = (self.baseline_nav as i64)
            .checked_add(total_nav_impact)
            .ok_or(PerpetualsError::MathOverflow)?;
        
        // Ensure NAV is not negative or zero
        if new_nav_i64 <= 0 {
            return Ok(0);
        }
        
        Ok(new_nav_i64 as u64)
    }

    /// Add volume to the baskt
    pub fn add_volume(&mut self, volume: u64) -> Result<()> {
        require!(self.is_active, PerpetualsError::BasktInactive);
        self.total_volume = self
            .total_volume
            .checked_add(volume)
            .ok_or(PerpetualsError::MathOverflow)?;
        Ok(())
    }

    /// Add fees to the baskt
    pub fn add_fees(&mut self, fees: u64) -> Result<()> {
        require!(self.is_active, PerpetualsError::BasktInactive);
        self.total_fees = self
            .total_fees
            .checked_add(fees)
            .ok_or(PerpetualsError::MathOverflow)?;
        Ok(())
    }

    /// Record a rebalance event
    pub fn record_rebalance(&mut self, current_nav: u64) -> Result<()> {
        self.last_rebalance_index = self.last_rebalance_index
            .checked_add(1)
            .ok_or(PerpetualsError::MathOverflow)?;
        self.baseline_nav = current_nav; // Update baseline NAV to current NAV
        Ok(())
    }

    /// Process asset and oracle account pairs from remaining accounts
    /// Returns a vector of asset IDs and their current prices
    /// If validate_membership is true, also validates that each asset belongs to the baskt
    pub fn process_asset_oracle_pairs(
        remaining_accounts: &[AccountInfo],
        current_timestamp: i64,
        baskt_option: Option<&Baskt>, // Optional baskt to validate against
    ) -> Result<Vec<(Pubkey, u64)>> {
        // Validate remaining accounts (should be pairs of asset and oracle accounts)
        if remaining_accounts.len() % 2 != 0 {
            return Err(PerpetualsError::InvalidRemainingAccounts.into());
        }

        let mut asset_prices = Vec::new();
        let pair_count = remaining_accounts.len() / 2;
        
        // Process each asset/oracle pair to get current prices
        for i in 0..pair_count {
            // Get account infos for this pair
            let asset_info = &remaining_accounts[i * 2];
            let oracle_info = &remaining_accounts[i * 2 + 1];
            
            // Deserialize asset account
            let asset_data = &mut &**asset_info.try_borrow_data()?;
            let asset: SyntheticAsset = match anchor_lang::AccountDeserialize::try_deserialize(asset_data) {
                Ok(asset) => asset,
                Err(_) => return Err(PerpetualsError::InvalidAssetAccount.into()),
            };
            
            // Verify oracle matches asset's oracle
            if oracle_info.key() != asset.oracle.oracle_account {
                return Err(PerpetualsError::InvalidOracleAccount.into());
            }
            
            // Validate that the asset is part of the baskt if a baskt is provided
            if let Some(baskt) = baskt_option {
                if !baskt.contains_asset(&asset.asset_id) {
                    return Err(PerpetualsError::AssetNotInBaskt.into());
                }
            }



            // Get current price from oracle
            // No need to explicitly catch and transform error since get_price already returns the appropriate error
            let oracle_price = asset.get_price(oracle_info, current_timestamp, false)?;
            asset_prices.push((asset.asset_id, oracle_price.price));
        }

        Ok(asset_prices)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_baskt_size() {
        assert!(Baskt::INIT_SPACE > 0);
    }

    #[test]
    fn test_baskt_initialize() {
        let mut baskt = Baskt::default();
        let baskt_id = Pubkey::new_unique();
        let creator = Pubkey::new_unique();
        let creation_time = 1234567890;
        let baskt_name = "TestBaskt".to_string();

        // Create arrays with default values
        let mut asset_configs = vec![AssetConfig::default(); 5];

        // Set some values for testing
        for i in 0..5 {
            asset_configs[i] = AssetConfig {
                asset_id: Pubkey::new_unique(),
                weight: 2000, // 20% each for 5 assets
                direction: true,
                baseline_price: 1_000_000, // 1.0 in lamports
            };
        }

        // Clone asset_configs before passing it to initialize
        let asset_configs_clone = asset_configs.clone();

        baskt
            .initialize(
                baskt_id,
                baskt_name.clone(),
                asset_configs_clone,
                true, // is_public
                creator,
                creation_time,
            )
            .unwrap();

        assert_eq!(baskt.baskt_id, baskt_id);
        assert_eq!(baskt.baskt_name, baskt_name);
        assert_eq!(baskt.current_asset_configs, asset_configs);
        assert_eq!(baskt.total_positions, 0);
        assert_eq!(baskt.is_public, true);
        assert_eq!(baskt.creator, creator);
        assert_eq!(baskt.creation_time, creation_time);
        assert_eq!(baskt.total_volume, 0);
        assert_eq!(baskt.total_fees, 0);
        assert_eq!(baskt.baseline_nav, 1_000_000);
        assert_eq!(baskt.last_rebalance_index, 0);
        assert!(baskt.is_active);
    }

    #[test]
    fn test_baskt_name_length() {
        let mut baskt = Baskt::default();
        let baskt_id = Pubkey::new_unique();
        let creator = Pubkey::new_unique();
        let creation_time = 1234567890;
        let long_name = "ThisNameIsTooLong".to_string(); // 16 chars

        let asset_configs = vec![AssetConfig::default(); 5];

        let result = baskt.initialize(
            baskt_id,
            long_name,
            asset_configs,
            true,
            creator,
            creation_time,
        );

        assert!(result.is_err());
    }

    #[test]
    fn test_calculate_nav() {
        let baskt = Baskt::default();
        let baskt_id = Pubkey::new_unique();
        let creator = Pubkey::new_unique();
        let creation_time = 1234567890;
        let baskt_name = "TestBaskt".to_string();

        // Create test assets
        let asset1 = Pubkey::new_unique();
        let asset2 = Pubkey::new_unique();
        let asset3 = Pubkey::new_unique();

        let asset_configs = vec![
            AssetConfig {
                asset_id: asset1,
                weight: 4000, // 40%
                direction: true,
                baseline_price: 1_000_000, // 1.0
            },
            AssetConfig {
                asset_id: asset2,
                weight: 3000, // 30%
                direction: true,
                baseline_price: 1_000_000, // 1.0
            },
            AssetConfig {
                asset_id: asset3,
                weight: 3000, // 30%
                direction: false, // Short position
                baseline_price: 1_000_000, // 1.0
            },
        ];

        let mut baskt = Baskt::default();
        baskt
            .initialize(
                baskt_id,
                baskt_name,
                asset_configs,
                true,
                creator,
                creation_time,
            )
            .unwrap();

        // Test case 1: Basic price changes
        let current_prices = vec![
            (asset1, 1_200_000), // +20%
            (asset2, 900_000),   // -10%
            (asset3, 1_100_000), // -10% for short position
        ];

        let result = baskt.calculate_nav(&current_prices).unwrap();
        assert_eq!(result, 1_020_000);

        let extreme_prices = vec![
            (asset1, 2_000_000), // +100%
            (asset2, 500_000),   // -50%
            (asset3, 2_000_000), // +100% (but short, so -100%)
        ];

        let result = baskt.calculate_nav(&extreme_prices).unwrap();
        assert_eq!(result, 950_000);

        // Test case 3: Partial price updates (missing assets)
        let partial_prices = vec![
            (asset1, 1_100_000), // +10%
            (asset3, 900_000),   // -10% (but short, so +10%)
        ];

        let result = baskt.calculate_nav(&partial_prices).unwrap();
        assert_eq!(result, 1_070_000);
    }

    #[test]
    fn test_inactive_baskt() {
        let mut baskt = Baskt::default();
        let baskt_id = Pubkey::new_unique();
        let creator = Pubkey::new_unique();
        let creation_time = 1234567890;
        let baskt_name = "TestBaskt".to_string();

        let asset_configs = vec![AssetConfig::default(); 5];

        baskt
            .initialize(
                baskt_id,
                baskt_name,
                asset_configs,
                true,
                creator,
                creation_time,
            )
            .unwrap();

        // Test that inactive baskt cannot accept volume
        baskt.is_active = false;
        let result = baskt.add_volume(100);
        assert!(result.is_err());
    }

    #[test]
    fn test_record_rebalance() {
        let mut baskt = Baskt::default();
        let baskt_id = Pubkey::new_unique();
        let creator = Pubkey::new_unique();
        let creation_time = 1234567890;
        let baskt_name = "TestBaskt".to_string();

        let asset_configs = vec![AssetConfig::default(); 5];

        baskt
            .initialize(
                baskt_id,
                baskt_name,
                asset_configs,
                true,
                creator,
                creation_time,
            )
            .unwrap();

        // Test rebalance recording
        baskt.record_rebalance(1_000_000).unwrap();
        assert_eq!(baskt.last_rebalance_index, 1);
        assert_eq!(baskt.baseline_nav, 1_000_000); // Initial baseline NAV

        // Change NAV and record another rebalance
        baskt.record_rebalance(1_200_000).unwrap();
        assert_eq!(baskt.last_rebalance_index, 2);
        assert_eq!(baskt.baseline_nav, 1_200_000); // Updated baseline NAV
    }

    #[test]
    fn test_baseline_nav_with_price_changes() {
        let mut baskt = Baskt::default();
        let baskt_id = Pubkey::new_unique();
        let creator = Pubkey::new_unique();
        let creation_time = 1234567890;
        let baskt_name = "TestBaskt".to_string();

        // Create test assets
        let asset1 = Pubkey::new_unique();
        let asset2 = Pubkey::new_unique();
        let asset3 = Pubkey::new_unique();

        let asset_configs = vec![
            AssetConfig {
                asset_id: asset1,
                weight: 4000, // 40%
                direction: true,
                baseline_price: 1_000_000, // 1.0
            },
            AssetConfig {
                asset_id: asset2,
                weight: 3000, // 30%
                direction: true,
                baseline_price: 1_000_000, // 1.0
            },
            AssetConfig {
                asset_id: asset3,
                weight: 3000, // 30%
                direction: false, // Short position
                baseline_price: 1_000_000, // 1.0
            },
        ];

        baskt
            .initialize(
                baskt_id,
                baskt_name,
                asset_configs,
                true,
                creator,
                creation_time,
            )
            .unwrap();

        // Initial state
        assert_eq!(baskt.baseline_nav, 1_000_000);

        // Test case 1: Basic price changes
        let current_prices = vec![
            (asset1, 1_200_000), // +20%
            (asset2, 900_000),   // -10%
            (asset3, 1_100_000), // -10% for short position
        ];

        let result = baskt.calculate_nav(&current_prices).unwrap();
        assert_eq!(result, 1_020_000);
        assert_eq!(baskt.baseline_nav, 1_000_000); // Baseline NAV should not change

        // Test case 2: Extreme price changes
        let extreme_prices = vec![
            (asset1, 2_000_000), // +100%
            (asset2, 500_000),   // -50%
            (asset3, 2_000_000), // +100% (but short, so -100%)
        ];

        let result = baskt.calculate_nav(&extreme_prices).unwrap();
        assert_eq!(result, 950_000);
        assert_eq!(baskt.baseline_nav, 1_000_000); // Baseline NAV should remain unchanged until next rebalance

        // Test case 3: Partial price updates (missing assets)
        let partial_prices = vec![
            (asset1, 1_100_000), // +10%
            (asset3, 900_000),   // -10% (but short, so +10%)
        ];

        let result = baskt.calculate_nav(&partial_prices).unwrap();
        assert_eq!(result, 1_070_000);
        assert_eq!(baskt.baseline_nav, 1_000_000); // Baseline NAV should remain unchanged until next rebalance
    }

    #[test]
    fn test_nav_edge_cases() {
        let mut baskt = Baskt::default();
        let baskt_id = Pubkey::new_unique();
        let creator = Pubkey::new_unique();
        let creation_time = 1234567890;
        let baskt_name = "TestBaskt".to_string();

        // Create test assets
        let asset1 = Pubkey::new_unique();
        let asset2 = Pubkey::new_unique();
        let asset3 = Pubkey::new_unique();

        let asset_configs = vec![
            AssetConfig {
                asset_id: asset1,
                weight: 4000, // 40%
                direction: true,
                baseline_price: 1_000_000, // 1.0
            },
            AssetConfig {
                asset_id: asset2,
                weight: 3000, // 30%
                direction: true,
                baseline_price: 1_000_000, // 1.0
            },
            AssetConfig {
                asset_id: asset3,
                weight: 3000, // 30%
                direction: false, // Short position
                baseline_price: 1_000_000, // 1.0
            },
        ];

        baskt.initialize(
            baskt_id,
            baskt_name,
            asset_configs,
            true,
            creator,
            creation_time,
        ).unwrap();

        // Test case 1: Zero price change
        let zero_change_prices = vec![
            (asset1, 1_000_000), // 0%
            (asset2, 1_000_000), // 0%
            (asset3, 1_000_000), // 0%
        ];
        let result = baskt.calculate_nav(&zero_change_prices).unwrap();
        assert_eq!(result, 1_000_000);

        // Test case 2: Extreme price increase (100x)
        let extreme_up_prices = vec![
            (asset1, 100_000_000), // 100x
            (asset2, 1_000_000),   // 0%
            (asset3, 1_000_000),   // 0%
        ];
        let result = baskt.calculate_nav(&extreme_up_prices).unwrap();
        // For 40% weight and 100x increase:
        // 1_000_000 * (1 + 0.4 * 99) = 40_600_000
        assert_eq!(result, 40_600_000);

        // Test case 3: Extreme price decrease (to zero)
        let zero_prices = vec![
            (asset1, 0),         // -100%
            (asset2, 0),         // -100%
            (asset3, 0),         // -100%
        ];
        let result = baskt.calculate_nav(&zero_prices).unwrap();
        // When all assets go to zero:
        // Asset1: 40% long * -100% = -40%
        // Asset2: 30% long * -100% = -30%
        // Asset3: 30% short * -100% = +30%
        // Total impact: -40% - 30% + 30% = -40%
        // NAV = 1_000_000 * (1 - 0.4) = 600_000
        assert_eq!(result, 600_000);

        // Test case 4: Opposite price movements
        let opposite_prices = vec![
            (asset1, 1_200_000), // +20%
            (asset2, 800_000),   // -20%
            (asset3, 1_200_000), // -20% (but short, so +20%)
        ];
        let result = baskt.calculate_nav(&opposite_prices).unwrap();
        // Asset1 (40% long): +20% * 0.4 = +8%
        // Asset2 (30% long): -20% * 0.3 = -6%
        // Asset3 (30% short): -20% * 0.3 = +6% (because short)
        // Total impact: +8% - 6% + 6% = +8%
        // NAV = 1_000_000 * (1 + 0.08) = 1_080_000
        assert_eq!(result, 960_000);
    }

}
