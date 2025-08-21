use crate::constants::BPS_DIVISOR;
use crate::error::PerpetualsError;
use crate::state::asset::SyntheticAsset;
use crate::state::fee_index::RebalanceFeeIndex;
use crate::state::funding_index::FundingIndex;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::account_info::AccountInfo;
use std::collections::HashSet;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
#[repr(u8)]
pub enum BasktStatus {
    Pending = 0,
    Active = 1,
    Decommissioning = 2,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq, InitSpace)]
pub struct BasktConfig {
    pub flags: u8,
    pub opening_fee_bps: u64,
    pub closing_fee_bps: u64,
    pub liquidation_fee_bps: u64,
    pub min_collateral_ratio_bps: u64,
    pub liquidation_threshold_bps: u64,
}

impl BasktConfig {
    pub fn has_opening_fee(&self) -> bool {
        self.flags & 0x01 != 0
    }
    
    pub fn has_closing_fee(&self) -> bool {
        self.flags & 0x02 != 0
    }
    
    pub fn has_liquidation_fee(&self) -> bool {
        self.flags & 0x04 != 0
    }
    
    pub fn has_min_collateral_ratio(&self) -> bool {
        self.flags & 0x08 != 0
    }
    
    pub fn has_liquidation_threshold(&self) -> bool {
        self.flags & 0x10 != 0
    }
    
    pub fn get_opening_fee_bps(&self) -> Option<u64> {
        if self.has_opening_fee() {
            Some(self.opening_fee_bps)
        } else {
            None
        }
    }
    
    pub fn get_closing_fee_bps(&self) -> Option<u64> {
        if self.has_closing_fee() {
            Some(self.closing_fee_bps)
        } else {
            None
        }
    }
    
    pub fn get_liquidation_fee_bps(&self) -> Option<u64> {
        if self.has_liquidation_fee() {
            Some(self.liquidation_fee_bps)
        } else {
            None
        }
    }
    
    pub fn get_min_collateral_ratio_bps(&self) -> Option<u64> {
        if self.has_min_collateral_ratio() {
            Some(self.min_collateral_ratio_bps)
        } else {
            None
        }
    }
    
    pub fn get_liquidation_threshold_bps(&self) -> Option<u64> {
        if self.has_liquidation_threshold() {
            Some(self.liquidation_threshold_bps)
        } else {
            None
        }
    }
    
    pub fn set_opening_fee_bps(&mut self, fee: Option<u64>) {
        match fee {
            Some(value) => {
                self.flags |= 0x01;
                self.opening_fee_bps = value;
            }
            None => {
                self.flags &= !0x01;
                self.opening_fee_bps = 0;
            }
        }
    }
    
    pub fn set_closing_fee_bps(&mut self, fee: Option<u64>) {
        match fee {
            Some(value) => {
                self.flags |= 0x02;
                self.closing_fee_bps = value;
            }
            None => {
                self.flags &= !0x02;
                self.closing_fee_bps = 0;
            }
        }
    }
    
    pub fn set_liquidation_fee_bps(&mut self, fee: Option<u64>) {
        match fee {
            Some(value) => {
                self.flags |= 0x04;
                self.liquidation_fee_bps = value;
            }
            None => {
                self.flags &= !0x04;
                self.liquidation_fee_bps = 0;
            }
        }
    }
    
    pub fn set_min_collateral_ratio_bps(&mut self, ratio: Option<u64>) {
        match ratio {
            Some(value) => {
                self.flags |= 0x08;
                self.min_collateral_ratio_bps = value;
            }
            None => {
                self.flags &= !0x08;
                self.min_collateral_ratio_bps = 0;
            }
        }
    }
    
    pub fn set_liquidation_threshold_bps(&mut self, threshold: Option<u64>) {
        match threshold {
            Some(value) => {
                self.flags |= 0x10;
                self.liquidation_threshold_bps = value;
            }
            None => {
                self.flags &= !0x10;
                self.liquidation_threshold_bps = 0;
            }
        }
    }
}

impl Default for BasktConfig {
    fn default() -> Self {
        Self {
            flags: 0,
            opening_fee_bps: 0,
            closing_fee_bps: 0,
            liquidation_fee_bps: 0,
            min_collateral_ratio_bps: 0,
            liquidation_threshold_bps: 0,
        }
    }
}

#[derive(InitSpace, PartialEq, Debug, Default, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct AssetConfig {
    pub asset_id: Pubkey,
    pub direction: bool,     // true for long, false for short
    pub weight: u64,         // In BPS (basis points, e.g., 5000 = 50%)
    pub baseline_price: u64, // Price at last rebalance/activation
}

#[account]
#[derive(InitSpace)]
pub struct Baskt {
    pub uid: u32,
    #[max_len(10)]
    pub current_asset_configs: Vec<AssetConfig>,
    pub is_public: bool,
    pub creator: Pubkey,
    pub status: BasktStatus,

    pub open_positions: u32,
    pub last_rebalance_time: u32,
    pub bump: u8,
    pub rebalance_period: u32,
    pub config: BasktConfig,
    pub funding_index: FundingIndex,
    pub rebalance_fee_index: RebalanceFeeIndex,
    pub extra_space: [u8; 120],
}

impl Baskt {
    /// Initialize a new baskt
    pub fn initialize(
        &mut self,
        uid: u32,
        asset_configs: Vec<AssetConfig>,
        is_public: bool,
        creator: Pubkey,
        creation_time: u32,
        _bump: u8,
        rebalance_period: u32,
    ) -> Result<()> {
        // Ensure asset list does not contain duplicates
        let mut seen_assets: HashSet<Pubkey> = HashSet::with_capacity(asset_configs.len());
        for cfg in &asset_configs {
            if !seen_assets.insert(cfg.asset_id) {
                return Err(PerpetualsError::InvalidBasktConfig.into());
            }
        }
        self.uid = uid;
        self.current_asset_configs = asset_configs;
        self.is_public = is_public;
        self.creator = creator;
        self.status = BasktStatus::Pending;
        self.open_positions = 0;
        self.last_rebalance_time = creation_time;
        self.bump = _bump;
        self.rebalance_period = rebalance_period;
        self.config = BasktConfig::default();

        // Initialize rebalance fee index
        self.rebalance_fee_index.initialize(creation_time as i64)?;

        Ok(())
    }

    // Activate the baskt with said prices
    pub fn activate(&mut self, prices: Vec<u64>) -> Result<()> {
        require!(
            matches!(self.status, BasktStatus::Pending),
            PerpetualsError::BasktAlreadyActive
        );
        require!(
            prices.len() == self.current_asset_configs.len(),
            PerpetualsError::InvalidBasktConfig
        );

        // Ensure no prices are zero
        for price in &prices {
            require!(*price > 0, PerpetualsError::InvalidBasktConfig);
        }

        self.status = BasktStatus::Active;

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

    /// Check if the baskt is in unwinding state (Decommissioning)
    pub fn is_unwinding(&self) -> bool {
        matches!(self.status, BasktStatus::Decommissioning)
    }

    


}
