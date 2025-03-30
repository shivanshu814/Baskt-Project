use crate::{
    constants::Constants,
    error::PerpetualsError,
    state::{
        asset::SyntheticAsset,
        baskt::Baskt,
        liquidity::LiquidityPool,
        oracle::OraclePrice,
        position::{Position, PositionStatus},
    },
    utils::Utils,
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct OpenPosition<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    #[account(init, payer = trader, space = Position::INIT_SPACE)]
    pub position: Account<'info, Position>,

    #[account(mut)]
    pub baskt: Account<'info, Baskt>,

    #[account(mut)]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    #[account(mut)]
    pub asset: Account<'info, SyntheticAsset>,

    /// CHECK: Oracle account is validated in the instruction
    pub oracle: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn open_position(
    ctx: Context<OpenPosition>,
    baskt_id: Pubkey,
    size: u64,
    collateral: u64,
    is_long: bool,
) -> Result<()> {
    let position = &mut ctx.accounts.position;
    let baskt = &mut ctx.accounts.baskt;
    let liquidity_pool = &mut ctx.accounts.liquidity_pool;
    let asset = &mut ctx.accounts.asset;
    let trader = &ctx.accounts.trader;
    let clock = Clock::get()?;

    // Validate baskt ID
    if baskt.baskt_id != baskt_id {
        return Err(PerpetualsError::InvalidBasktConfig.into());
    }

    // Validate position size
    if size == 0 {
        return Err(PerpetualsError::InvalidPositionSize.into());
    }

    // Validate collateral
    let min_collateral = (size as u128)
        .checked_mul(Constants::MIN_COLLATERAL_RATIO_BPS as u128)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_div(Constants::BPS_DIVISOR as u128)
        .ok_or(PerpetualsError::MathOverflow)? as u64;

    if collateral < min_collateral {
        return Err(PerpetualsError::InsufficientCollateral.into());
    }

    // Validate liquidity pool has enough funds
    if liquidity_pool.total_usdc < size {
        return Err(PerpetualsError::InsufficientLiquidity.into());
    }

    // Calculate opening fee
    let opening_fee =
        Utils::calculate_fee(size, Constants::OPENING_FEE_BPS, Constants::BPS_DIVISOR)?;

    // Initialize the position
    position.owner = trader.key();
    position.baskt_id = baskt_id;
    position.size = size;
    position.collateral = collateral;
    position.is_long = is_long;
    // Get price from oracle
    let oracle_params = asset.oracle;

    let oracle_price = OraclePrice::new_from_oracle(
        &ctx.accounts.oracle,
        &oracle_params,
        clock.unix_timestamp,
        false, // Don't use EMA
    )?;

    position.entry_price = oracle_price.price;
    position.close_price = None;
    position.funding_accumulated = 0;
    position.status = PositionStatus::Open;
    position.opening_fee = opening_fee;
    position.closing_fee = 0;
    position.borrowing_fee = 0;
    position.pnl = 0;
    position.timestamp = clock.unix_timestamp;
    position.funding_fee = 0;
    position.liquidation_fee = 0;

    // Update baskt
    baskt.total_positions += 1;
    baskt.total_volume += size;
    baskt.total_fees += opening_fee;

    // Update liquidity pool
    liquidity_pool.open_interest += size;
    liquidity_pool.opening_fees += opening_fee;

    // Update asset
    if is_long {
        asset.open_interest_long += size;
    } else {
        asset.open_interest_short += size;
    }
    asset.fees_stats.open_position_usd += opening_fee;

    // Update funding rate
    let funding_rate = Utils::calculate_funding_rate(
        asset.open_interest_long,
        asset.open_interest_short,
        Constants::FUNDING_RATE_MAX_BPS,
        Constants::BPS_DIVISOR,
    )?;

    asset.funding_rate = funding_rate;
    asset.last_funding_update = clock.unix_timestamp;

    Ok(())
}

#[derive(Accounts)]
pub struct ClosePosition<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    #[account(
        mut,
        constraint = position.owner == trader.key() @ PerpetualsError::Unauthorized,
        constraint = position.status == PositionStatus::Open @ PerpetualsError::PositionAlreadyClosed,
    )]
    pub position: Account<'info, Position>,

    #[account(mut)]
    pub baskt: Account<'info, Baskt>,

    #[account(mut)]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    #[account(mut)]
    pub asset: Account<'info, SyntheticAsset>,

    /// CHECK: Oracle account is validated in the instruction
    pub oracle: AccountInfo<'info>,
}

pub fn close_position(ctx: Context<ClosePosition>) -> Result<()> {
    let position = &mut ctx.accounts.position;
    let baskt = &mut ctx.accounts.baskt;
    let liquidity_pool = &mut ctx.accounts.liquidity_pool;
    let asset = &mut ctx.accounts.asset;
    let clock = Clock::get()?;

    // Calculate closing fee
    let closing_fee = Utils::calculate_fee(
        position.size,
        Constants::CLOSING_FEE_BPS,
        Constants::BPS_DIVISOR,
    )?;

    // Get price from oracle
    let oracle_params = asset.oracle;

    let oracle_price = OraclePrice::new_from_oracle(
        &ctx.accounts.oracle,
        &oracle_params,
        clock.unix_timestamp,
        false, // Don't use EMA
    )?;

    // Calculate PnL
    let pnl = Utils::calculate_pnl(
        position.entry_price,
        oracle_price.price,
        position.size,
        position.is_long,
        Constants::PRICE_PRECISION,
    )?;

    // Update position
    position.close_price = Some(oracle_price.price);
    position.status = PositionStatus::Closed;
    position.closing_fee = closing_fee;
    position.pnl = pnl;

    // Update baskt
    baskt.total_fees += closing_fee;

    // Update liquidity pool
    liquidity_pool.open_interest -= position.size;
    liquidity_pool.closing_fees += closing_fee;

    // Update asset
    if position.is_long {
        asset.open_interest_long -= position.size;
    } else {
        asset.open_interest_short -= position.size;
    }
    asset.fees_stats.close_position_usd += closing_fee;

    // Update funding rate
    let funding_rate = Utils::calculate_funding_rate(
        asset.open_interest_long,
        asset.open_interest_short,
        Constants::FUNDING_RATE_MAX_BPS,
        Constants::BPS_DIVISOR,
    )?;

    asset.funding_rate = funding_rate;
    asset.last_funding_update = clock.unix_timestamp;

    Ok(())
}

#[derive(Accounts)]
pub struct LiquidatePosition<'info> {
    #[account(mut)]
    pub liquidator: Signer<'info>,

    #[account(
        mut,
        constraint = position.status == PositionStatus::Open @ PerpetualsError::PositionAlreadyClosed,
    )]
    pub position: Account<'info, Position>,

    #[account(mut)]
    pub baskt: Account<'info, Baskt>,

    #[account(mut)]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    #[account(mut)]
    pub asset: Account<'info, SyntheticAsset>,

    /// CHECK: Oracle account is validated in the instruction
    pub oracle: AccountInfo<'info>,
}

pub fn liquidate_position(ctx: Context<LiquidatePosition>) -> Result<()> {
    let position = &mut ctx.accounts.position;
    let baskt = &mut ctx.accounts.baskt;
    let liquidity_pool = &mut ctx.accounts.liquidity_pool;
    let asset = &mut ctx.accounts.asset;
    let clock = Clock::get()?;

    // Get price from oracle
    let oracle_params = asset.oracle;

    let oracle_price = OraclePrice::new_from_oracle(
        &ctx.accounts.oracle,
        &oracle_params,
        clock.unix_timestamp,
        false, // Don't use EMA
    )?;

    // Check if position is liquidatable
    let is_liquidatable = Utils::is_liquidatable(
        position.size,
        position.collateral,
        position.entry_price,
        oracle_price.price,
        position.is_long,
        Constants::LIQUIDATION_THRESHOLD_BPS,
        Constants::BPS_DIVISOR,
    )?;

    if !is_liquidatable {
        return Err(PerpetualsError::PositionNotLiquidatable.into());
    }

    // Calculate liquidation fee
    let liquidation_fee = Utils::calculate_fee(
        position.size,
        Constants::LIQUIDATION_FEE_BPS,
        Constants::BPS_DIVISOR,
    )?;

    // Calculate PnL (will be negative in liquidation scenario)
    let pnl = Utils::calculate_pnl(
        position.entry_price,
        oracle_price.price,
        position.size,
        position.is_long,
        Constants::PRICE_PRECISION,
    )?;

    // Update position
    position.close_price = Some(oracle_price.price);
    position.status = PositionStatus::Liquidated;
    position.liquidation_fee = liquidation_fee;
    position.pnl = pnl;

    // Update baskt
    baskt.total_fees += liquidation_fee;

    // Update liquidity pool
    liquidity_pool.open_interest -= position.size;
    liquidity_pool.liquidation_fees += liquidation_fee;

    // Update asset
    if position.is_long {
        asset.open_interest_long -= position.size;
    } else {
        asset.open_interest_short -= position.size;
    }
    asset.fees_stats.liquidation_usd += liquidation_fee;

    // Update funding rate
    let funding_rate = Utils::calculate_funding_rate(
        asset.open_interest_long,
        asset.open_interest_short,
        Constants::FUNDING_RATE_MAX_BPS,
        Constants::BPS_DIVISOR,
    )?;

    asset.funding_rate = funding_rate;
    asset.last_funding_update = clock.unix_timestamp;

    Ok(())
}
