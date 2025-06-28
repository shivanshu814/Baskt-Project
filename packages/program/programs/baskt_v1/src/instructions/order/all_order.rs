use crate::constants::{
    AUTHORITY_SEED, ESCROW_MINT, MAX_ORDER_SIZE, MAX_SLIPPAGE_BPS, MIN_ORDER_SIZE, ORDER_SEED,
    PROTOCOL_SEED, USER_ESCROW_SEED,
};
use crate::error::PerpetualsError;
use crate::events::*;
use crate::state::{
    baskt::{BasktStatus, Baskt},
    order::{Order, OrderAction, OrderStatus, OrderType},
    protocol::Protocol,
};
use crate::utils::{
    calc_min_collateral_from_notional, calc_opening_fee_with_effective_rate, effective_u64,
};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::constants::BPS_DIVISOR;
use crate::math::mul_div_u64;
//----------------------------------------------------------------------------
// INSTRUCTION HANDLERS: ORDER
//----------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(
    order_id: u64,
    size: u64,
    collateral: u64,
    is_long: bool,
    action: OrderAction,
    target_position: Option<Pubkey>,
    limit_price: u64,
    max_slippage_bps: u64,
    leverage_bps: u64,
    order_type: OrderType,
)]
pub struct CreateOrder<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + Order::INIT_SPACE,
        seeds = [ORDER_SEED, owner.key().as_ref(), &order_id.to_le_bytes()],
        bump
    )]
    pub order: Account<'info, Order>,

    /// Baskt account
    #[account(
        constraint = baskt.is_trading() || baskt.is_unwinding() @ PerpetualsError::BasktNotActive
    )]
    pub baskt: Account<'info, Baskt>,

    #[account(
        mut,
        constraint = owner_token.owner == owner.key() @ PerpetualsError::UnauthorizedTokenOwner,
        constraint = owner_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = owner_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority,
        constraint = owner_token.mint == escrow_mint.key() @ PerpetualsError::InvalidMint
    )]
    pub owner_token: Account<'info, TokenAccount>,

    #[account(
        constraint = escrow_mint.key() == ESCROW_MINT @ PerpetualsError::InvalidMint
    )]
    pub escrow_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = owner,
        seeds = [USER_ESCROW_SEED, owner.key().as_ref()],
        bump,
        token::mint = escrow_mint,
        token::authority = program_authority,
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    ///CHECK: PDA used for token authority over escrow for future operations
    #[account(
        seeds = [AUTHORITY_SEED],
        bump,
    )]
    pub program_authority: AccountInfo<'info>,

    /// Protocol account to verify feature flags
    #[account(
        seeds = [PROTOCOL_SEED],
        bump,
        constraint = protocol.feature_flags.allow_trading @ PerpetualsError::TradingDisabled
    )]
    pub protocol: Account<'info, Protocol>,

    pub system_program: Program<'info, System>,

    ///CHECK: Token program is expected
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
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
    order_type: OrderType,
) -> Result<()> {
    if action == OrderAction::Open {
        // Ensure the baskt is active for trading
        require!(
            ctx.accounts.baskt.status == BasktStatus::Active,
            PerpetualsError::InvalidBasktState
        );

        // Basic collateral check
        require!(collateral > 0, PerpetualsError::InsufficientCollateral);

        // Slippage bounds are always required
        require!(
            max_slippage_bps <= MAX_SLIPPAGE_BPS,
            PerpetualsError::InvalidFeeBps
        );

        // ------------------------------------------------------------------
        // Validation branch per order type
        // ------------------------------------------------------------------
        if order_type == OrderType::Market {
            // For market orders we deliberately allow size == 0 because the
            // matcher (open_position handler) will derive the actual size
            // from `collateral` and `entry_price`.  Consequently we skip all
            // worst-case notional and min-collateral calculations here.

            // We still sanity-check limit_price, collateral (used for slippage checks at
            // fill time) to avoid tiny values that could cause rounding
            // issues.
            require!(limit_price >= MIN_ORDER_SIZE, PerpetualsError::InvalidOraclePrice);
            require!(collateral >= MIN_ORDER_SIZE, PerpetualsError::InsufficientCollateral);
            require!(collateral <= MAX_ORDER_SIZE, PerpetualsError::MathOverflow);
        } else {
            // ----- Limit (or future types that specify explicit size) -----

            // Size must be > 0 and within configured bounds
            require!(size > 0, PerpetualsError::ZeroSizedPosition);
            require!(size >= MIN_ORDER_SIZE, PerpetualsError::ZeroSizedPosition);
            require!(size <= MAX_ORDER_SIZE, PerpetualsError::MathOverflow);

            // Same limit_price sanity check
            require!(limit_price >= 1_000, PerpetualsError::InvalidOraclePrice);

            // Compute and validate worst-case notional exactly as before
            let temp_order = Order {
                owner: ctx.accounts.owner.key(),
                order_id,
                baskt_id: ctx.accounts.baskt.key(),
                size,
                collateral,
                is_long,
                action,
                status: OrderStatus::Pending,
                timestamp: 0,
                target_position,
                bump: 0,
                limit_price,
                max_slippage_bps,
                order_type,
                leverage_bps,
                extra_space: [0; 88],
            };

            let worst_case_notional = temp_order.calculate_worst_case_notional()?;

            const MAX_REASONABLE_NOTIONAL: u64 = 1_000_000_000_000_000; // 1B USDC
            require!(
                worst_case_notional <= MAX_REASONABLE_NOTIONAL,
                PerpetualsError::MathOverflow
            );

            let min_collateral_ratio_bps = effective_u64(
                ctx.accounts.baskt.config.min_collateral_ratio_bps,
                ctx.accounts.protocol.config.min_collateral_ratio_bps,
            );

            let min_collateral = calc_min_collateral_from_notional(
                worst_case_notional,
                min_collateral_ratio_bps,
            )?;

            let opening_fee = calc_opening_fee_with_effective_rate(
                worst_case_notional,
                ctx.accounts.baskt.config.opening_fee_bps,
                ctx.accounts.protocol.config.opening_fee_bps,
            )?;

            // Expected collateral w.r.t declared leverage
            let expected_collateral = mul_div_u64(
                worst_case_notional,
                BPS_DIVISOR,
                leverage_bps,
            )?;

            let total_required = min_collateral
                .checked_add(opening_fee)
                .ok_or(PerpetualsError::MathOverflow)?;

            require!(
                collateral >= total_required && collateral >= expected_collateral,
                PerpetualsError::InsufficientCollateral
            );
        }
    } else {
        // Close orders still require a target position
        require!(
            target_position.is_some(),
            PerpetualsError::InvalidTargetPosition
        );
    }

    let order = &mut ctx.accounts.order;
    let baskt = &ctx.accounts.baskt;
    let owner = &ctx.accounts.owner;
    let bump = ctx.bumps.order; // Use direct bump access
    let clock = Clock::get()?;

    // Initialize order using updated Order::initialize method
    order.initialize(
        owner.key(),
        order_id,
        baskt.key(),
        size,
        collateral,
        is_long,
        action,
        clock.unix_timestamp,
        target_position,
        bump,
        limit_price,
        max_slippage_bps,
        order_type,
        leverage_bps,
    )?;

    // Transfer collateral to escrow if this is an open order
    if action == OrderAction::Open {
        // Transfer tokens from owner to escrow
        // Assuming owner is the authority for their token account
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.owner_token.to_account_info(),
                    to: ctx.accounts.escrow_token.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(), // Owner signs
                },
            ),
            collateral,
        )?;
    }

    // Emit event for off-chain services using existing Event struct
    emit!(OrderCreatedEvent {
        owner: owner.key(),
        order_id,
        baskt_id: baskt.key(),
        size,
        collateral,
        is_long,
        action,
        target_position,
        limit_price,
        max_slippage_bps,
        order_type,
        leverage_bps,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [ORDER_SEED, owner.key().as_ref(), &order.order_id.to_le_bytes()],
        bump = order.bump,
        // has_one = owner, // Simpler constraint for owner check
        constraint = order.owner == owner.key() @ PerpetualsError::Unauthorized,
        constraint = order.status as u8 == OrderStatus::Pending as u8 @ PerpetualsError::OrderAlreadyProcessed,
        close = owner // Close the order account and return rent to owner
    )]
    pub order: Account<'info, Order>,

    #[account(
        mut,
        constraint = owner_token.owner == owner.key() @ PerpetualsError::UnauthorizedTokenOwner,
        constraint = owner_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = owner_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority,
        constraint = owner_token.mint == ESCROW_MINT @ PerpetualsError::InvalidMint
    )]
    pub owner_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [USER_ESCROW_SEED, owner.key().as_ref()],
        bump,
        constraint = escrow_token.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = escrow_token.mint == ESCROW_MINT @ PerpetualsError::InvalidMint,
        constraint = escrow_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = escrow_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    ///CHECK: PDA used for token authority. Needed to sign the transfer from escrow.
    #[account(
        seeds = [AUTHORITY_SEED],
        bump,
    )]
    pub program_authority: AccountInfo<'info>,

    /// Protocol account to verify feature flags
    #[account(
        seeds = [PROTOCOL_SEED],
        bump,
        constraint = protocol.feature_flags.allow_trading @ PerpetualsError::TradingDisabled
    )]
    pub protocol: Account<'info, Protocol>,

    pub token_program: Program<'info, Token>,
    // Removed program_authority_bump parameter since it will be derived
}

pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
    let order = &ctx.accounts.order; // Borrow immutably as state changes are handled by close = owner
    let clock = Clock::get()?;

    // Only open orders have collateral to return from escrow
    if order.action == OrderAction::Open && order.collateral > 0 {
        // Use signer seeds with canonical bump derived by Anchor
        let signer_seeds = [AUTHORITY_SEED, &[ctx.bumps.program_authority]];
        let signer = &[&signer_seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token.to_account_info(),
                    to: ctx.accounts.owner_token.to_account_info(),
                    authority: ctx.accounts.program_authority.to_account_info(),
                },
                signer,
            ),
            order.collateral,
        )?;
    }

    // Order account is closed automatically by `close = owner` constraint.
    // No need to call order.cancel() manually if closing the account.

    // Emit event for off-chain services
    emit!(OrderCancelledEvent {
        owner: order.owner,
        order_id: order.order_id,
        baskt_id: order.baskt_id,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
