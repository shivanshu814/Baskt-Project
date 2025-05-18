use crate::state::baskt::AssetConfig;
use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod math;
pub mod state;
pub mod utils;
pub mod events;

declare_id!("GK52S4WZPVEAMAgjRf8XsBd7upmG862AjMF89HavDpkm");

use instructions::*;
use crate::state::order::OrderAction;
use crate::instructions::baskt::ActivateBasktParams;
use crate::instructions::position::{OpenPositionParams, AddCollateralParams, ClosePositionParams, LiquidatePositionParams};
use crate::instructions::protocol::UpdateFeatureFlagsParams;

#[program]
pub mod baskt_v1 {
    use super::*;

    // Protocol Management
    pub fn initialize_protocol(ctx: Context<InitializeProtocol>) -> Result<()> {
        instructions::protocol::initialize_protocol(ctx)
    }

    pub fn add_role(ctx: Context<AddRole>, role_type: u8) -> Result<()> {
        instructions::protocol::add_role(ctx, role_type)
    }

    pub fn remove_role(ctx: Context<RemoveRole>, role_type: u8) -> Result<()> {
        instructions::protocol::remove_role(ctx, role_type)
    }

    pub fn update_feature_flags(
        ctx: Context<UpdateFeatureFlags>,
        params: UpdateFeatureFlagsParams,
    ) -> Result<()> {
        instructions::protocol::update_feature_flags(ctx, params)
    }

    // Baskt Management
    pub fn create_baskt(ctx: Context<CreateBaskt>, params: CreateBasktParams) -> Result<()> {
        instructions::baskt::create_baskt(ctx, params)
    }

    pub fn activate_baskt(
        ctx: Context<ActivateBaskt>,
        params: ActivateBasktParams,
    ) -> Result<()> {
        instructions::baskt::activate_baskt(ctx, params)
    }

    pub fn add_asset(ctx: Context<AddAsset>, params: AddAssetParams) -> Result<()> {
        instructions::asset::add_asset(ctx, params)
    }

    pub fn rebalance(ctx: Context<Rebalance>, asset_configs: Vec<AssetConfig>) -> Result<()> {
        instructions::rebalance::rebalance(ctx, asset_configs)
    }

    pub fn update_custom_oracle(ctx: Context<UpdateCustomOracle>, price: u64) -> Result<()> {
        instructions::oracle::update_custom_oracle(ctx, price)
    }

    pub fn create_order(ctx: Context<CreateOrder>, order_id: u64, size: u64, collateral: u64, is_long: bool, action: OrderAction, target_position: Option<Pubkey>) -> Result<()> {
        instructions::order::create_order(ctx, order_id, size, collateral, is_long, action, target_position)
    }

    pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
        instructions::order::cancel_order(ctx)
    }

    pub fn open_position(ctx: Context<OpenPosition>, params: OpenPositionParams) -> Result<()> {
        instructions::position::open_position(ctx, params)
    }

    pub fn add_collateral(ctx: Context<AddCollateral>, params: AddCollateralParams) -> Result<()> {
        instructions::position::add_collateral(ctx, params)
    }

    pub fn close_position(ctx: Context<ClosePosition>, params: ClosePositionParams) -> Result<()> {
        instructions::position::close_position(ctx, params)
    }

    pub fn liquidate_position(ctx: Context<LiquidatePosition>, params: LiquidatePositionParams) -> Result<()> {
        instructions::position::liquidate_position(ctx, params)
    }

    // Liquidity Pool Management
    pub fn initialize_liquidity_pool(
        ctx: Context<InitializeLiquidityPool>,
        deposit_fee_bps: u16,
        withdrawal_fee_bps: u16,
        min_deposit: u64,
    ) -> Result<()> {
        instructions::liquidity::initialize_liquidity_pool(ctx, deposit_fee_bps, withdrawal_fee_bps, min_deposit)
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount: u64,
        min_shares_out: u64,
    ) -> Result<()> {
        instructions::liquidity::add_liquidity(ctx, amount, min_shares_out)
    }

    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        lp_amount: u64,
        min_tokens_out: u64,
    ) -> Result<()> {
        instructions::liquidity::remove_liquidity(ctx, lp_amount, min_tokens_out)
    }

    // Funding Index Management
    pub fn initialize_funding_index(
        ctx: Context<InitializeFundingIndex>,
    ) -> Result<()> {
        instructions::funding_index::initialize_funding_index(ctx)
    }

    pub fn update_funding_index(
        ctx: Context<UpdateFundingIndex>,
        new_rate: i64,
    ) -> Result<()> {
        instructions::funding_index::update_funding_index(ctx, new_rate)
    }
}
