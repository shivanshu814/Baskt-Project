#![allow(deprecated)]

use crate::state::baskt::AssetConfig;
use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod math;
pub mod state;
pub mod utils;

declare_id!("Bw6sN8LvQMqVhgZYihtkxoYqUZdPZe3vMWJ8N7ba6jLW");

use crate::instructions::baskt_all::baskt_config::{
    SetBasktClosingFeeBps, SetBasktLiquidationFeeBps, SetBasktLiquidationThresholdBps,
    SetBasktMinCollateralRatioBps, SetBasktOpeningFeeBps, UpdateBasktConfig,
    UpdateBasktConfigParams,
};
use crate::instructions::baskt_all::{
    create::{CreateBaskt, CreateBasktParams},
    activate::{ActivateBaskt, ActivateBasktParams},
    decomission::{DecommissionBaskt},
    close::{CloseBaskt},
    rebalance::{Rebalance},
    rebalance_request::{RebalanceRequest},
    funding_index::{UpdateFundingIndex},
};
use crate::instructions::config::{SetFundingCutBps, SetTreasuryCutBps};
use crate::instructions::protocol::UpdateFeatureFlagsParams;
use instructions::*;
// Import position instruction structs and params
use crate::instructions::config::{
    SetClosingFeeBps, SetLiquidationFeeBps, SetLiquidationThresholdBps, SetMinCollateralRatioBps,
    SetMinLiquidity, SetOpeningFeeBps, UpdateTreasury, SetRebalanceRequestFee, SetBasktCreationFee,
};
use crate::instructions::position::{
    add_collateral::{AddCollateral, AddCollateralParams},
    close::{ClosePosition, ClosePositionParams},
    force_close::{ForceClosePosition, ForceClosePositionParams},
    liquidate::{LiquidatePosition, LiquidatePositionParams},
    open::{OpenPosition, OpenPositionParams},
};

#[program]
pub mod baskt {
    use super::*;

    // Protocol Management
    pub fn initialize_protocol(ctx: Context<InitializeProtocol>, treasury: Pubkey) -> Result<()> {
        instructions::protocol::initialize_protocol(ctx, treasury)
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

    // Protocol Configuration Setters
    pub fn set_opening_fee_bps(
        ctx: Context<SetOpeningFeeBps>,
        new_opening_fee_bps: u64,
    ) -> Result<()> {
        instructions::config::set_opening_fee_bps(ctx, new_opening_fee_bps)
    }

    pub fn set_closing_fee_bps(
        ctx: Context<SetClosingFeeBps>,
        new_closing_fee_bps: u64,
    ) -> Result<()> {
        instructions::config::set_closing_fee_bps(ctx, new_closing_fee_bps)
    }

    pub fn set_liquidation_fee_bps(
        ctx: Context<SetLiquidationFeeBps>,
        new_liquidation_fee_bps: u64,
    ) -> Result<()> {
        instructions::config::set_liquidation_fee_bps(ctx, new_liquidation_fee_bps)
    }

    pub fn set_treasury_cut_bps(
        ctx: Context<SetTreasuryCutBps>,
        new_treasury_cut_bps: u64,
    ) -> Result<()> {
        instructions::config::set_treasury_cut_bps(ctx, new_treasury_cut_bps)
    }

    pub fn set_funding_cut_bps(
        ctx: Context<SetFundingCutBps>,
        new_funding_cut_bps: u64,
    ) -> Result<()> {
        instructions::config::set_funding_cut_bps(ctx, new_funding_cut_bps)
    }

    pub fn set_min_collateral_ratio_bps(
        ctx: Context<SetMinCollateralRatioBps>,
        new_min_collateral_ratio_bps: u64,
    ) -> Result<()> {
        instructions::config::set_min_collateral_ratio_bps(ctx, new_min_collateral_ratio_bps)
    }

    pub fn set_liquidation_threshold_bps(
        ctx: Context<SetLiquidationThresholdBps>,
        new_liquidation_threshold_bps: u64,
    ) -> Result<()> {
        instructions::config::set_liquidation_threshold_bps(ctx, new_liquidation_threshold_bps)
    }

    pub fn update_treasury(ctx: Context<UpdateTreasury>, new_treasury: Pubkey) -> Result<()> {
        instructions::config::update_treasury(ctx, new_treasury)
    }

    pub fn set_min_liquidity(ctx: Context<SetMinLiquidity>, new_min_liquidity: u64) -> Result<()> {
        instructions::config::set_min_liquidity(ctx, new_min_liquidity)
    }


    pub fn set_rebalance_request_fee(
        ctx: Context<SetRebalanceRequestFee>,
        new_fee_lamports: u64,
    ) -> Result<()> {
        instructions::config::set_rebalance_request_fee(ctx, new_fee_lamports)
    }

    pub fn set_baskt_creation_fee(
        ctx: Context<SetBasktCreationFee>,
        new_fee_lamports: u64,
    ) -> Result<()> {
        instructions::config::set_baskt_creation_fee(ctx, new_fee_lamports)
    }

    // Baskt Management
    pub fn create_baskt(ctx: Context<CreateBaskt>, params: CreateBasktParams) -> Result<()> {
        instructions::baskt_all::create::create_baskt(ctx, params)
    }

    pub fn activate_baskt(ctx: Context<ActivateBaskt>, params: ActivateBasktParams) -> Result<()> {
        instructions::baskt_all::activate::activate_baskt(ctx, params)
    }

    // Baskt Configuration
    pub fn set_baskt_opening_fee_bps(
        ctx: Context<SetBasktOpeningFeeBps>,
        new_opening_fee_bps: Option<u64>,
    ) -> Result<()> {
        instructions::baskt_all::baskt_config::set_baskt_opening_fee_bps(ctx, new_opening_fee_bps)
    }

    pub fn set_baskt_closing_fee_bps(
        ctx: Context<SetBasktClosingFeeBps>,
        new_closing_fee_bps: Option<u64>,
    ) -> Result<()> {
        instructions::baskt_all::baskt_config::set_baskt_closing_fee_bps(ctx, new_closing_fee_bps)
    }

    pub fn set_baskt_liquidation_fee_bps(
        ctx: Context<SetBasktLiquidationFeeBps>,
        new_liquidation_fee_bps: Option<u64>,
    ) -> Result<()> {
        instructions::baskt_all::baskt_config::set_baskt_liquidation_fee_bps(
            ctx,
            new_liquidation_fee_bps,
        )
    }

    pub fn set_baskt_min_collateral_ratio_bps(
        ctx: Context<SetBasktMinCollateralRatioBps>,
        new_min_collateral_ratio_bps: Option<u64>,
    ) -> Result<()> {
        instructions::baskt_all::baskt_config::set_baskt_min_collateral_ratio_bps(
            ctx,
            new_min_collateral_ratio_bps,
        )
    }

    pub fn set_baskt_liquidation_threshold_bps(
        ctx: Context<SetBasktLiquidationThresholdBps>,
        new_liquidation_threshold_bps: Option<u64>,
    ) -> Result<()> {
        instructions::baskt_all::baskt_config::set_baskt_liquidation_threshold_bps(
            ctx,
            new_liquidation_threshold_bps,
        )
    }

    pub fn update_baskt_config(
        ctx: Context<UpdateBasktConfig>,
        params: UpdateBasktConfigParams,
    ) -> Result<()> {
        instructions::baskt_all::baskt_config::update_baskt_config(ctx, params)
    }

    // Baskt Lifecycle Management
    pub fn decommission_baskt(ctx: Context<DecommissionBaskt>) -> Result<()> {
        instructions::baskt_all::decomission::decommission_baskt(ctx)
    }

    pub fn force_close_position<'info>(
        ctx: Context<'_, '_, 'info, 'info, ForceClosePosition<'info>>,
        params: ForceClosePositionParams,
    ) -> Result<()> {
        instructions::position::force_close::force_close_position(ctx, params)
    }

    pub fn close_baskt(ctx: Context<CloseBaskt>) -> Result<()> {
        instructions::baskt_all::close::close_baskt(ctx)
    }

    pub fn add_asset(ctx: Context<AddAsset>, params: AddAssetParams) -> Result<()> {
        instructions::asset::add_asset(ctx, params)
    }

    pub fn rebalance(
        ctx: Context<Rebalance>,
        asset_configs: Vec<AssetConfig>,
        new_nav: u64,
        rebalance_fee_per_unit: Option<u64>,
    ) -> Result<()> {
        instructions::baskt_all::rebalance::rebalance(ctx, asset_configs, new_nav, rebalance_fee_per_unit)
    }

    pub fn rebalance_request(ctx: Context<RebalanceRequest>) -> Result<()> {
        instructions::baskt_all::rebalance_request::rebalance_request(ctx)
    }

    pub fn create_order(
        ctx: Context<CreateOrder>,
        params: instructions::order::create_order::CreateOrderParams,
    ) -> Result<()> {
        instructions::order::create_order(ctx, params)
    }

    pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
        instructions::order::cancel_order(ctx)
    }

    pub fn open_position<'info>(
        ctx: Context<'_, '_, 'info, 'info, OpenPosition<'info>>,
        params: OpenPositionParams,
    ) -> Result<()> {
        instructions::position::open::open_position(ctx, params)
    }

    pub fn add_collateral(ctx: Context<AddCollateral>, params: AddCollateralParams) -> Result<()> {
        instructions::position::add_collateral::add_collateral(ctx, params)
    }

    pub fn close_position<'info>(
        ctx: Context<'_, '_, 'info, 'info, ClosePosition<'info>>,
        params: ClosePositionParams,
    ) -> Result<()> {
        instructions::position::close::close_position(ctx, params)
    }

    pub fn liquidate_position<'info>(
        ctx: Context<'_, '_, 'info, 'info, LiquidatePosition<'info>>,
        params: LiquidatePositionParams,
    ) -> Result<()> {
        instructions::position::liquidate::liquidate_position(ctx, params)
    }

    // Liquidity Pool Management
    pub fn initialize_liquidity_pool(
        ctx: Context<InitializeLiquidityPool>,
        deposit_fee_bps: u16,
        withdrawal_fee_bps: u16,
    ) -> Result<()> {
        instructions::liquidity::initialize_liquidity_pool(ctx, deposit_fee_bps, withdrawal_fee_bps)
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount: u64,
        min_shares_out: u64,
    ) -> Result<()> {
        instructions::liquidity::add_liquidity(ctx, amount, min_shares_out)
    }

    pub fn update_funding_index(ctx: Context<UpdateFundingIndex>, new_rate: i64) -> Result<()> {
        instructions::baskt_all::funding_index::update_funding_index(ctx, new_rate)
    }

    // Withdrawal Queue Management
    pub fn queue_withdraw_liquidity(
        ctx: Context<QueueWithdrawLiquidity>,
        params: RequestWithdrawParams,
    ) -> Result<()> {
        instructions::liquidity::queue_withdraw_liquidity(ctx, params)
    }

    pub fn process_withdraw_queue<'info>(
        ctx: Context<'_, '_, '_, 'info, ProcessWithdrawQueue<'info>>,
    ) -> Result<()> {
        instructions::liquidity::process_withdraw_queue(ctx)
    }
}
