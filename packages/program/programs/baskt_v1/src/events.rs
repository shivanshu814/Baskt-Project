use anchor_lang::prelude::*;
use crate::state::order::OrderAction;

//----------------------------------------------------------------------------
// EVENTS
//----------------------------------------------------------------------------

#[event]
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
    pub timestamp: i64,
}

#[event]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct OrderCancelledEvent {
    pub owner: Pubkey,
    pub order_id: u64,
    pub baskt_id: Pubkey,
    pub timestamp: i64,
}

#[event]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct PositionOpenedEvent {
    pub owner: Pubkey,
    pub position_id: u64,
    pub baskt_id: Pubkey,
    pub size: u64,
    pub collateral: u64,
    pub is_long: bool,
    pub entry_price: u64,
    pub entry_funding_index: i128,
    pub timestamp: i64,
}

#[event]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct PositionClosedEvent {
    pub owner: Pubkey,
    pub position_id: u64,
    pub baskt_id: Pubkey,
    pub size: u64,
    pub exit_price: u64,
    pub pnl: i64,
    pub fee_amount: u64,
    pub funding_payment: i128,
    pub settlement_amount: u64,
    pub pool_payout: u64,
    pub timestamp: i64,
}

#[event]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct PositionLiquidatedEvent {
    pub owner: Pubkey,
    pub position_id: u64,
    pub baskt_id: Pubkey,
    pub size: u64,
    pub exit_price: u64,
    pub pnl: i64,
    pub liquidation_fee: u64,
    pub funding_payment: i128,
    pub remaining_collateral: u64,
    pub pool_payout: u64,
    pub timestamp: i64,
}

#[event]
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
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct FundingIndexUpdatedEvent {
    pub baskt_id: Pubkey,
    pub cumulative_index: i128,
    pub current_rate: i64,
    pub timestamp: i64,
}

#[event]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct FundingIndexInitializedEvent {
    pub baskt_id: Pubkey,
    pub initial_index: i128,
    pub timestamp: i64,
}

#[event]
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
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktActivatedEvent {
    pub baskt_id: Pubkey,
    pub baseline_nav: u64,
    pub timestamp: i64,
}

#[event]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktRebalancedEvent {
    pub baskt_id: Pubkey,
    pub rebalance_index: u64,
    pub baseline_nav: u64,
    pub timestamp: i64,
}

// Liquidity Pool Events

#[event]
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