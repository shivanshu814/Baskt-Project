use crate::constants::*;
use {
    crate::constants::{LIQUIDITY_POOL_SEED,  POOL_AUTHORITY_SEED, TOKEN_VAULT_SEED},
    crate::error::PerpetualsError,
    crate::events::*,
    crate::state::{
        liquidity::LiquidityPool,
        protocol::{Protocol},
    },
    anchor_lang::prelude::*,
    anchor_spl::token::{self,  Mint, MintTo, Token, TokenAccount, Transfer},
};

/// Add liquidity to the pool and receive LP tokens
#[derive(Accounts)]
#[instruction(amount: u64, min_shares_out: u64)]
pub struct AddLiquidity<'info> {
    /// The liquidity provider
    #[account(mut)]
    pub provider: Signer<'info>,

    /// The liquidity pool account
    #[account(
        mut,
        seeds = [LIQUIDITY_POOL_SEED],
        bump = liquidity_pool.bump,
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    /// Protocol account to verify feature flags
    #[account(
        seeds = [PROTOCOL_SEED],
        bump,
        constraint = protocol.feature_flags.allow_add_liquidity @ PerpetualsError::LiquidityOperationsDisabled
    )]
    pub protocol: Account<'info, Protocol>,

    /// The provider's token account to withdraw funds from
    #[account(
        mut,
        constraint = provider_usdc_account.owner == provider.key() @ PerpetualsError::Unauthorized,
        constraint = provider_usdc_account.mint == usdc_vault.mint @ PerpetualsError::InvalidMint,
        constraint = provider_usdc_account.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = provider_usdc_account.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub provider_usdc_account: Account<'info, TokenAccount>,

    /// The vault that holds the pool's assets
    #[account(
        mut,
        constraint = usdc_vault.key() == liquidity_pool.usdc_vault @ PerpetualsError::InvalidUsdcVault,
        constraint = usdc_vault.owner == pool_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = usdc_vault.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = usdc_vault.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority,
        seeds = [TOKEN_VAULT_SEED, liquidity_pool.key().as_ref()],
        bump
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    /// The provider's LP token account to receive LP tokens
    #[account(
        mut,
        constraint = provider_lp_account.owner == provider.key() @ PerpetualsError::Unauthorized,
        constraint = provider_lp_account.mint == lp_mint.key() @ PerpetualsError::InvalidMint,
        constraint = provider_lp_account.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = provider_lp_account.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub provider_lp_account: Account<'info, TokenAccount>,

    /// The LP token mint
    #[account(
        mut,
        constraint = lp_mint.key() == liquidity_pool.lp_mint @ PerpetualsError::InvalidMint,
        constraint = lp_mint.mint_authority.is_some() @ PerpetualsError::InvalidMint,
        constraint = lp_mint.mint_authority.unwrap() == pool_authority.key() @ PerpetualsError::InvalidMint,
        constraint = lp_mint.freeze_authority.is_none() @ PerpetualsError::InvalidMint
    )]
    pub lp_mint: Account<'info, Mint>,

    /// The treasury token account to receive fees
    #[account(
        mut,
        constraint = treasury_usdc_account.owner == treasury.key() @ PerpetualsError::InvalidTreasuryAccount,
        constraint = treasury_usdc_account.mint == usdc_vault.mint @ PerpetualsError::InvalidMint,
        constraint = treasury_usdc_account.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = treasury_usdc_account.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub treasury_usdc_account: Account<'info, TokenAccount>,

    /// CHECK: Treasury account that receives fees
    #[account(
        constraint = treasury.key() == protocol.treasury @ PerpetualsError::Unauthorized
    )]
    pub treasury: UncheckedAccount<'info>,

    /// CHECK: PDA used for pool operations authority
    #[account(
        seeds = [POOL_AUTHORITY_SEED, liquidity_pool.key().as_ref(), protocol.key().as_ref()],
        bump,
    )]
    pub pool_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}



/// Add liquidity to the pool
///
/// This function allows users to deposit tokens into the liquidity pool
/// in exchange for LP tokens representing their share of the pool.
///
/// The min_shares_out parameter is a safety check to ensure the user receives
/// at least the expected number of shares. This is not for slippage protection
/// in the traditional DEX sense (as this is a single-asset vault), but rather
/// to protect against unexpected state changes between tx submission and execution.
pub fn add_liquidity(ctx: Context<AddLiquidity>, amount: u64, min_shares_out: u64) -> Result<()> {

    require!(
        amount >= ctx.accounts.protocol.config.min_liquidity,
        PerpetualsError::InvalidDepositAmount
    );

    // Validate inputs
    let liquidity_pool = &ctx.accounts.liquidity_pool;

    let fee_amount = liquidity_pool.calculate_fee(amount, liquidity_pool.deposit_fee_bps)?;

    // Calculate shares to mint (after fee is taken)
    let net_deposit = amount
        .checked_sub(fee_amount)
        .ok_or(PerpetualsError::MathOverflow)?;

    let shares_to_mint = liquidity_pool.calculate_shares_to_mint(
        amount,
        fee_amount,
        ctx.accounts.protocol.config.min_liquidity,
    )?;

    // Ensure shares_to_mint is greater than zero
    require!(shares_to_mint > 0, PerpetualsError::InvalidLpTokenAmount);
  
    // Check minimum shares out safeguard
    require!(
        shares_to_mint >= min_shares_out,
        PerpetualsError::InvalidLpTokenAmount
    );

    // Transfer tokens from provider to vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.provider_usdc_account.to_account_info(),
                to: ctx.accounts.usdc_vault.to_account_info(),
                authority: ctx.accounts.provider.to_account_info(),
            },
        ),
        amount,
    )?;

    // Mint LP tokens to provider
    let liquidity_pool_key = ctx.accounts.liquidity_pool.key();
    let protocol_key = ctx.accounts.protocol.key();
    let authority_bump_bytes = [ctx.bumps.pool_authority];
    let signer_seeds = crate::utils::create_pool_authority_signer_seeds(
        &liquidity_pool_key,
        &protocol_key,
        &authority_bump_bytes,
    );
    let signer = &[&signer_seeds[..]];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.lp_mint.to_account_info(),
                to: ctx.accounts.provider_lp_account.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            signer,
        ),
        shares_to_mint,
    )?;

    // If there's a fee, transfer it from the vault to the treasury after state is updated
    if fee_amount > 0 {
        // Reuse the keys we already created
        let signer_seeds = [
            POOL_AUTHORITY_SEED,
            liquidity_pool_key.as_ref(),
            protocol_key.as_ref(),
            &[ctx.bumps.pool_authority],
        ];
        let signer = &[&signer_seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.usdc_vault.to_account_info(),
                    to: ctx.accounts.treasury_usdc_account.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
                signer,
            ),
            fee_amount,
        )?;
    }

    // Update liquidity pool state AFTER all external CPIs have completed
    let liquidity_pool = &mut ctx.accounts.liquidity_pool;

    liquidity_pool.total_liquidity = liquidity_pool
    .total_liquidity
    .checked_add(net_deposit)
    .ok_or(PerpetualsError::MathOverflow)?;

    liquidity_pool.total_shares = liquidity_pool
    .total_shares
    .checked_add(shares_to_mint)
    .ok_or(PerpetualsError::MathOverflow)?;

    let now = Clock::get()?.unix_timestamp;

    liquidity_pool.last_update_timestamp = now;

    // Emit event
    emit!(LiquidityAddedEvent {
        provider: ctx.accounts.provider.key(),
        liquidity_pool: liquidity_pool.key(),
        deposit_amount: amount,
        fee_amount,
        shares_minted: shares_to_mint,
        timestamp: now,
    });

    Ok(())
}
