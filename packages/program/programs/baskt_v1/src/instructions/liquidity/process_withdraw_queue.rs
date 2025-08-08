use crate::constants::*;
use crate::error::PerpetualsError;
use crate::events::*;
use crate::state::{
    liquidity::LiquidityPool, protocol::Protocol, protocol::Role, withdraw_request::WithdrawRequest,
};
use crate::utils::close_account;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Token, TokenAccount, Transfer};

// -----------------------------------------------------------------------------
// ProcessWithdrawQueue – keeper-only instruction
// -----------------------------------------------------------------------------
#[derive(Accounts)]
pub struct ProcessWithdrawQueue<'info> {
    #[account(
        mut,
        constraint = protocol.has_permission(keeper.key(), Role::Keeper) @ PerpetualsError::UnauthorizedRole
    )]
    pub keeper: Signer<'info>,

    #[account(mut, seeds = [LIQUIDITY_POOL_SEED], bump)]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,

    #[account(
        mut,
        seeds = [TOKEN_VAULT_SEED, liquidity_pool.key().as_ref()],
        bump,
        constraint = usdc_vault.key() == liquidity_pool.usdc_vault @ PerpetualsError::InvalidUsdcVault,
        constraint = usdc_vault.owner == pool_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = usdc_vault.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = usdc_vault.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    /// CHECK: pool authority PDA
    #[account(
        seeds = [POOL_AUTHORITY_SEED, liquidity_pool.key().as_ref(), protocol.key().as_ref()],
        bump
    )]
    pub pool_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = treasury_usdc_account.owner == protocol.treasury @ PerpetualsError::InvalidTreasuryAccount,
        constraint = treasury_usdc_account.mint == usdc_vault.mint @ PerpetualsError::InvalidMint,
        constraint = treasury_usdc_account.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = treasury_usdc_account.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub treasury_usdc_account: Account<'info, TokenAccount>,

    /// LP token escrow account where LP tokens are held during withdrawal queue processing
    #[account(
        mut,
        constraint = lp_token_escrow.key() == liquidity_pool.lp_token_escrow @ PerpetualsError::InvalidUsdcVault,
        constraint = lp_token_escrow.owner == pool_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = lp_token_escrow.mint == lp_mint.key() @ PerpetualsError::InvalidMint,
        constraint = lp_token_escrow.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = lp_token_escrow.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority,
        seeds = [LP_ESCROW_SEED, liquidity_pool.key().as_ref()],
        bump
    )]
    pub lp_token_escrow: Account<'info, TokenAccount>,

    /// USDC account
    #[account(
        mut,
        constraint = provider_usdc_account.key() == withdraw_request.provider_usdc_account @ PerpetualsError::InvalidInput,
        constraint = provider_usdc_account.owner == provider.key() @ PerpetualsError::Unauthorized,
        constraint = provider_usdc_account.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = provider_usdc_account.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority,
        constraint = provider_usdc_account.mint == protocol.collateral_mint @ PerpetualsError::InvalidMint,
    )]
    pub provider_usdc_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = withdraw_request.provider == provider.key() @ PerpetualsError::InvalidOwner,
        close = provider
    )]
    pub withdraw_request: Account<'info, WithdrawRequest>,

    /// CHECK: provider is validated via constraint
    #[account(
        mut,
        constraint = provider.key() == withdraw_request.provider @ PerpetualsError::InvalidOwner,
    )]
    pub provider: UncheckedAccount<'info>,

    /// LP token mint for burning
    #[account(
        mut,
        constraint = lp_mint.key() == liquidity_pool.lp_mint @ PerpetualsError::InvalidMint
    )]
    pub lp_mint: Account<'info, anchor_spl::token::Mint>,

    pub token_program: Program<'info, Token>,
}

/// Enhanced queue processing with sophisticated account management
pub fn process_withdraw_queue<'info>(
    ctx: Context<'_, '_, '_, 'info, ProcessWithdrawQueue<'info>>,
) -> Result<()> {
    let clock = Clock::get()?;

    // Store values we need before processing
    let pool_key = ctx.accounts.liquidity_pool.key();
    let protocol_key = ctx.accounts.protocol.key();
    let authority_bump = ctx.bumps.pool_authority;
    let pool = &mut ctx.accounts.liquidity_pool;
    let request = &ctx.accounts.withdraw_request;
    let provider_account = &ctx.accounts.provider_usdc_account;

    // Process queue
    let mut result = ProcessingResult::default();

    // Check if there are any requests to process
    if pool.withdraw_queue_tail >= pool.withdraw_queue_head {
        return Ok(()); // No requests to process
    }

    // Process the current request
    let next_id = pool.withdraw_queue_tail.checked_add(1).ok_or(PerpetualsError::MathOverflow)?;
    
    // Validate request ID
    require!(request.id == next_id, PerpetualsError::InvalidInput);
    // Note: withdraw_request is not a PDA, so no bump validation needed

    // Calculate current withdrawal amount based on remaining LP and current NAV
    let fulfillable_amount = pool.calculate_withdrawal_amount(request.remaining_lp)?;

    // Break early if nothing can be fulfilled
    require!(fulfillable_amount > 0, PerpetualsError::InvalidInput);

    // Validate provider account
    require!(
        provider_account.key() == request.provider_usdc_account,
        PerpetualsError::InvalidInput
    );

    // Calculate fees and transfers
    let fee_amount = pool.calculate_fee(fulfillable_amount, pool.withdrawal_fee_bps)?;
    let net_amount = fulfillable_amount
        .checked_sub(fee_amount)
        .ok_or(PerpetualsError::MathOverflow)?;

    // Execute transfers
    let authority_bump_bytes = [authority_bump];
    let auth_seeds = crate::utils::create_pool_authority_signer_seeds(
        &pool_key,
        &protocol_key,
        &authority_bump_bytes,
    );
    let signer = &[&auth_seeds[..]];

    // Transfer fee to treasury
    if fee_amount > 0 {
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

    // Transfer net amount to provider
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.usdc_vault.to_account_info(),
                to: provider_account.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            signer,
        ),
        net_amount,
    )?;

    // Calculate LP tokens to burn (proportional to fulfillable amount)
    let lp_to_burn = request.remaining_lp;

    // Safety check: ensure we have LP tokens to burn
    require!(lp_to_burn > 0, PerpetualsError::InvalidLpTokenAmount);

    // Burn LP tokens from escrow
    token::burn(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.lp_mint.to_account_info(),
                from: ctx.accounts.lp_token_escrow.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            signer,
        ),
        lp_to_burn,
    )?;

    // Update pool state
    pool.total_liquidity = pool.total_liquidity.checked_sub(fulfillable_amount).ok_or(PerpetualsError::MathOverflow)?;
    pool.total_shares = pool.total_shares.checked_sub(lp_to_burn).ok_or(PerpetualsError::MathOverflow)?;
    pool.last_update_timestamp = clock.unix_timestamp;
    pool.pending_lp_tokens = pool.pending_lp_tokens.checked_sub(lp_to_burn).ok_or(PerpetualsError::MathOverflow)?;

    pool.withdraw_queue_tail = next_id;

    // Accumulate results with overflow protection
    result.requests_processed = result
        .requests_processed
        .checked_add(1)
        .ok_or(PerpetualsError::MathOverflow)?; 
    result.total_amount_processed = result
        .total_amount_processed
        .checked_add(fulfillable_amount)
        .ok_or(PerpetualsError::MathOverflow)?;
    result.fees_collected = result
        .fees_collected
        .checked_add(fee_amount)
        .ok_or(PerpetualsError::MathOverflow)?;
    result.new_tail_position = pool.withdraw_queue_tail;

    // Emit comprehensive processing event
    emit!(WithdrawQueueProcessedEvent {
        liquidity_pool: ctx.accounts.liquidity_pool.key(),
        keeper: ctx.accounts.keeper.key(),
        requests_processed: result.requests_processed,
        total_amount_processed: result.total_amount_processed,
        fees_collected: result.fees_collected,
        queue_tail_updated: result.new_tail_position,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

// =============================================================================
// Queue Processing Implementation
// =============================================================================

/// Queue processing results for comprehensive tracking
#[derive(Debug, Default)]
struct ProcessingResult {
    requests_processed: u8,
    total_amount_processed: u64,
    fees_collected: u64,
    new_tail_position: u64,
}


