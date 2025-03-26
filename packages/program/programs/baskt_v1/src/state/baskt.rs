use anchor_lang::prelude::*;
use crate::error::PerpetualsError;

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
    pub current_nav: u64, // Current Net Asset Value (in lamports)
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
        self.current_nav = 1_000_000; // Initial NAV is 1.0 (1e6 lamports)
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

    /// Update the NAV of the baskt
    pub fn calculate_nav(&mut self, current_prices: &[(Pubkey, u64)]) -> Result<()> {
        let mut new_nav = 0u64;
        
        for (asset_id, current_price) in current_prices {
            if let Some(asset_config) = self.current_asset_configs.iter().find(|ac| ac.asset_id == *asset_id) {
                // Calculate price change percentage
                let price_change = if asset_config.direction {
                    // Long position: normal price change
                    current_price
                        .checked_mul(10000)
                        .ok_or(PerpetualsError::MathOverflow)?
                        .checked_div(asset_config.baseline_price)
                        .ok_or(PerpetualsError::MathOverflow)?
                } else {
                    // Short position: inverse price change
                    asset_config.baseline_price
                        .checked_mul(10000)
                        .ok_or(PerpetualsError::MathOverflow)?
                        .checked_div(*current_price)
                        .ok_or(PerpetualsError::MathOverflow)?
                };

                // Apply weight to price change
                let weighted_change = price_change
                    .checked_mul(asset_config.weight)
                    .ok_or(PerpetualsError::MathOverflow)?;
                new_nav = new_nav
                    .checked_add(weighted_change)
                    .ok_or(PerpetualsError::MathOverflow)?;
            }
        }

        // Normalize NAV to 1e6 scale
        self.current_nav = new_nav
            .checked_div(10000)
            .ok_or(PerpetualsError::MathOverflow)?;

        // If NAV is 0 or below, deactivate the baskt
        if self.current_nav == 0 {
            self.is_active = false;
        }

        Ok(())
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
    pub fn record_rebalance(&mut self) -> Result<()> {
        self.last_rebalance_index = self.last_rebalance_index
            .checked_add(1)
            .ok_or(PerpetualsError::MathOverflow)?;
        Ok(())
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
        assert_eq!(baskt.current_nav, 1_000_000);
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

        // Test price changes
        let current_prices = vec![
            (asset1, 1_200_000), // +20%
            (asset2, 900_000),   // -10%
            (asset3, 1_100_000), // +10% (but short position)
        ];

        baskt.calculate_nav(&current_prices).unwrap();

        // Expected NAV calculation:
        // Asset1: 40% * 120% = 48%
        // Asset2: 30% * 90% = 27%
        // Asset3: 30% * 90.9% = 27.27% (short position)
        // Total: 102.27% of initial NAV
        assert!(baskt.current_nav > 1_000_000);
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
        baskt.record_rebalance().unwrap();
        assert_eq!(baskt.last_rebalance_index, 1);

        baskt.record_rebalance().unwrap();
        assert_eq!(baskt.last_rebalance_index, 2);
    }
}
