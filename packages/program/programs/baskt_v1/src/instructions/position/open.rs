use {
    crate::constants::{
        AUTHORITY_SEED, ESCROW_SEED, FUNDING_INDEX_SEED, LIQUIDITY_POOL_SEED, ORDER_SEED,
        POSITION_SEED, PRICE_PRECISION, PROTOCOL_SEED, USER_ESCROW_SEED, BPS_DIVISOR,
    },
    crate::error::PerpetualsError,
    crate::events::*,
    crate::math::mul_div_u64,
    crate::state::{
        baskt::Baskt,
        funding_index::FundingIndex,
        liquidity::LiquidityPool,
        order::{Order, OrderAction, OrderStatus, OrderType},
        position::{Position, ProgramAuthority},
        protocol::{Protocol, Role},
    },
    crate::utils::{
        calc_min_collateral_from_notional, calc_opening_fee_with_effective_rate, effective_u64,
        split_fee, validate_treasury_and_vault,
    },
    anchor_lang::prelude::*,
    anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer},
};

/// Parameters for opening a position
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OpenPositionParams {
    pub position_id: u64,
    pub entry_price: u64,
}

/// OpenPosition
#[derive(Accounts)]
#[instruction(params: OpenPositionParams)]
pub struct OpenPosition<'info> {
    #[account(mut)]
    pub matcher: Signer<'info>,

    #[account(
        mut,
        seeds = [ORDER_SEED, order.owner.as_ref(), &order.order_id.to_le_bytes()],
        bump = order.bump,
        constraint = order.status as u8 == OrderStatus::Pending as u8 @ PerpetualsError::OrderAlreadyProcessed,
        constraint = order.action as u8 == OrderAction::Open as u8 @ PerpetualsError::InvalidOrderAction,
        close = matcher // Close the order account and return rent to matcher
    )]
    pub order: Account<'info, Order>,

    #[account(
        init,
        payer = matcher, // Matcher pays for position account creation
        space = Position::DISCRIMINATOR.len() + Position::INIT_SPACE,
        seeds = [POSITION_SEED, order.owner.as_ref(), &params.position_id.to_le_bytes()],
        bump
    )]
    pub position: Box<Account<'info, Position>>,

    #[account(
        mut,
        seeds = [FUNDING_INDEX_SEED, order.baskt_id.as_ref()],
        bump = funding_index.bump
    )]
    pub funding_index: Account<'info, FundingIndex>,

    /// Baskt account that contains the embedded oracle for price validation
    #[account(
        mut,
        constraint = baskt.key() == order.baskt_id.key() @ PerpetualsError::InvalidBaskt,
        constraint = baskt.is_trading() @ PerpetualsError::BasktNotActive
    )]
    pub baskt: Box<Account<'info, Baskt>>,

    /// Protocol account for checking permissions
    /// @dev Requires Matcher role to open positions
    #[account(
        constraint = protocol.feature_flags.allow_open_position && protocol.feature_flags.allow_trading @ PerpetualsError::PositionOperationsDisabled,
        constraint = protocol.has_permission(matcher.key(), Role::Matcher) @ PerpetualsError::Unauthorized,
        seeds = [PROTOCOL_SEED],
        bump
    )]
    pub protocol: Box<Account<'info, Protocol>>,

    /// Liquidity pool for account validation and fee accounting
    #[account(
        mut,
        seeds = [LIQUIDITY_POOL_SEED],
        bump = liquidity_pool.bump
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    #[account(
        mut,
        seeds = [USER_ESCROW_SEED, order.owner.as_ref()],
        bump,
        constraint = order_escrow.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = order_escrow.mint == protocol.escrow_mint @ PerpetualsError::InvalidMint
    )]
    pub order_escrow: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = matcher,
        seeds = [ESCROW_SEED, position.key().as_ref()],
        bump,
        token::mint = escrow_mint,
        token::authority = program_authority,
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    /// PDA used for token authority over escrow
    #[account(
        seeds = [AUTHORITY_SEED],
        bump,
    )]
    pub program_authority: Account<'info, ProgramAuthority>,

    /// Escrow mint (USDC) - validated via protocol
    #[account(
        constraint = escrow_mint.key() == protocol.escrow_mint @ PerpetualsError::InvalidMint
    )]
    pub escrow_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

/// Wrapper for remaining accounts: expect treasury token account at index 0, BLP token vault at index 1
pub struct OpenPositionRemainingAccounts<'info> {
    /// CHECK: protocol treasury token account
    pub treasury_token: AccountInfo<'info>,
    /// CHECK: BLP token vault account
    pub token_vault: AccountInfo<'info>,
}

impl<'info> OpenPositionRemainingAccounts<'info> {
    pub fn parse(remaining: &'info [AccountInfo<'info>]) -> Result<Self> {
        require!(remaining.len() >= 2, PerpetualsError::InvalidAccountInput);
        Ok(Self {
            treasury_token: remaining[0].clone(),
            token_vault: remaining[1].clone(),
        })
    }

    /// Validate that accounts match expected protocol accounts
    pub fn validate(&self, protocol: &Protocol, liquidity_pool: &LiquidityPool) -> Result<()> {
        validate_treasury_and_vault(
            &self.treasury_token,
            &self.token_vault,
            protocol,
            liquidity_pool,
        )
    }
}

// -----------------------------------------------------------------------------
// Helper: derive the effective position size, handling market-order auto sizing
// -----------------------------------------------------------------------------
fn calculate_effective_size(
    order: &Order,
    entry_price: u64,
    collateral: u64,
    effective_min_cr_bps: u64,
    effective_opening_fee_bps: u64,
) -> Result<u64> {
    // For limit orders or any non-market order, keep the user-supplied size.
    if order.order_type != OrderType::Market {
        return Ok(order.size);
    }

    // total bps that must be covered by collateral (min CR + opening fee)
    let total_bps = effective_min_cr_bps
        .checked_add(effective_opening_fee_bps)
        .ok_or(PerpetualsError::MathOverflow)?;
    require!(total_bps > 0, PerpetualsError::MathOverflow);

    // Maximum notional supported by the provided collateral
    let notional_allowed = mul_div_u64(collateral, BPS_DIVISOR, total_bps)?;

    // Derive size from notional
    let size = mul_div_u64(notional_allowed, PRICE_PRECISION, entry_price)?;
    require!(size > 0, PerpetualsError::ZeroSizedPosition);

    Ok(size)
}

pub fn open_position<'info>(
    ctx: Context<'_, '_, 'info, 'info, OpenPosition<'info>>,
    params: OpenPositionParams,
) -> Result<()> {
    let order = &ctx.accounts.order; // Order is closed, access immutably
    let position = &mut ctx.accounts.position;
    let funding_index = &ctx.accounts.funding_index;
    let bump = ctx.bumps.position;
    let clock = Clock::get()?;

    // 1. Validate oracle price is fresh and valid
    ctx.accounts
        .baskt
        .oracle
        .validate_execution_price(params.entry_price)?;

    // 2. Validate execution price is within order's slippage bounds
    order.validate_execution_price(params.entry_price)?;

    // New: Add limit order execution validation
    if order.order_type == OrderType::Limit {
        if order.is_long {
            require!(
                params.entry_price <= order.limit_price,
                PerpetualsError::PriceOutOfBounds
            );
        } else {
            require!(
                params.entry_price >= order.limit_price,
                PerpetualsError::PriceOutOfBounds
            );
        }
    }

    // -------------------------------------------------------------
    // Pre-compute effective fee / collateral ratio parameters once
    // -------------------------------------------------------------
    let effective_opening_fee_bps = effective_u64(
        ctx.accounts.baskt.config.opening_fee_bps,
        ctx.accounts.protocol.config.opening_fee_bps,
    );
    let effective_min_cr_bps = effective_u64(
        ctx.accounts.baskt.config.min_collateral_ratio_bps,
        ctx.accounts.protocol.config.min_collateral_ratio_bps,
    );

    // ------------------------------------------------------------------
    // Derive the effective position size (auto-sizing for market orders)
    // ------------------------------------------------------------------
    let effective_size = calculate_effective_size(
        order,
        params.entry_price,
        order.collateral,
        effective_min_cr_bps,
        effective_opening_fee_bps,
    )?;

    // 3. Calculate real notional value using safe helper
    let real_notional_u64 = mul_div_u64(effective_size, params.entry_price, PRICE_PRECISION)?;

    // ------------------------------------------------------------------
    // Enforce declared leverage (only for Limit orders)
    // ------------------------------------------------------------------
    if order.order_type == OrderType::Limit {
        let realised_leverage_bps = mul_div_u64(real_notional_u64, BPS_DIVISOR, order.collateral)?;
        require!(
            realised_leverage_bps <= order.leverage_bps,
            PerpetualsError::LeverageExceeded
        );
    }

    // 4. Calculate opening fee based on real notional value
    let opening_fee = calc_opening_fee_with_effective_rate(
        real_notional_u64,
        ctx.accounts.baskt.config.opening_fee_bps,
        ctx.accounts.protocol.config.opening_fee_bps,
    )?;

    // 5. Re-validate minimum collateral using real notional
    let min_collateral_ratio_bps = effective_min_cr_bps;
    let min_collateral_real =
        calc_min_collateral_from_notional(real_notional_u64, min_collateral_ratio_bps)?;
    let total_required_real = min_collateral_real
        .checked_add(opening_fee)
        .ok_or(PerpetualsError::MathOverflow)?;

    require!(
        order.collateral >= total_required_real,
        PerpetualsError::InsufficientCollateral
    );

    // 6. Calculate net collateral after fee (using real notional for fee calculation)
    let net_collateral_amount = order
        .collateral
        .checked_sub(opening_fee)
        .ok_or(PerpetualsError::InsufficientCollateral)?;

    position.initialize(
        order.owner,
        params.position_id,
        order.baskt_id,
        effective_size,
        net_collateral_amount,
        order.is_long,
        params.entry_price,
        funding_index.cumulative_index,
        clock.unix_timestamp,
        bump,
    )?;

    // Increment open positions count
    ctx.accounts.baskt.open_positions = ctx
        .accounts
        .baskt
        .open_positions
        .checked_add(1)
        .ok_or(PerpetualsError::MathOverflow)?;

    // Remaining accounts (treasury token)
    let remaining_accounts = OpenPositionRemainingAccounts::parse(ctx.remaining_accounts)?;

    // Validate remaining accounts for security
    remaining_accounts.validate(&ctx.accounts.protocol, &ctx.accounts.liquidity_pool)?;

    // Signer seeds for program authority
    let authority_seeds: &[&[u8]] = &[AUTHORITY_SEED, &[ctx.bumps.program_authority]];
    let authority_signer: &[&[&[u8]]] = &[authority_seeds];

    // 1. Split and transfer opening fee between treasury and BLP
    let (fee_to_treasury, fee_to_blp) = if opening_fee > 0 {
        let (treasury_fee, blp_fee) =
            split_fee(opening_fee, ctx.accounts.protocol.config.treasury_cut_bps)?;

        // Transfer treasury portion
        if treasury_fee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.order_escrow.to_account_info(),
                        to: remaining_accounts.treasury_token.clone(),
                        authority: ctx.accounts.program_authority.to_account_info(),
                    },
                    authority_signer,
                ),
                treasury_fee,
            )?;
        }

        // Transfer BLP portion to token vault
        if blp_fee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.order_escrow.to_account_info(),
                        to: remaining_accounts.token_vault.clone(),
                        authority: ctx.accounts.program_authority.to_account_info(),
                    },
                    authority_signer,
                ),
                blp_fee,
            )?;

            // Update liquidity pool accounting to match vault balance
            // This ensures vault_balance == total_liquidity and prevents LP share calculation exploits
            ctx.accounts.liquidity_pool.increase_liquidity(blp_fee)?;
        }

        (treasury_fee, blp_fee)
    } else {
        (0, 0)
    };

    // 2. Transfer net collateral from order escrow to the new position escrow
    let collateral_amount = net_collateral_amount;
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.order_escrow.to_account_info(),
                to: ctx.accounts.escrow_token.to_account_info(),
                authority: ctx.accounts.program_authority.to_account_info(),
            },
            authority_signer,
        ),
        collateral_amount,
    )?;

    // Order account is closed automatically via `close = matcher`.
    // No need to call order.fill() if closing.

    // Emit events
    emit!(OrderFilledEvent {
        owner: order.owner,
        order_id: order.order_id,
        baskt_id: order.baskt_id,
        action: order.action,
        size: effective_size,
        fill_price: params.entry_price,
        position_id: Some(params.position_id),
        target_position: None,
        timestamp: clock.unix_timestamp,
    });

    emit!(PositionOpenedEvent {
        order_id: order.order_id,
        owner: position.owner,
        position_id: params.position_id,
        baskt_id: position.baskt_id,
        size: position.size,
        collateral: position.collateral,
        is_long: position.is_long,
        entry_price: params.entry_price,
        entry_funding_index: position.entry_funding_index,
        fee_to_treasury,
        fee_to_blp,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
