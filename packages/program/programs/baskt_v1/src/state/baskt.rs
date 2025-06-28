use crate::constants::BPS_DIVISOR;
use crate::error::PerpetualsError;
use crate::state::asset::SyntheticAsset;
use crate::state::oracle::OracleParams;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::account_info::AccountInfo;
use std::collections::HashSet;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum BasktStatus {
    Pending,
    Active,
    Decommissioning {
        initiated_at: i64,
        grace_period_end: i64,
    },
    Settled {
        settlement_price: u64,
        settlement_funding_index: i128,
        settled_at: i64,
    },
    Closed {
        final_nav: u64,
        closed_at: i64,
    },
}

// Rebalance history account
#[account]
#[derive(InitSpace)]
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

#[derive(InitSpace, PartialEq, Debug, Default, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct AssetConfig {
    pub asset_id: Pubkey,
    pub direction: bool,     // true for long, false for short
    pub weight: u64,         // In BPS (basis points, e.g., 5000 = 50%)
    pub baseline_price: u64, // Price at last rebalance/activation
}

use crate::state::config::BasktConfig;

#[account]
#[derive(InitSpace)]
pub struct Baskt {
    pub baskt_id: Pubkey, // Unique identifier
    #[max_len(32)]
    pub baskt_name: String, // Store baskt name for future use
    #[max_len(25)]
    pub current_asset_configs: Vec<AssetConfig>, // Current baskt configurations
    pub is_public: bool,  // is baskt public or private
    pub creator: Pubkey,  // Creator of the baskt
    pub creation_time: i64, // Time when the baskt was created
    pub last_rebalance_index: u64, // Index of the last rebalance
    pub status: BasktStatus, // Current lifecycle status
    pub open_positions: u64, // Track active positions
    pub last_rebalance_time: i64, // Time when the last rebalance occurred
    pub oracle: OracleParams, // Oracle for the baskt
    pub baseline_nav: u64, // Baseline NAV of the baskt at last rebalance/activation
    pub bump: u8,         // Added bump field

    // Baskt-specific overrides
    pub config: BasktConfig,

    // Extra space for future fields
    pub extra_space: [u8; 128],
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
        _bump: u8,
    ) -> Result<()> {
        require!(!baskt_name.is_empty(), PerpetualsError::InvalidBasktConfig);

        // Ensure asset list does not contain duplicates
        let mut seen_assets: HashSet<Pubkey> = HashSet::with_capacity(asset_configs.len());
        for cfg in &asset_configs {
            if !seen_assets.insert(cfg.asset_id) {
                return Err(PerpetualsError::InvalidBasktConfig.into());
            }
        }

        self.baskt_id = baskt_id;
        self.baskt_name = baskt_name;
        self.current_asset_configs = asset_configs;
        self.is_public = is_public;
        self.creator = creator;
        self.creation_time = creation_time;
        self.last_rebalance_index = 0;
        self.status = BasktStatus::Pending; // Start in pending state
        self.open_positions = 0;
        self.last_rebalance_time = creation_time;
        self.baseline_nav = 0;
        self.oracle = OracleParams::default();
        self.bump = _bump;
        self.config = BasktConfig::default();

        Ok(())
    }

    // Activate the baskt with said prices
    pub fn activate(&mut self, prices: Vec<u64>, current_nav: u64) -> Result<()> {
        require!(
            matches!(self.status, BasktStatus::Pending),
            PerpetualsError::BasktAlreadyActive
        );
        require!(
            prices.len() == self.current_asset_configs.len(),
            PerpetualsError::InvalidBasktConfig
        );

        self.status = BasktStatus::Active;
        self.baseline_nav = current_nav;

        // Set baseline prices for each asset
        self.current_asset_configs
            .iter_mut()
            .zip(prices)
            .for_each(|(config, price)| {
                config.baseline_price = price;
            });
        Ok(())
    }

    /// Check if the baskt is in trading state (Active)
    pub fn is_trading(&self) -> bool {
        matches!(self.status, BasktStatus::Active)
    }

    /// Check if the baskt is in unwinding state (Decommissioning or Settled)
    pub fn is_unwinding(&self) -> bool {
        matches!(
            self.status,
            BasktStatus::Decommissioning { .. } | BasktStatus::Settled { .. }
        )
    }

    /// Get the number of active assets in the baskt
    pub fn get_active_asset_count(&self) -> usize {
        self.current_asset_configs
            .iter()
            .take_while(|id| id.asset_id != Pubkey::default()) // Assuming default Pubkey indicates end
            .count()
    }

    /// Check if the baskt contains a specific asset
    pub fn contains_asset(&self, asset_id: &Pubkey) -> bool {
        self.current_asset_configs
            .iter()
            .any(|id| id.asset_id == *asset_id)
    }

    pub fn get_nav(&self) -> Result<u64> {
        self.oracle.get_price()
    }

    pub fn get_settlement_nav(&self) -> Result<u64> {
        match self.status {
            BasktStatus::Settled {
                settlement_price, ..
            } => Ok(settlement_price),
            _ => err!(PerpetualsError::InvalidBasktState),
        }
    }

    pub fn validate_assets(
        remaining_accounts: &[AccountInfo],
        baskt_option: Option<&Baskt>, // Optional baskt to validate against
    ) -> Result<()> {
        let pair_count = remaining_accounts.len(); // Assuming one account per asset

        // Process each asset/oracle pair to get current prices
        for i in 0..pair_count {
            // Get account infos for this pair
            let asset_info = &remaining_accounts[i];

            // Deserialize asset account
            let borrowed_data = asset_info.try_borrow_data()?;
            let mut asset_data = &borrowed_data[..];
            let asset: SyntheticAsset =
                anchor_lang::AccountDeserialize::try_deserialize(&mut asset_data)
                    .map_err(|_| PerpetualsError::InvalidAssetAccount)?;

            // Validate that the asset is part of the baskt if a baskt is provided
            if let Some(baskt) = baskt_option {
                if !baskt.contains_asset(&asset.asset_id) {
                    return Err(PerpetualsError::AssetNotInBaskt.into());
                }
            }
        }

        Ok(())
    }

    /// Rebalance the basket with new asset configurations
    pub fn rebalance(
        &mut self,
        new_asset_configs: Vec<AssetConfig>,
        current_timestamp: i64,
        current_nav: u64,
    ) -> Result<()> {
        require!(self.is_trading(), PerpetualsError::BasktInactive);
        require!(
            new_asset_configs.len() == self.current_asset_configs.len(),
            PerpetualsError::InvalidBasktConfig
        );

        // Single pass: validate assets, weights, calculate total, and update baseline prices
        let mut total_weight: u64 = 0;

        for (i, new_config) in new_asset_configs.iter().enumerate() {
            let current_config = &mut self.current_asset_configs[i];

            // Verify asset ID matches
            require!(
                new_config.asset_id == current_config.asset_id,
                PerpetualsError::InvalidBasktConfig
            );

            // Verify weight is positive
            require!(new_config.weight > 0, PerpetualsError::InvalidAssetWeights);

            // Accumulate total weight
            total_weight = total_weight
                .checked_add(new_config.weight)
                .ok_or(PerpetualsError::MathOverflow)?;

            // Update baseline price (keeping existing weight and direction)
            current_config.baseline_price = new_config.baseline_price;
        }

        // Verify total weight is 10000 (100%)
        require!(
            total_weight == BPS_DIVISOR,
            PerpetualsError::InvalidAssetWeights
        );

        // Update rebalance metadata
        self.last_rebalance_index = self
            .last_rebalance_index
            .checked_add(1)
            .ok_or(PerpetualsError::MathOverflow)?;
        self.last_rebalance_time = current_timestamp;
        self.baseline_nav = current_nav;

        Ok(())
    }
}
