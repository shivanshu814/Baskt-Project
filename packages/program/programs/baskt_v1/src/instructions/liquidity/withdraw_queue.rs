use crate::constants::*;
use crate::error::PerpetualsError;
use crate::events::*;
use crate::state::{
    liquidity::LiquidityPool, protocol::Protocol, withdraw_request::WithdrawRequest,
};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

// =============================================================================
// Withdrawal Queue Management System
// =============================================================================

/// Parameters for withdrawal request creation
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RequestWithdrawParams {
    pub lp_amount: u64,
}

// -----------------------------------------------------------------------------
// QueueWithdrawLiquidity - Simple queue-only withdrawal requests
// -----------------------------------------------------------------------------
#[derive(Accounts)]
#[instruction(params: RequestWithdrawParams)]
pub struct QueueWithdrawLiquidity<'info> {
    /// The liquidity provider requesting withdrawal
    #[account(mut)]
    pub provider: Signer<'info>,

    /// Liquidity pool state account
    #[account(
        mut,
        seeds = [LIQUIDITY_POOL_SEED],
        bump = liquidity_pool.bump,
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    /// Protocol state for feature flags validation
    #[account(
        seeds = [PROTOCOL_SEED],
        bump,
        constraint = protocol.feature_flags.allow_remove_liquidity @ PerpetualsError::LiquidityOperationsDisabled
    )]
    pub protocol: Account<'info, Protocol>,

    /// Provider's LP token account (source for burn)
    #[account(
        mut,
        constraint = provider_lp_account.owner == provider.key() @ PerpetualsError::Unauthorized,
        constraint = provider_lp_account.mint == liquidity_pool.lp_mint @ PerpetualsError::InvalidMint,
        constraint = provider_lp_account.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = provider_lp_account.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub provider_lp_account: Account<'info, TokenAccount>,

    /// USDC account
    #[account(
        constraint = provider_usdc_account.owner == provider.key() @ PerpetualsError::Unauthorized,
        constraint = provider_usdc_account.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = provider_usdc_account.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority,
        constraint = provider_usdc_account.mint == protocol.collateral_mint @ PerpetualsError::InvalidMint,
    )]
    pub provider_usdc_account: Account<'info, TokenAccount>,

    /// LP token escrow account where LP tokens are held during withdrawal queue processing
    #[account(
        mut,
        constraint = lp_token_escrow.key() == liquidity_pool.lp_token_escrow @ PerpetualsError::InvalidLpTokenEscrow,
        constraint = lp_token_escrow.owner == pool_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = lp_token_escrow.mint == liquidity_pool.lp_mint @ PerpetualsError::InvalidMint,
        constraint = lp_token_escrow.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = lp_token_escrow.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority,
        seeds = [LP_ESCROW_SEED, liquidity_pool.key().as_ref()],
        bump
    )]
    pub lp_token_escrow: Account<'info, TokenAccount>,

    /// Withdrawal request PDA
    #[account(
        init,
        payer = provider,
        space = WithdrawRequest::DISCRIMINATOR.len() + WithdrawRequest::INIT_SPACE,
        seeds = [
            WithdrawRequest::SEED_PREFIX,
            liquidity_pool.key().as_ref(),
            &(liquidity_pool.withdraw_queue_head + 1).to_le_bytes()
        ],
        bump
    )]
    pub withdraw_request: Account<'info, WithdrawRequest>,

    /// LP token mint for burning
    #[account(
        mut,
        constraint = lp_mint.key() == liquidity_pool.lp_mint @ PerpetualsError::InvalidMint
    )]
    pub lp_mint: Account<'info, anchor_spl::token::Mint>,

    /// CHECK: pool authority PDA
    #[account(
        seeds = [POOL_AUTHORITY_SEED, liquidity_pool.key().as_ref(), protocol.key().as_ref()],
        bump
    )]
    pub pool_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Simplified queue-only withdrawal request processing
pub fn queue_withdraw_liquidity(
    ctx: Context<QueueWithdrawLiquidity>,
    params: RequestWithdrawParams,
) -> Result<()> {
    require!(params.lp_amount > 0, PerpetualsError::InvalidLpTokenAmount);
    // Guard: provider must have enough LP tokens
    require!(
        ctx.accounts.provider_lp_account.amount >= params.lp_amount,
        PerpetualsError::InsufficientFunds
    );

    let clock = Clock::get()?;
    let now_ts = clock.unix_timestamp;
    let pool = &mut ctx.accounts.liquidity_pool;


    // Transfer LP tokens to escrow (committed action)
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.provider_lp_account.to_account_info(),
                to: ctx.accounts.lp_token_escrow.to_account_info(),
                authority: ctx.accounts.provider.to_account_info(),
            },
        ),
        params.lp_amount,
    )?;

    // Add LP tokens to pending queue
    pool.pending_lp_tokens = pool
        .pending_lp_tokens
        .checked_add(params.lp_amount)
        .ok_or(PerpetualsError::MathOverflow)?;

    // Generate next queue ID
    let request_id = pool.withdraw_queue_head.checked_add(1) 
        .ok_or(PerpetualsError::MathOverflow)?;

    // Initialize withdrawal request PDA (only LP amount stored)
    let withdraw_request = &mut ctx.accounts.withdraw_request;
    withdraw_request.id = request_id;
    withdraw_request.provider = ctx.accounts.provider.key();
    withdraw_request.provider_usdc_account = ctx.accounts.provider_usdc_account.key();
    withdraw_request.remaining_lp = params.lp_amount;
    withdraw_request.requested_ts = now_ts;
    withdraw_request.bump = ctx.bumps.withdraw_request;

    // Update queue head
    pool.withdraw_queue_head = request_id;

    let current_withdrawal_amount = pool.calculate_withdrawal_amount(params.lp_amount)?;

    emit!(WithdrawalQueuedEvent {
        provider: ctx.accounts.provider.key(),
        request_id,
        lp_tokens_burned: params.lp_amount,
        withdrawal_amount: current_withdrawal_amount,
        queue_position: request_id,
        timestamp: now_ts,
    });

    Ok(())
}
