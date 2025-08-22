use crate::state::order::{OrderAction, OrderType};
use anchor_lang::prelude::*;

//----------------------------------------------------------------------------
// EVENTS - ORGANIZED BY FUNCTIONALITY
//----------------------------------------------------------------------------
// This file organizes all Solana program events into logical groups:
//
// 1. ORDER EVENTS - Order creation, cancellation, and management
// 2. POSITION EVENTS - Position opening, closing, liquidation, and management
// 3. BASKT EVENTS - Baskt lifecycle, configuration, and rebalancing
// 4. FUNDING EVENTS - Funding rate and index updates
// 5. LIQUIDITY POOL EVENTS - Liquidity pool operations and withdrawals
// 6. PROTOCOL EVENTS - Protocol-level state changes
//
// Each section contains related events with consistent naming conventions
// and field structures. Events are ordered by their logical flow in the
// system lifecycle.
//----------------------------------------------------------------------------

//----------------------------------------------------------------------------
// ORDER EVENTS
//----------------------------------------------------------------------------

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct OrderCreatedEvent {
    pub owner: Pubkey,
    pub order_id: u64,
    pub baskt_id: Pubkey,
    pub notional_value: u64,
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

//----------------------------------------------------------------------------
// POSITION EVENTS
//----------------------------------------------------------------------------

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
    pub fee_to_treasury: u64,
    pub fee_to_blp: u64,
    pub timestamp: i64,
}

#[event]
#[derive(Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct PositionClosedEvent {
    pub order_id: u64,
    pub owner: Pubkey,
    pub position_id: u64,
    pub baskt_id: Pubkey,
    pub size_closed: u64,
    pub size_remaining: u64,
    pub exit_price: u64,
    pub timestamp: i64,
    // Settlement details
    pub collateral_remaining: u64,
    pub fee_to_treasury: u64,
    pub fee_to_blp: u64,
    pub pnl: i128,
    pub funding_accumulated: i128,
    pub escrow_to_treasury: u64,
    pub escrow_to_pool: u64,
    pub escrow_to_user: u64,
    pub pool_to_user: u64,
    pub user_total_payout: u64,
    pub base_fee: u64,
    pub rebalance_fee: u64,
    pub bad_debt_amount: u64,
    pub collateral_released: u64,
}

#[event]
#[derive(Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct PositionLiquidatedEvent {
    pub owner: Pubkey,
    pub position_id: u64,
    pub baskt_id: Pubkey,
    pub size_liquidated: u64,
    pub size_remaining: u64,
    pub exit_price: u64,
    pub timestamp: i64,
    // Settlement details
    pub fee_to_treasury: u64,
    pub fee_to_blp: u64,
    pub collateral_remaining: u64,
    pub pnl: i128,
    pub funding_accumulated: i128,
    pub escrow_to_treasury: u64,
    pub escrow_to_pool: u64,
    pub escrow_to_user: u64,
    pub pool_to_user: u64,
    pub user_total_payout: u64,
    pub base_fee: u64,
    pub rebalance_fee: u64,
    pub bad_debt_amount: u64,
    pub collateral_released: u64,
}

#[event]
#[derive(Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct PositionForceClosed {
    pub baskt: Pubkey,
    pub position: Pubkey,
    pub owner: Pubkey,
    pub close_price: u64,
    pub size_closed: u64,
    pub size_remaining: u64,
    pub timestamp: i64,
    // Settlement details
    pub fee_to_treasury: u64,
    pub fee_to_blp: u64,
    pub collateral_remaining: u64,
    pub pnl: i128,
    pub funding_accumulated: i128,
    pub escrow_to_treasury: u64,
    pub escrow_to_pool: u64,
    pub escrow_to_user: u64,
    pub pool_to_user: u64,
    pub user_total_payout: u64,
    pub base_fee: u64,
    pub rebalance_fee: u64,
    pub bad_debt_amount: u64,
    pub collateral_released: u64,
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

//----------------------------------------------------------------------------
// BASKT EVENTS
//----------------------------------------------------------------------------

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktCreatedEvent {
    pub baskt_creation_fee: u64,
    pub uid: u32,
    pub baskt_id: Pubkey,
    pub creator: Pubkey,
    pub is_public: bool,
    pub asset_count: u8,
    pub timestamp: i64,
    pub baskt_rebalance_period: u64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktActivatedEvent {
    pub baskt_id: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktRebalancedEvent {
    pub baskt_id: Pubkey,
    pub rebalance_index: u64,
    pub new_nav: u64,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktDecommissioningInitiated {
    pub baskt: Pubkey,
    pub initiated_at: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktClosed {
    pub baskt: Pubkey,
    pub closed_at: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct BasktConfigUpdatedEvent {
    pub baskt: Pubkey,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct RebalanceRequestEvent {
    pub rebalance_request_fee: u64,
    pub baskt_id: Pubkey,
    pub creator: Pubkey,
    pub timestamp: i64,
}

//----------------------------------------------------------------------------
// FUNDING EVENTS
//----------------------------------------------------------------------------

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct FundingIndexUpdatedEvent {
    pub baskt_id: Pubkey,
    pub cumulative_index: i128,
    pub current_rate: i64,
    pub timestamp: i64,
}

//----------------------------------------------------------------------------
// LIQUIDITY POOL EVENTS
//----------------------------------------------------------------------------

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct LiquidityPoolInitializedEvent {
    pub liquidity_pool: Pubkey,
    pub lp_mint: Pubkey,
    pub usdc_vault: Pubkey,
    pub deposit_fee_bps: u16,
    pub withdrawal_fee_bps: u16,
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
pub struct WithdrawalQueuedEvent {
    pub provider: Pubkey,
    pub request_id: u64,
    pub lp_tokens_burned: u64,
    pub withdrawal_amount: u64,
    pub queue_position: u64,
    pub timestamp: i64,
}

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct WithdrawQueueProcessedEvent {
    pub provider: Pubkey,
    pub lp_tokens_burned: u64,
    pub amount_paid_to_user: u64,
    pub fees_collected: u64,
    pub queue_tail_updated: u64,
}

//----------------------------------------------------------------------------
// PROTOCOL EVENTS
//----------------------------------------------------------------------------

#[event]
#[derive(Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct ProtocolStateUpdatedEvent {
    pub protocol: Pubkey,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}
