use crate::{
    constants::Constants,
    error::PerpetualsError,
    math,
    state::liquidity::{DepositEntry, LPDepositAccount, LiquidityPool},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct DepositLiquidity<'info> {
    #[account(mut)]
    pub lp: Signer<'info>,

    #[account(mut)]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    #[account(
        init_if_needed,
        payer = lp,
        space = LPDepositAccount::LEN,
        seeds = [b"lp_deposit", lp.key().as_ref()],
        bump
    )]
    pub lp_deposit: Account<'info, LPDepositAccount>,

    pub system_program: Program<'info, System>,
}

pub fn deposit_liquidity(ctx: Context<DepositLiquidity>, amount: u64) -> Result<()> {
    let liquidity_pool = &mut ctx.accounts.liquidity_pool;
    let lp_deposit = &mut ctx.accounts.lp_deposit;
    let lp = &ctx.accounts.lp;
    let clock = Clock::get()?;

    // Validate deposit amount
    if amount == 0 {
        return Err(PerpetualsError::InvalidLpTokenAmount.into());
    }

    // Calculate LP tokens to mint
    let lp_tokens = if liquidity_pool.lp_token_supply == 0 {
        // First deposit, 1:1 ratio
        amount
    } else {
        // Calculate proportional LP tokens
        let lp_tokens = (amount as u128)
            .checked_mul(liquidity_pool.lp_token_supply as u128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(liquidity_pool.total_usdc as u128)
            .ok_or(PerpetualsError::MathOverflow)? as u64;

        lp_tokens
    };

    // Update liquidity pool
    liquidity_pool.total_usdc = math::checked_add(liquidity_pool.total_usdc, amount)?;
    liquidity_pool.lp_token_supply = math::checked_add(liquidity_pool.lp_token_supply, lp_tokens)?;
    liquidity_pool.last_update_time = clock.unix_timestamp;

    // Initialize LP deposit account if new
    if lp_deposit.owner == Pubkey::default() {
        lp_deposit.initialize(lp.key())?;
    }

    // Create deposit entry
    let deposit_entry = DepositEntry {
        deposited_usdc: amount,
        lp_tokens,
        total_usdc_in_pool: liquidity_pool.total_usdc,
        lp_token_supply: liquidity_pool.lp_token_supply,
        timestamp: clock.unix_timestamp,
    };

    // Add deposit entry to LP's account
    lp_deposit.deposits.push(deposit_entry);

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawLiquidity<'info> {
    #[account(mut)]
    pub lp: Signer<'info>,

    #[account(mut)]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    #[account(
        mut,
        seeds = [b"lp_deposit", lp.key().as_ref()],
        bump,
        constraint = lp_deposit.owner == lp.key() @ PerpetualsError::Unauthorized,
    )]
    pub lp_deposit: Account<'info, LPDepositAccount>,
}

pub fn withdraw_liquidity(ctx: Context<WithdrawLiquidity>, lp_tokens: u64) -> Result<()> {
    let liquidity_pool = &mut ctx.accounts.liquidity_pool;
    let lp_deposit = &mut ctx.accounts.lp_deposit;
    let clock = Clock::get()?;

    // Validate LP token amount
    if lp_tokens == 0 || lp_tokens > liquidity_pool.lp_token_supply {
        return Err(PerpetualsError::InvalidLpTokenAmount.into());
    }

    // Calculate total LP tokens owned by this LP
    let mut total_lp_tokens: u64 = 0;
    for deposit in &lp_deposit.deposits {
        total_lp_tokens = math::checked_add(total_lp_tokens, deposit.lp_tokens)?;
    }

    // Verify LP has enough tokens
    if lp_tokens > total_lp_tokens {
        return Err(PerpetualsError::InvalidLpTokenAmount.into());
    }

    // Calculate USDC to withdraw
    let usdc_to_withdraw = (lp_tokens as u128)
        .checked_mul(liquidity_pool.total_usdc as u128)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_div(liquidity_pool.lp_token_supply as u128)
        .ok_or(PerpetualsError::MathOverflow)? as u64;

    // Ensure there's enough liquidity after accounting for open interest
    let min_liquidity = math::checked_add(Constants::MIN_LIQUIDITY, liquidity_pool.open_interest)?;
    if liquidity_pool
        .total_usdc
        .checked_sub(usdc_to_withdraw)
        .ok_or(PerpetualsError::MathOverflow)?
        < min_liquidity
    {
        return Err(PerpetualsError::InsufficientLiquidity.into());
    }

    // Update liquidity pool
    liquidity_pool.total_usdc = math::checked_sub(liquidity_pool.total_usdc, usdc_to_withdraw)?;
    liquidity_pool.lp_token_supply = math::checked_sub(liquidity_pool.lp_token_supply, lp_tokens)?;
    liquidity_pool.last_update_time = clock.unix_timestamp;

    // Update LP deposit account
    // We need to remove LP tokens from the deposits, starting from the oldest
    let mut remaining_to_remove = lp_tokens;
    for deposit in &mut lp_deposit.deposits {
        if remaining_to_remove == 0 {
            break;
        }

        if deposit.lp_tokens <= remaining_to_remove {
            // Remove all tokens from this deposit
            remaining_to_remove = math::checked_sub(remaining_to_remove, deposit.lp_tokens)?;
            deposit.lp_tokens = 0;
        } else {
            // Remove partial tokens from this deposit
            deposit.lp_tokens = math::checked_sub(deposit.lp_tokens, remaining_to_remove)?;
            remaining_to_remove = 0;
        }
    }

    // Filter out any deposits with 0 LP tokens
    lp_deposit.deposits.retain(|deposit| deposit.lp_tokens > 0);

    Ok(())
}
