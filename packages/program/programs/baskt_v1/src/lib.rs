use crate::state::baskt::AssetConfig;
use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod math;
pub mod state;
pub mod utils;

declare_id!("8JaW8fhu46ii83WapMp64i4B4bKTM76XUSXftJfHfLyg");

use crate::instructions::baskt_all::baskt_config::{
    SetBasktClosingFeeBps, SetBasktLiquidationFeeBps, SetBasktLiquidationThresholdBps,
    SetBasktMinCollateralRatioBps, SetBasktOpeningFeeBps, UpdateBasktConfig,
    UpdateBasktConfigParams,
};
use crate::instructions::baskt_all::lifecycle::ActivateBasktParams;
use crate::instructions::config::{SetFundingCutBps, SetTreasuryCutBps};
use crate::instructions::protocol::UpdateFeatureFlagsParams;
use crate::state::order::OrderAction;
use instructions::*;
// Import position instruction structs and params
use crate::instructions::config::{
    SetClosingFeeBps, SetLiquidationFeeBps, SetLiquidationPriceDeviationBps,
    SetLiquidationThresholdBps, SetMaxPriceAgeSec, SetMaxPriceDeviationBps,
    SetMinCollateralRatioBps, SetMinLiquidity, SetOpeningFeeBps, UpdateTreasury,
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

    pub fn set_max_price_age_sec(
        ctx: Context<SetMaxPriceAgeSec>,
        new_max_price_age_sec: u32,
    ) -> Result<()> {
        instructions::config::set_max_price_age_sec(ctx, new_max_price_age_sec)
    }

    pub fn set_max_price_deviation_bps(
        ctx: Context<SetMaxPriceDeviationBps>,
        new_max_price_deviation_bps: u64,
    ) -> Result<()> {
        instructions::config::set_max_price_deviation_bps(ctx, new_max_price_deviation_bps)
    }

    pub fn set_liquidation_price_deviation_bps(
        ctx: Context<SetLiquidationPriceDeviationBps>,
        new_liquidation_price_deviation_bps: u64,
    ) -> Result<()> {
        instructions::config::set_liquidation_price_deviation_bps(
            ctx,
            new_liquidation_price_deviation_bps,
        )
    }

    pub fn set_min_liquidity(ctx: Context<SetMinLiquidity>, new_min_liquidity: u64) -> Result<()> {
        instructions::config::set_min_liquidity(ctx, new_min_liquidity)
    }

    pub fn set_decommission_grace_period(
        ctx: Context<SetDecommissionGracePeriod>,
        new_grace_period: i64,
    ) -> Result<()> {
        instructions::config::set_decommission_grace_period(ctx, new_grace_period)
    }

    // Baskt Management
    pub fn create_baskt(ctx: Context<CreateBaskt>, params: CreateBasktParams) -> Result<()> {
        instructions::baskt_all::lifecycle::create_baskt(ctx, params)
    }

    pub fn activate_baskt(ctx: Context<ActivateBaskt>, params: ActivateBasktParams) -> Result<()> {
        instructions::baskt_all::lifecycle::activate_baskt(ctx, params)
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
        instructions::baskt_all::lifecycle::decommission_baskt(ctx)
    }

    pub fn settle_baskt(ctx: Context<SettleBaskt>) -> Result<()> {
        instructions::baskt_all::lifecycle::settle_baskt(ctx)
    }

    pub fn force_close_position<'info>(
        ctx: Context<'_, '_, 'info, 'info, ForceClosePosition<'info>>,
        params: ForceClosePositionParams,
    ) -> Result<()> {
        instructions::position::force_close::force_close_position(ctx, params)
    }

    pub fn close_baskt(ctx: Context<CloseBaskt>) -> Result<()> {
        instructions::baskt_all::lifecycle::close_baskt(ctx)
    }

    pub fn add_asset(ctx: Context<AddAsset>, params: AddAssetParams) -> Result<()> {
        instructions::asset::add_asset(ctx, params)
    }

    pub fn rebalance(ctx: Context<Rebalance>, asset_configs: Vec<AssetConfig>) -> Result<()> {
        instructions::baskt_all::rebalance::rebalance(ctx, asset_configs)
    }

    pub fn update_custom_oracle(ctx: Context<UpdateCustomOracle>, price: u64) -> Result<()> {
        instructions::baskt_all::oracle::update_custom_oracle(ctx, price)
    }

    pub fn create_order(
        ctx: Context<CreateOrder>,
        order_id: u64,
        size: u64,
        collateral: u64,
        is_long: bool,
        action: OrderAction,
        target_position: Option<Pubkey>,
        limit_price: u64,
        max_slippage_bps: u64,
        leverage_bps: u64,
        order_type: crate::state::order::OrderType,
    ) -> Result<()> {
        instructions::order::create_order(
            ctx,
            order_id,
            size,
            collateral,
            is_long,
            action,
            target_position,
            limit_price,
            max_slippage_bps,
            leverage_bps,
            order_type,
        )
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
        min_deposit: u64,
    ) -> Result<()> {
        instructions::liquidity::initialize_liquidity_pool(
            ctx,
            deposit_fee_bps,
            withdrawal_fee_bps,
            min_deposit,
        )
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
    pub fn initialize_funding_index(ctx: Context<InitializeFundingIndex>) -> Result<()> {
        instructions::baskt_all::funding_index::initialize_funding_index(ctx)
    }

    pub fn update_funding_index(ctx: Context<UpdateFundingIndex>, new_rate: i64) -> Result<()> {
        instructions::baskt_all::funding_index::update_funding_index(ctx, new_rate)
    }
}
