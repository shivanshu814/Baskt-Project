use {
    crate::error::PerpetualsError,
    crate::events::*,
    crate::state::{
        liquidity::{LiquidityPool, MAX_FEE_BPS},
        protocol::{Protocol, Role},
    },
    anchor_lang::prelude::*,
    anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer},
};

/// Initializes the liquidity pool for the entire protocol
#[derive(Accounts)]
pub struct InitializeLiquidityPool<'info> {
    /// Admin with Owner role who can initialize the pool
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Payer for the rent fees
    /// TODO sidduHERE admin and payer should be the same
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Protocol account to verify admin role
    /// @dev Requires Owner role to initialize liquidity pool
    #[account(
        seeds = [b"protocol"],
        bump,
        constraint = protocol.has_permission(admin.key(), Role::Owner) @ PerpetualsError::Unauthorized
    )]
    pub protocol: Account<'info, Protocol>,

    /// Liquidity pool account to initialize
    #[account(
        init,
        payer = payer,
        space = 8 + LiquidityPool::INIT_SPACE,
        seeds = [b"liquidity_pool", protocol.key().as_ref()],
        bump
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    /// The mint that will be used for LP tokens
    /// TODO sidduHERE  need clarity on this. Who is creating this.
    #[account(
        init,
        payer = payer,
        mint::decimals = token_mint.decimals,
        mint::authority = pool_authority,
    )]
    pub lp_mint: Account<'info, Mint>,

    /// The token account that will hold the pool's assets
    #[account(
        init,
        payer = payer,
        token::mint = token_mint,
        token::authority = pool_authority,
        seeds = [b"token_vault", liquidity_pool.key().as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenAccount>,

    /// The mint of the token used for collateral
    pub token_mint: Account<'info, Mint>,

    /// CHECK: PDA used for pool operations authority
    #[account(
        seeds = [b"pool_authority", liquidity_pool.key().as_ref(), protocol.key().as_ref()],
        bump
    )]
    pub pool_authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

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
        seeds = [b"liquidity_pool", protocol.key().as_ref()],
        bump = liquidity_pool.bump,
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    /// Protocol account to verify feature flags
    #[account(
        seeds = [b"protocol"],
        bump,
        constraint = protocol.feature_flags.allow_add_liquidity @ PerpetualsError::FeatureDisabled
    )]
    pub protocol: Account<'info, Protocol>,

    /// The provider's token account to withdraw funds from
    #[account(
        mut,
        constraint = provider_token_account.owner == provider.key() @ PerpetualsError::Unauthorized,
        constraint = provider_token_account.mint == token_vault.mint @ PerpetualsError::InvalidMint,
        constraint = provider_token_account.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = provider_token_account.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub provider_token_account: Account<'info, TokenAccount>,

    /// The vault that holds the pool's assets
    #[account(
        mut,
        constraint = token_vault.key() == liquidity_pool.token_vault @ PerpetualsError::InvalidTokenVault,
        constraint = token_vault.owner == pool_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = token_vault.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = token_vault.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority, 
        seeds = [b"token_vault", liquidity_pool.key().as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenAccount>,

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
        constraint = treasury_token_account.owner == treasury.key() @ PerpetualsError::InvalidTreasuryAccount,
        constraint = treasury_token_account.mint == token_vault.mint @ PerpetualsError::InvalidMint,
        constraint = treasury_token_account.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = treasury_token_account.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    /// CHECK: Treasury account that receives fees
    #[account(
        constraint = protocol.has_permission(treasury.key(), Role::Treasury) @ PerpetualsError::InvalidTreasuryAccount
    )]
    pub treasury: UncheckedAccount<'info>,

    /// CHECK: PDA used for pool operations authority
    #[account(
        seeds = [b"pool_authority", liquidity_pool.key().as_ref(), protocol.key().as_ref()],
        bump,
    )]
    pub pool_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

/// Remove liquidity from the pool by burning LP tokens
#[derive(Accounts)]
#[instruction(lp_amount: u64, min_tokens_out: u64)]
pub struct RemoveLiquidity<'info> {
    /// The liquidity provider
    #[account(mut)]
    pub provider: Signer<'info>,

    /// The liquidity pool account
    #[account(
        mut,
        seeds = [b"liquidity_pool", protocol.key().as_ref()],
        bump = liquidity_pool.bump,
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    /// Protocol account to verify feature flags
    #[account(
        seeds = [b"protocol"],
        bump,
        constraint = protocol.feature_flags.allow_remove_liquidity @ PerpetualsError::FeatureDisabled
    )]
    pub protocol: Account<'info, Protocol>,

    /// The provider's token account to receive funds
    #[account(
        mut,
        constraint = provider_token_account.owner == provider.key() @ PerpetualsError::Unauthorized,
        constraint = provider_token_account.mint == token_vault.mint @ PerpetualsError::InvalidMint,
        constraint = provider_token_account.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = provider_token_account.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub provider_token_account: Account<'info, TokenAccount>,

    /// The vault that holds the pool's assets
    #[account(
        mut,
        constraint = token_vault.key() == liquidity_pool.token_vault @ PerpetualsError::InvalidTokenVault,
        constraint = token_vault.owner == pool_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = token_vault.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = token_vault.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority, 
        seeds = [b"token_vault", liquidity_pool.key().as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenAccount>,

    /// The provider's LP token account to burn LP tokens from
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
    /// /TODO sidduHERE where is the check for this 
    #[account(
        mut,
        constraint = treasury_token_account.owner == treasury.key() @ PerpetualsError::InvalidTreasuryAccount,
        constraint = treasury_token_account.mint == token_vault.mint @ PerpetualsError::InvalidMint,
        constraint = treasury_token_account.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = treasury_token_account.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    /// CHECK: Treasury account that receives fees
    ///    TODO sidduHERE where is the check for this. We should be setting this during init 
    #[account(
        constraint = protocol.has_permission(treasury.key(), Role::Treasury) @ PerpetualsError::InvalidTreasuryAccount
    )]
    pub treasury: UncheckedAccount<'info>,

    /// CHECK: PDA used for pool operations authority
    #[account(
        seeds = [b"pool_authority", liquidity_pool.key().as_ref(), protocol.key().as_ref()],
        bump,
    )]
    pub pool_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

/// Initialize the liquidity pool for the first time
pub fn initialize_liquidity_pool(
    ctx: Context<InitializeLiquidityPool>,
    deposit_fee_bps: u16,
    withdrawal_fee_bps: u16,
    min_deposit: u64,
) -> Result<()> {
    // Validate inputs
    require!(
        deposit_fee_bps <= MAX_FEE_BPS,
        PerpetualsError::InvalidFeeBps
    ); // Max 5%
    require!(
        withdrawal_fee_bps <= MAX_FEE_BPS,
        PerpetualsError::InvalidFeeBps
    ); // Max 5%

    let liquidity_pool = &mut ctx.accounts.liquidity_pool;
    liquidity_pool.lp_mint = ctx.accounts.lp_mint.key();
    liquidity_pool.token_vault = ctx.accounts.token_vault.key();
    liquidity_pool.total_liquidity = 0;
    liquidity_pool.total_shares = 0;
    liquidity_pool.deposit_fee_bps = deposit_fee_bps;
    liquidity_pool.withdrawal_fee_bps = withdrawal_fee_bps;
    liquidity_pool.min_deposit = min_deposit;
    liquidity_pool.last_update_timestamp = Clock::get()?.unix_timestamp;
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
        token_vault: ctx.accounts.token_vault.key(),
        deposit_fee_bps,
        withdrawal_fee_bps,
        min_deposit,
        initializer: ctx.accounts.admin.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
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
    // Validate inputs
    let liquidity_pool = &ctx.accounts.liquidity_pool;

    // Calculate fee - min_deposit check is now handled in calculate_shares_to_mint
    let fee_amount = liquidity_pool.calculate_fee(amount, liquidity_pool.deposit_fee_bps)?;

    // Calculate shares to mint (after fee is taken)
    let net_deposit = amount
        .checked_sub(fee_amount)
        .ok_or(PerpetualsError::MathOverflow)?;
    let shares_to_mint = liquidity_pool.calculate_shares_to_mint(amount, fee_amount)?;

    // Ensure shares_to_mint is greater than zero
    require!(shares_to_mint > 0, PerpetualsError::InvalidLpTokenAmount);

    msg!("Shares to mint: {}", shares_to_mint);
    msg!("Min shares out: {}", min_shares_out);

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
                from: ctx.accounts.provider_token_account.to_account_info(),
                to: ctx.accounts.token_vault.to_account_info(),
                authority: ctx.accounts.provider.to_account_info(),
            },
        ),
        amount,
    )?;

    // Mint LP tokens to provider
    let liquidity_pool_key = ctx.accounts.liquidity_pool.key();
    let protocol_key = ctx.accounts.protocol.key();
    let signer_seeds = [
        b"pool_authority" as &[u8],
        liquidity_pool_key.as_ref(),
        protocol_key.as_ref(),
        &[ctx.bumps.pool_authority],
    ];
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
            b"pool_authority" as &[u8],
            liquidity_pool_key.as_ref(),
            protocol_key.as_ref(),
            &[ctx.bumps.pool_authority],
        ];
        let signer = &[&signer_seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.token_vault.to_account_info(),
                    to: ctx.accounts.treasury_token_account.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
                signer,
            ),
            fee_amount,
        )?;
    }

    // Update liquidity pool state AFTER all external CPIs have completed
    let liquidity_pool = &mut ctx.accounts.liquidity_pool;

    // Process deposit using the existing method on LiquidityPool
    // We only add net_deposit to total_liquidity since fee will be removed from vault
    liquidity_pool.process_deposit(net_deposit, shares_to_mint)?;

    // Emit event
    emit!(LiquidityAddedEvent {
        provider: ctx.accounts.provider.key(),
        liquidity_pool: liquidity_pool.key(),
        deposit_amount: amount,
        fee_amount,
        shares_minted: shares_to_mint,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

/// Remove liquidity from the pool
///
/// This function allows users to burn their LP tokens to withdraw their
/// proportional share of tokens from the pool.
///
/// The min_tokens_out parameter is a safety check to ensure the user receives
/// at least the expected number of tokens. This is not for slippage protection
/// in the traditional DEX sense (as this is a single-asset vault), but rather
/// to protect against unexpected state changes between tx submission and execution.
pub fn remove_liquidity(
    ctx: Context<RemoveLiquidity>,
    lp_amount: u64,
    min_tokens_out: u64,
) -> Result<()> {
    // Validate inputs
    require!(lp_amount > 0, PerpetualsError::InvalidLpTokenAmount);

    let liquidity_pool = &ctx.accounts.liquidity_pool;

    // Calculate withdrawal amount
    let withdrawal_amount = liquidity_pool.calculate_withdrawal_amount(lp_amount)?;

    // Calculate fee
    let fee_amount =
        liquidity_pool.calculate_fee(withdrawal_amount, liquidity_pool.withdrawal_fee_bps)?;

    // Calculate net amount to return to user
    let net_amount = withdrawal_amount
        .checked_sub(fee_amount)
        .ok_or(PerpetualsError::MathOverflow)?;

    // Check minimum tokens out safeguard
    require!(
        net_amount >= min_tokens_out,
        PerpetualsError::InvalidLpTokenAmount
    );

    // Burn LP tokens from provider
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.lp_mint.to_account_info(),
                from: ctx.accounts.provider_lp_account.to_account_info(),
                authority: ctx.accounts.provider.to_account_info(),
            },
        ),
        lp_amount,
    )?;

    // Transfer assets from vault to provider
    let liquidity_pool_key = ctx.accounts.liquidity_pool.key();
    let protocol_key = ctx.accounts.protocol.key();
    let signer_seeds = [
        b"pool_authority" as &[u8],
        liquidity_pool_key.as_ref(),
        protocol_key.as_ref(),
        &[ctx.bumps.pool_authority],
    ];
    let signer = &[&signer_seeds[..]];

    // If there's a fee, transfer it from the vault to the treasury
    if fee_amount > 0 {
        // Reuse the already created signer
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.token_vault.to_account_info(),
                    to: ctx.accounts.treasury_token_account.to_account_info(),
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
                from: ctx.accounts.token_vault.to_account_info(),
                to: ctx.accounts.provider_token_account.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            signer,
        ),
        net_amount,
    )?;

    // Update liquidity pool state AFTER all external CPIs have completed
    let liquidity_pool = &mut ctx.accounts.liquidity_pool;

    // Process withdrawal using the existing method on LiquidityPool
    liquidity_pool.process_withdrawal(lp_amount, withdrawal_amount)?;

    // Emit event
    emit!(LiquidityRemovedEvent {
        provider: ctx.accounts.provider.key(),
        liquidity_pool: liquidity_pool.key(),
        shares_burned: lp_amount,
        withdrawal_amount,
        fee_amount,
        net_amount_received: net_amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
