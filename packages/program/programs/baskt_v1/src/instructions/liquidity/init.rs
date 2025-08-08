use crate::constants::*;
use {
    crate::constants::{LIQUIDITY_POOL_SEED, MAX_FEE_BPS, POOL_AUTHORITY_SEED, TOKEN_VAULT_SEED},
    crate::error::PerpetualsError,
    crate::events::*,
    crate::state::{
        liquidity::LiquidityPool,
        protocol::{Protocol, Role},
    },
    anchor_lang::prelude::*,
    anchor_spl::token::{Mint, Token, TokenAccount},
};

/// Initializes the liquidity pool for the entire protocol
#[derive(Accounts)]
pub struct InitializeLiquidityPool<'info> {
    /// Admin with Owner role who can initialize the pool
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Protocol account to verify admin role
    /// @dev Requires Owner role to initialize liquidity pool
    #[account(
        seeds = [PROTOCOL_SEED],
        bump,
        constraint = protocol.has_permission(admin.key(), Role::Owner) @ PerpetualsError::UnauthorizedRole
    )]
    pub protocol: Account<'info, Protocol>,

    /// Liquidity pool account to initialize
    #[account(
        init,
        payer = admin,
        space = LiquidityPool::DISCRIMINATOR.len() + LiquidityPool::INIT_SPACE,
        seeds = [LIQUIDITY_POOL_SEED],
        bump
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    /// The mint that will be used for LP tokens
    #[account(
        init,
        payer = admin,
        mint::decimals = usdc_mint.decimals,
        mint::authority = pool_authority,
    )]
    pub lp_mint: Account<'info, Mint>,

    /// The token account that will hold the pool's assets
    #[account(
        init,
        payer = admin,
        token::mint = usdc_mint,
        token::authority = pool_authority,
        seeds = [TOKEN_VAULT_SEED, liquidity_pool.key().as_ref()],
        bump
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    /// The token account that will hold LP tokens during withdrawal queue processing
    #[account(
        init,
        payer = admin,
        token::mint = lp_mint,
        token::authority = pool_authority,
        seeds = [LP_ESCROW_SEED, liquidity_pool.key().as_ref()],
        bump
    )]
    pub lp_token_escrow: Account<'info, TokenAccount>,

    /// The mint of the token used for collateral
    pub usdc_mint: Account<'info, Mint>,

    /// CHECK: PDA used for pool operations authority
    #[account(
        seeds = [POOL_AUTHORITY_SEED, liquidity_pool.key().as_ref(), protocol.key().as_ref()],
        bump
    )]
    pub pool_authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}


/// Initialize the liquidity pool for the first time
pub fn initialize_liquidity_pool(
    ctx: Context<InitializeLiquidityPool>,
    deposit_fee_bps: u16,
    withdrawal_fee_bps: u16,
) -> Result<()> {
    // Validate inputs
    require!(
        deposit_fee_bps as u64 <= MAX_FEE_BPS,
        PerpetualsError::InvalidFeeBps
    ); // Max 5%
    require!(
        withdrawal_fee_bps as u64 <= MAX_FEE_BPS,
        PerpetualsError::InvalidFeeBps
    ); // Max 5%

    let liquidity_pool = &mut ctx.accounts.liquidity_pool;
    liquidity_pool.lp_mint = ctx.accounts.lp_mint.key();
    liquidity_pool.usdc_vault = ctx.accounts.usdc_vault.key();
    liquidity_pool.lp_token_escrow = ctx.accounts.lp_token_escrow.key();
    liquidity_pool.total_liquidity = 0;
    liquidity_pool.total_shares = 0;
    liquidity_pool.deposit_fee_bps = deposit_fee_bps;
    liquidity_pool.withdrawal_fee_bps = withdrawal_fee_bps;
    liquidity_pool.pending_lp_tokens = 0;
    liquidity_pool.last_update_timestamp = Clock::get()?.unix_timestamp;
    liquidity_pool.withdraw_queue_head = 0;
    liquidity_pool.withdraw_queue_tail = 0;
    liquidity_pool.bump = ctx.bumps.liquidity_pool;

    msg!(
        "Liquidity pool initialized with deposit fee: {}bps, withdrawal fee: {}bps",
        deposit_fee_bps,
        withdrawal_fee_bps
    );

    // Emit initialization event
    emit!(LiquidityPoolInitializedEvent {
        liquidity_pool: liquidity_pool.key(),
        lp_mint: ctx.accounts.lp_mint.key(),
        usdc_vault: ctx.accounts.usdc_vault.key(),
        deposit_fee_bps,
        withdrawal_fee_bps,
        initializer: ctx.accounts.admin.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
