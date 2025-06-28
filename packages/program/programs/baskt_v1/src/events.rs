use crate::state::config::BasktConfig;
use crate::state::order::{OrderAction, OrderType};
use anchor_lang::prelude::*;

//----------------------------------------------------------------------------
// EVENTS
//----------------------------------------------------------------------------

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct RegistryInitializedEvent {
    pub registry: Pubkey,
    pub protocol: Pubkey,
    pub treasury: Pubkey,
    pub treasury_token: Pubkey,
    pub liquidity_pool: Pubkey,
    pub token_vault: Pubkey,
    pub pool_authority: Pubkey,
    pub program_authority: Pubkey,
    pub escrow_mint: Pubkey,
    pub initializer: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct OrderCreatedEvent {
    pub owner: Pubkey,
    pub order_id: u64,
    pub baskt_id: Pubkey,
    pub size: u64,
    pub collateral: u64,
    pub is_long: bool,
    pub action: OrderAction,
    pub target_position: Option<Pubkey>,
    pub limit_price: u64,
    pub max_slippage_bps: u64,
    pub order_type: OrderType,
    pub leverage_bps: u64,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct OrderCancelledEvent {
    pub owner: Pubkey,
    pub order_id: u64,
    pub baskt_id: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct OrderFilledEvent {
    pub owner: Pubkey,
    pub order_id: u64,
    pub baskt_id: Pubkey,
    pub action: OrderAction,
    pub size: u64,
    pub fill_price: u64,
    pub position_id: Option<u64>,        // For open orders
    pub target_position: Option<Pubkey>, // For close orders
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct PositionOpenedEvent {
    pub order_id: u64,
    pub owner: Pubkey,
    pub position_id: u64,
    pub baskt_id: Pubkey,
    pub size: u64,
    pub collateral: u64,
    pub is_long: bool,
    pub entry_price: u64,
    pub entry_funding_index: i128,
    pub fee_to_treasury: u64,
    pub fee_to_blp: u64,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct PositionClosedEvent {
    pub order_id: u64,
    pub owner: Pubkey,
    pub position_id: u64,
    pub baskt_id: Pubkey,
    pub size: u64,
    pub exit_price: u64,
    pub pnl: i64,
    pub fee_to_treasury: u64,
    pub fee_to_blp: u64,
    pub funding_payment: i128,
    pub settlement_amount: u64,
    pub pool_payout: u64,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct PositionLiquidatedEvent {
    pub owner: Pubkey,
    pub position_id: u64,
    pub baskt_id: Pubkey,
    pub size: u64,
    pub exit_price: u64,
    pub pnl: i64,
    pub fee_to_treasury: u64,
    pub fee_to_blp: u64,
    pub funding_payment: i128,
    pub remaining_collateral: u64,
    pub pool_payout: u64,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct CollateralAddedEvent {
    pub owner: Pubkey,
    pub position_id: u64,
    pub baskt_id: Pubkey,
    pub additional_collateral: u64,
    pub new_total_collateral: u64,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct FundingIndexUpdatedEvent {
    pub baskt_id: Pubkey,
    pub cumulative_index: i128,
    pub current_rate: i64,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct FundingIndexInitializedEvent {
    pub baskt_id: Pubkey,
    pub initial_index: i128,
    pub timestamp: i64,
}

#[event]
#[derive(Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktCreatedEvent {
    pub baskt_id: Pubkey,
    pub baskt_name: String,
    pub creator: Pubkey,
    pub is_public: bool,
    pub asset_count: u8,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktActivatedEvent {
    pub baskt_id: Pubkey,
    pub baseline_nav: u64,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktRebalancedEvent {
    pub baskt_id: Pubkey,
    pub rebalance_index: u64,
    pub baseline_nav: u64,
    pub timestamp: i64,
}

// Baskt Decommissioning Events

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktDecommissioningInitiated {
    pub baskt: Pubkey,
    pub initiated_at: i64,
    pub grace_period_end: i64,
    pub open_positions: u64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktSettled {
    pub baskt: Pubkey,
    pub settlement_price: u64,
    pub settlement_funding_index: i128,
    pub settled_at: i64,
    pub remaining_positions: u64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct PositionForceClosed {
    pub baskt: Pubkey,
    pub position: Pubkey,
    pub owner: Pubkey,
    pub settlement_price: u64,
    pub close_price: u64,
    pub entry_price: u64,
    pub size: u64,
    pub is_long: bool,
    pub collateral_returned: u64,
    pub pnl: i64,
    pub funding_payment: i128,
    pub closed_by: Pubkey,
    // Enhanced fields for better audit trail
    pub timestamp: i64,
    pub escrow_returned_to_pool: u64,
    pub pool_payout: u64,
    pub bad_debt_absorbed: u64,
    pub baskt_settlement_timestamp: i64,
    pub position_duration_seconds: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktClosed {
    pub baskt: Pubkey,
    pub final_nav: u64,
    pub closed_at: i64,
}

// Liquidity Pool Events

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct LiquidityPoolInitializedEvent {
    pub liquidity_pool: Pubkey,
    pub lp_mint: Pubkey,
    pub token_vault: Pubkey,
    pub deposit_fee_bps: u16,
    pub withdrawal_fee_bps: u16,
    pub min_deposit: u64,
    pub initializer: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct LiquidityAddedEvent {
    pub provider: Pubkey,
    pub liquidity_pool: Pubkey,
    pub deposit_amount: u64,
    pub fee_amount: u64,
    pub shares_minted: u64,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct LiquidityRemovedEvent {
    pub provider: Pubkey,
    pub liquidity_pool: Pubkey,
    pub shares_burned: u64,
    pub withdrawal_amount: u64,
    pub fee_amount: u64,
    pub net_amount_received: u64,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct OpeningFeeUpdatedEvent {
    pub protocol: Pubkey,
    pub old_opening_fee_bps: u64,
    pub new_opening_fee_bps: u64,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct ClosingFeeUpdatedEvent {
    pub protocol: Pubkey,
    pub old_closing_fee_bps: u64,
    pub new_closing_fee_bps: u64,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct LiquidationFeeUpdatedEvent {
    pub protocol: Pubkey,
    pub old_liquidation_fee_bps: u64,
    pub new_liquidation_fee_bps: u64,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct MinCollateralRatioUpdatedEvent {
    pub protocol: Pubkey,
    pub old_min_collateral_ratio_bps: u64,
    pub new_min_collateral_ratio_bps: u64,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct LiquidationThresholdUpdatedEvent {
    pub protocol: Pubkey,
    pub old_liquidation_threshold_bps: u64,
    pub new_liquidation_threshold_bps: u64,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct TreasuryUpdatedEvent {
    pub protocol: Pubkey,
    pub old_treasury: Pubkey,
    pub new_treasury: Pubkey,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct MaxPriceAgeUpdatedEvent {
    pub protocol: Pubkey,
    pub old_max_price_age_sec: u32,
    pub new_max_price_age_sec: u32,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct MaxPriceDeviationUpdatedEvent {
    pub protocol: Pubkey,
    pub old_max_price_deviation_bps: u64,
    pub new_max_price_deviation_bps: u64,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct LiquidationPriceDeviationUpdatedEvent {
    pub protocol: Pubkey,
    pub old_liquidation_price_deviation_bps: u64,
    pub new_liquidation_price_deviation_bps: u64,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct MinLiquidityUpdatedEvent {
    pub protocol: Pubkey,
    pub old_min_liquidity: u64,
    pub new_min_liquidity: u64,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct TreasuryCutUpdatedEvent {
    pub protocol: Pubkey,
    pub old_treasury_cut_bps: u64,
    pub new_treasury_cut_bps: u64,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct FundingCutUpdatedEvent {
    pub protocol: Pubkey,
    pub old_funding_cut_bps: u64,
    pub new_funding_cut_bps: u64,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct DecommissionGracePeriodUpdatedEvent {
    pub protocol: Pubkey,
    pub old_grace_period: i64,
    pub new_grace_period: i64,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

// Baskt Config Events

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktOpeningFeeUpdatedEvent {
    pub baskt: Pubkey,
    pub old_opening_fee_bps: Option<u64>,
    pub new_opening_fee_bps: Option<u64>,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktClosingFeeUpdatedEvent {
    pub baskt: Pubkey,
    pub old_closing_fee_bps: Option<u64>,
    pub new_closing_fee_bps: Option<u64>,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktLiquidationFeeUpdatedEvent {
    pub baskt: Pubkey,
    pub old_liquidation_fee_bps: Option<u64>,
    pub new_liquidation_fee_bps: Option<u64>,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktMinCollateralRatioUpdatedEvent {
    pub baskt: Pubkey,
    pub old_min_collateral_ratio_bps: Option<u64>,
    pub new_min_collateral_ratio_bps: Option<u64>,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktLiquidationThresholdUpdatedEvent {
    pub baskt: Pubkey,
    pub old_liquidation_threshold_bps: Option<u64>,
    pub new_liquidation_threshold_bps: Option<u64>,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktConfigUpdatedEvent {
    pub baskt: Pubkey,
    pub old_config: BasktConfig,
    pub new_config: BasktConfig,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}
