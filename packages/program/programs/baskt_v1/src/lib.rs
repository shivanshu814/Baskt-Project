use crate::state::baskt::AssetConfig;
use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod math;
pub mod state;
pub mod utils;

declare_id!("GK52S4WZPVEAMAgjRf8XsBd7upmG862AjMF89HavDpkm");

use instructions::*;

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

    pub fn activate_baskt(ctx: Context<ActivateBaskt>, prices: Vec<u64>) -> Result<()> {
        instructions::baskt::activate_baskt(ctx, prices)
    }

    pub fn add_asset(ctx: Context<AddAsset>, params: AddAssetParams) -> Result<()> {
        instructions::asset::add_asset(ctx, params)
    }

    pub fn rebalance(ctx: Context<Rebalance>, asset_configs: Vec<AssetConfig>) -> Result<()> {
        instructions::rebalance::rebalance(ctx, asset_configs)
    }

    // Oracle Management
    pub fn initialize_custom_oracle(
        ctx: Context<InitializeCustomOracle>,
        params: CustomOracleInstructionParams,
    ) -> Result<()> {
        instructions::oracle::initialize_custom_oracle(ctx, params)
    }

    pub fn update_custom_oracle(
        ctx: Context<UpdateCustomOracle>,
        params: CustomOracleUpdateInstructionParams,
    ) -> Result<()> {
        instructions::oracle::update_custom_oracle(ctx, params)
    }
}
