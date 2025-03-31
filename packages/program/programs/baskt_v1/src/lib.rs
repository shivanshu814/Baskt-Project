use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod math;
pub mod state;
pub mod utils;

declare_id!("GK52S4WZPVEAMAgjRf8XsBd7upmG862AjMF89HavDpkm");

use instructions::*;
use crate::state::baskt::AssetParams;

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
        allow_add_liquidity: bool,
        allow_remove_liquidity: bool,
        allow_open_position: bool,
        allow_close_position: bool,
        allow_pnl_withdrawal: bool,
        allow_collateral_withdrawal: bool,
        allow_baskt_creation: bool,
        allow_baskt_update: bool,
        allow_trading: bool,
        allow_liquidations: bool,
    ) -> Result<()> {
        instructions::protocol::update_feature_flags(
            ctx,
            allow_add_liquidity,
            allow_remove_liquidity,
            allow_open_position,
            allow_close_position,
            allow_pnl_withdrawal,
            allow_collateral_withdrawal,
            allow_baskt_creation,
            allow_baskt_update,
            allow_trading,
            allow_liquidations,
        )
    }

    // Baskt Management
    pub fn create_baskt(ctx: Context<CreateBaskt>, params: CreateBasktParams) -> Result<()> {
        instructions::baskt::create_baskt(ctx, params)
    }

    pub fn add_asset(ctx: Context<AddAsset>, params: AddAssetParams) -> Result<()> {
        instructions::asset::add_asset(ctx, params)
    }

    pub fn rebalance(ctx: Context<Rebalance>, asset_params: Vec<AssetParams>) -> Result<()> {
        instructions::rebalance::rebalance(ctx, asset_params)
    }

    // Position Management
    pub fn open_position(
        ctx: Context<OpenPosition>,
        baskt_id: Pubkey,
        size: u64,
        collateral: u64,
        is_long: bool,
    ) -> Result<()> {
        instructions::position::open_position(ctx, baskt_id, size, collateral, is_long)
    }

    pub fn close_position(ctx: Context<ClosePosition>) -> Result<()> {
        instructions::position::close_position(ctx)
    }

    pub fn liquidate_position(ctx: Context<LiquidatePosition>) -> Result<()> {
        instructions::position::liquidate_position(ctx)
    }

    // Liquidity Management
    pub fn deposit_liquidity(ctx: Context<DepositLiquidity>, amount: u64) -> Result<()> {
        instructions::liquidity::deposit_liquidity(ctx, amount)
    }

    pub fn withdraw_liquidity(ctx: Context<WithdrawLiquidity>, lp_tokens: u64) -> Result<()> {
        instructions::liquidity::withdraw_liquidity(ctx, lp_tokens)
    }

    // Oracle Management (for testing)
    pub fn initialize_custom_oracle(
        ctx: Context<InitializeCustomOracle>,
        params: CustomOracleInstructionParams,
    ) -> Result<()> {
        instructions::oracle::initialize_custom_oracle(ctx, params)
    }

    pub fn update_custom_oracle(
        ctx: Context<UpdateCustomOracle>,
        params: CustomOracleInstructionParams,
    ) -> Result<()> {
        instructions::oracle::update_custom_oracle(ctx, params)
    }

    // View functions (read-only)
    pub fn get_asset_price(ctx: Context<GetAssetPrice>) -> Result<u64> {
        instructions::view::get_asset_price(ctx)
    }

    pub fn get_baskt_nav(ctx: Context<GetBasktNav>) -> Result<u64> {
        instructions::view::get_baskt_nav(ctx)
    }
}
