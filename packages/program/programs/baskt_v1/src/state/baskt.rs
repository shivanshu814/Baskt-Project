use anchor_lang::prelude::*;

#[derive(InitSpace, PartialEq, Debug, Default, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct AssetConfig {
    pub asset_id: Pubkey,
    pub direction: bool,
    pub weight: u64,
    // baseline Add price here
}

#[account]
#[derive(Default, InitSpace)]
pub struct Baskt {
    pub baskt_id: Pubkey, // Unique identifier
    #[max_len(20)]
    pub asset_configs: Vec<AssetConfig>, // Assets
    pub total_positions: u64, // Total positions within Baskt
    pub is_public: bool,  // is baskt public or private
    pub creator: Pubkey,  // Creator of the baskt
    pub creation_time: i64, // Time when the baskt was created
    pub total_volume: u64, // Total trading volume
    pub total_fees: u64,  // Total fees generated

                          // This begs an important questoin, what to do when baskt prices are 0? Should we stop or halt all trading on it?
                          // Most probably yes

                          // We need to also store a NAV price baseline
                          // This will also change each time we rebalance the baskt
                          // initally it will be +1. Then as we rebalance it will change along with the baseline prices.

                          //1. Add a new struct to store the baseline prices
                          //2. Add a new entry to store the rebalance history. Each new rebalance will have to be
                          //a new account with reabalnce + baskt.id + (idx). These can be in the thousands.
                          // Each rebalance will need to store. Prev Asset configs.
                          // So when the baskt is first created. it will create 0 with current / inital prices
                          // After first rebalance index 1 will be the new prices. Then the current baseline price will reflect it.
                          // So asset config will t
}

impl Baskt {
    /// Initialize a new baskt
    pub fn initialize(
        &mut self,
        baskt_id: Pubkey,
        asset_configs: Vec<AssetConfig>,
        is_public: bool,
        creator: Pubkey,
        creation_time: i64,
    ) -> Result<()> {
        self.baskt_id = baskt_id;
        self.asset_configs = asset_configs;
        self.total_positions = 0;
        self.is_public = is_public;
        self.creator = creator;
        self.creation_time = creation_time;
        self.total_volume = 0;
        self.total_fees = 0;

        // When the baskt is initialized its price will be 1e6. So we need to adjust the
        // asset config's whatever to so that it can reflect that

        Ok(())
    }

    /// Get the number of active assets in the baskt
    pub fn get_active_asset_count(&self) -> usize {
        self.asset_configs
            .iter()
            .take_while(|id| id.asset_id != Pubkey::default())
            .count()
    }

    /// Check if the baskt contains a specific asset
    pub fn contains_asset(&self, asset_id: &Pubkey) -> bool {
        self.asset_configs.iter().any(|id| id.asset_id == *asset_id)
    }

    /// Update the NAV of the baskt
    pub fn caculate_nav(&mut self) -> Result<()> {
        /// First lets get all the assets the user has and their prices
        /// Then we need to calculate their baseline prices when the asset was created.
        /// For each asset
        ///  Calculate their % change from the baseline prices, if short on asset then thats a net positive
        ///  else if long ten just normal % change is fine.
        ///  Multiply this by the assets weight
        ///  Then add up all of them to current +1.
        ///  This is the new NAV
        Ok(())
    }

    /// Add volume to the baskt
    pub fn add_volume(&mut self, volume: u64) -> Result<()> {
        self.total_volume = self
            .total_volume
            .checked_add(volume)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        Ok(())
    }

    /// Add fees to the baskt
    pub fn add_fees(&mut self, fees: u64) -> Result<()> {
        self.total_fees = self
            .total_fees
            .checked_add(fees)
            .ok_or(ProgramError::ArithmeticOverflow)?;
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

        // Create arrays with default values
        let mut asset_configs = vec![AssetConfig::default(); 5];

        // Set some values for testing
        for i in 0..5 {
            asset_configs[i] = AssetConfig {
                asset_id: Pubkey::new_unique(),
                weight: 2000, // 20% each for 5 assets
                direction: false,
            };
        }

        // Clone asset_configs before passing it to initialize
        let asset_configs_clone = asset_configs.clone();

        baskt
            .initialize(
                baskt_id,
                asset_configs_clone,
                true, // is_public
                creator,
                creation_time,
            )
            .unwrap();

        assert_eq!(baskt.baskt_id, baskt_id);
        assert_eq!(baskt.asset_configs, asset_configs);
        assert_eq!(baskt.total_positions, 0);
        assert_eq!(baskt.is_public, true);
        assert_eq!(baskt.creator, creator);
        assert_eq!(baskt.creation_time, creation_time);
        assert_eq!(baskt.total_volume, 0);
        assert_eq!(baskt.total_fees, 0);
    }

    #[test]
    fn test_get_active_asset_count() {
        let mut baskt = Baskt::default();
        let mut asset_configs = vec![AssetConfig::default(); 5];

        // Set 7 active assets
        for i in 0..5 {
            asset_configs[i] = AssetConfig {
                asset_id: Pubkey::new_unique(),
                weight: 2000, // 20% each for 5 assets
                direction: false,
            };
        }

        // Clone before assignment to avoid ownership issues
        baskt.asset_configs = asset_configs.clone();

        assert_eq!(baskt.get_active_asset_count(), 5);
    }

    #[test]
    fn test_contains_asset() {
        let mut baskt = Baskt::default();
        let asset1 = Pubkey::new_unique();
        let asset2 = Pubkey::new_unique();
        let asset3 = Pubkey::new_unique();

        let mut asset_configs = vec![AssetConfig::default(); 5];
        asset_configs[0] = AssetConfig {
            asset_id: asset1,
            weight: 2000,
            direction: false,
        };
        asset_configs[1] = AssetConfig {
            asset_id: asset2,
            weight: 2000,
            direction: false,
        };

        // Clone before assignment to avoid ownership issues
        baskt.asset_configs = asset_configs.clone();

        assert!(baskt.contains_asset(&asset1));
        assert!(baskt.contains_asset(&asset2));
        assert!(!baskt.contains_asset(&asset3));
    }

    #[test]
    fn test_add_volume() {
        let mut baskt = Baskt::default();

        baskt.add_volume(500).unwrap();
        assert_eq!(baskt.total_volume, 500);

        baskt.add_volume(300).unwrap();
        assert_eq!(baskt.total_volume, 800);
    }

    #[test]
    fn test_add_fees() {
        let mut baskt = Baskt::default();

        baskt.add_fees(50).unwrap();
        assert_eq!(baskt.total_fees, 50);

        baskt.add_fees(30).unwrap();
        assert_eq!(baskt.total_fees, 80);
    }
}
