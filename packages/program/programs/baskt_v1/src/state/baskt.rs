use crate::error::PerpetualsError;
use crate::state::asset::SyntheticAsset;
use crate::state::oracle::OracleParams;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::account_info::AccountInfo;

#[derive(InitSpace, PartialEq, Debug, Default, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct AssetConfig {
    pub asset_id: Pubkey,
    pub direction: bool,
    pub weight: u64,
    pub baseline_price: u64,
}

#[account]
#[derive(Default, InitSpace)]
pub struct RebalanceHistory {
    pub baskt_id: Pubkey,
    pub rebalance_index: u64,
    #[max_len(20)]
    pub asset_configs: Vec<AssetConfig>,
    pub baseline_nav: u64,
    pub timestamp: i64,
}

impl RebalanceHistory {
    pub fn initialize(
        &mut self,
        baskt_id: Pubkey,
        rebalance_index: u64,
        asset_configs: Vec<AssetConfig>,
        baseline_nav: u64,
        timestamp: i64,
    ) -> Result<()> {
        self.baskt_id = baskt_id;
        self.rebalance_index = rebalance_index;
        self.asset_configs = asset_configs;
        self.baseline_nav = baseline_nav;
        self.timestamp = timestamp;
        Ok(())
    }
}

#[account]
#[derive(Default, InitSpace)]
pub struct Baskt {
    pub baskt_id: Pubkey, // Unique identifier
    #[max_len(20)]
    pub current_asset_configs: Vec<AssetConfig>, // Current baskt configurations
    pub is_public: bool,  // is baskt public or private
    pub creator: Pubkey,  // Creator of the baskt
    pub creation_time: i64, // Time when the baskt was created
    pub last_rebalance_index: u64, // Index of the last rebalance
    pub is_active: bool,  // Whether the baskt is active for trading
    pub last_rebalance_time: i64, // Time when the last rebalance occurred
    pub oracle: OracleParams, // Oracle for the baskt
    pub baseline_nav: u64, // Baseline NAV of the baskt
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
        self.current_asset_configs = asset_configs;
        self.is_public = is_public;
        self.creator = creator;
        self.creation_time = creation_time;
        self.last_rebalance_index = 0;
        self.is_active = false;
        self.last_rebalance_time = creation_time;
        self.baseline_nav = 0;
        self.oracle = OracleParams::default();

        Ok(())
    }

    // Activate the baskt with said prices
    pub fn activate(&mut self, prices: Vec<u64>, current_nav: u64) -> Result<()> {
        self.is_active = true;
        self.baseline_nav = current_nav;
        self.current_asset_configs
            .iter_mut()
            .zip(prices)
            .for_each(|(config, price)| {
                config.baseline_price = price;
            });
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
        self.current_asset_configs
            .iter()
            .any(|id| id.asset_id == *asset_id)
    }

    pub fn get_nav(&self) -> Result<u64> {
        self.oracle.get_price(Clock::get().unwrap().unix_timestamp)
    }

    pub fn validate_assets(
        remaining_accounts: &[AccountInfo],
        baskt_option: Option<&Baskt>, // Optional baskt to validate against
    ) -> Result<()> {
        let pair_count = remaining_accounts.len() / 1;

        // Process each asset/oracle pair to get current prices
        for i in 0..pair_count {
            // Get account infos for this pair
            let asset_info = &remaining_accounts[i];

            // Deserialize asset account
            let asset_data = &mut &**asset_info.try_borrow_data()?;
            let asset: SyntheticAsset =
                match anchor_lang::AccountDeserialize::try_deserialize(asset_data) {
                    Ok(asset) => asset,
                    Err(_) => return Err(PerpetualsError::InvalidAssetAccount.into()),
                };

            // Validate that the asset is part of the baskt if a baskt is provided
            if let Some(baskt) = baskt_option {
                if !baskt.contains_asset(&asset.asset_id) {
                    return Err(PerpetualsError::AssetNotInBaskt.into());
                }
            }
        }

        Ok(())
    }

    pub fn rebalance(
        &mut self,
        asset_configs: Vec<AssetConfig>,
        current_timestamp: i64,
        current_nav: u64,
    ) -> Result<()> {
        // Update baskt state
        for (existing, new) in self
            .current_asset_configs
            .iter_mut()
            .zip(asset_configs.iter())
        {
            existing.baseline_price = new.baseline_price;
        }
        self.last_rebalance_index = self
            .last_rebalance_index
            .checked_add(1)
            .ok_or(PerpetualsError::MathOverflow)?;
        self.last_rebalance_time = current_timestamp;
        self.baseline_nav = current_nav;

        Ok(())
    }
}
