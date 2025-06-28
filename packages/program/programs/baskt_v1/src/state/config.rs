use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq, InitSpace)]
pub struct BasktConfig {
    // Fees
    pub opening_fee_bps: Option<u64>,
    pub closing_fee_bps: Option<u64>,
    pub liquidation_fee_bps: Option<u64>,

    // Risk Parameters
    pub min_collateral_ratio_bps: Option<u64>,
    pub liquidation_threshold_bps: Option<u64>,
}

impl Default for BasktConfig {
    fn default() -> Self {
        Self {
            opening_fee_bps: None,
            closing_fee_bps: None,
            liquidation_fee_bps: None,
            min_collateral_ratio_bps: None,
            liquidation_threshold_bps: None,
        }
    }
}
