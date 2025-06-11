use {
    crate::constants::{
        AUTHORITY_SEED, BPS_DIVISOR, CLOSING_FEE_BPS, ESCROW_SEED, FUNDING_INDEX_SEED,
        LIQUIDITY_POOL_SEED, ORDER_SEED, POOL_AUTHORITY_SEED, POSITION_SEED, PROTOCOL_SEED,
    },
    crate::error::PerpetualsError,
    crate::events::*,
    crate::state::{
        baskt::BasktV1,
        funding_index::FundingIndex,
        liquidity::LiquidityPool,
        order::{Order, OrderAction, OrderStatus},
        position::{Position, PositionStatus, ProgramAuthority},
        protocol::{Protocol, Role},
    },
    anchor_lang::prelude::*,
    anchor_spl::token::{self, CloseAccount, Token, TokenAccount, Transfer},
};

/// Parameters for closing a position
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct ClosePositionParams {
    pub exit_price: u64,
}

/// Wrapper for remaining accounts to improve readability
pub struct ClosePositionRemainingAccounts<'info> {
    pub owner_token: &'info AccountInfo<'info>,
    pub treasury_token: &'info AccountInfo<'info>,
    pub token_vault: &'info AccountInfo<'info>,
}

impl<'info> ClosePositionRemainingAccounts<'info> {
    pub fn parse(remaining_accounts: &'info [AccountInfo<'info>]) -> Result<Self> {
        require!(
            remaining_accounts.len() >= 3,
            PerpetualsError::InvalidAccountInput
        );

        Ok(Self {
            owner_token: &remaining_accounts[0],
            treasury_token: &remaining_accounts[1],
            token_vault: &remaining_accounts[2],
        })
    }
}

/// ClosePosition
///
/// Remaining accounts expected (in order):
/// 0. owner_token account
/// 1. treasury_token account
/// 2. token_vault account
#[derive(Accounts)]
pub struct ClosePosition<'info> {
    #[account(mut)]
    pub matcher: Signer<'info>,

    #[account(
        mut,
        seeds = [ORDER_SEED, order.owner.as_ref(), &order.order_id.to_le_bytes()],
        bump = order.bump,
        constraint = order.status as u8 == OrderStatus::Pending as u8 @ PerpetualsError::OrderAlreadyProcessed,
        constraint = order.action as u8 == OrderAction::Close as u8 @ PerpetualsError::InvalidOrderAction,
        constraint = order.target_position.is_some() @ PerpetualsError::InvalidTargetPosition,
        close = matcher
    )]
    pub order: Box<Account<'info, Order>>,

    #[account(
        mut,
        seeds = [POSITION_SEED, position.owner.as_ref(), &position.position_id.to_le_bytes()],
        bump = position.bump,
        constraint = position.owner == order.owner @ PerpetualsError::Unauthorized,
        constraint = position.status as u8 == PositionStatus::Open as u8 @ PerpetualsError::PositionAlreadyClosed,
        close = matcher,
    )]
    pub position: Box<Account<'info, Position>>,

    /// CHECK: Position owner, for token transfers
    /// TODO: sidduHERE why is this unchecked?
    pub position_owner: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [FUNDING_INDEX_SEED, position.baskt_id.as_ref()],
        bump = funding_index.bump
    )]
    pub funding_index: Account<'info, FundingIndex>,

    #[account(
        constraint = baskt.key() == position.baskt_id @ PerpetualsError::InvalidBaskt,
        constraint = baskt.is_active @ PerpetualsError::BasktInactive
    )]
    pub baskt: Box<Account<'info, BasktV1>>,

    /// Protocol for permission checks
    #[account(
        constraint = protocol.feature_flags.allow_close_position && protocol.feature_flags.allow_trading @ PerpetualsError::PositionOperationsDisabled,
        constraint = protocol.has_permission(matcher.key(), Role::Matcher) @ PerpetualsError::Unauthorized,
        seeds = [PROTOCOL_SEED],
        bump
    )]
    pub protocol: Box<Account<'info, Protocol>>,

    #[account(
        mut,
        seeds = [LIQUIDITY_POOL_SEED],
        bump = liquidity_pool.bump
    )]
    pub liquidity_pool: Box<Account<'info, LiquidityPool>>,

    /// CHECK: Validated via protocol constraint
    #[account(
        constraint = treasury.key() == protocol.treasury @ PerpetualsError::Unauthorized
    )]
    pub treasury: UncheckedAccount<'info>,

    /// Position escrow token account
    #[account(
        mut,
        seeds = [ESCROW_SEED, position.key().as_ref()],
        bump,
        constraint = escrow_token.mint == protocol.escrow_mint @ PerpetualsError::InvalidMint,
        constraint = escrow_token.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = escrow_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = escrow_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    /// PDA used for token authority over escrow - still needed for CPI signing
    #[account(
        seeds = [AUTHORITY_SEED],
        bump,
    )]
    pub program_authority: Account<'info, ProgramAuthority>,

    /// CHECK: PDA authority for token_vault - validated via protocol
    #[account(
        seeds = [POOL_AUTHORITY_SEED, liquidity_pool.key().as_ref(), protocol.key().as_ref()],
        bump,
    )]
    pub pool_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn close_position<'info>(
    ctx: Context<'_, '_, 'info, 'info, ClosePosition<'info>>,
    params: ClosePositionParams,
) -> Result<()> {
    let order = &ctx.accounts.order;
    let position = &mut ctx.accounts.position;
    let funding_index = &ctx.accounts.funding_index;
    let clock = Clock::get()?;

    // Validate target position
    let target_pos_key = order
        .target_position
        .ok_or(PerpetualsError::InvalidTargetPosition)?;
    require_keys_eq!(
        target_pos_key,
        position.key(),
        PerpetualsError::InvalidTargetPosition
    );

    // Validate oracle price
    ctx.accounts
        .baskt
        .oracle
        .validate_execution_price(params.exit_price, clock.unix_timestamp)?;

    // Settle position
    position.settle_close(
        params.exit_price,
        funding_index.cumulative_index,
        clock.unix_timestamp,
    )?;

    // Calculate amounts
    let pnl = position.calculate_pnl()?;
    let funding_amount = position.funding_accumulated;
    let closing_fee = (position.size as u128)
        .checked_mul(CLOSING_FEE_BPS as u128)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_div(BPS_DIVISOR as u128)
        .ok_or(PerpetualsError::MathOverflow)? as u64;

    // Parse remaining accounts
    // TODO: sidduHERE why are these remaining accounts and not simple context accounts
    let remaining_accounts = ClosePositionRemainingAccounts::parse(ctx.remaining_accounts)?;

    // Signer seeds
    let authority_signer_seeds = [AUTHORITY_SEED.as_ref(), &[ctx.bumps.program_authority]];
    let authority_signer = &[&authority_signer_seeds[..]];

    // Pool authority signer seeds
    let lp_key = ctx.accounts.liquidity_pool.key();
    let proto_key = ctx.accounts.protocol.key();
    let pool_authority_signer_seeds = [
        POOL_AUTHORITY_SEED.as_ref(),
        lp_key.as_ref(),
        proto_key.as_ref(),
        &[ctx.bumps.pool_authority],
    ];
    let pool_authority_signer = &[&pool_authority_signer_seeds[..]];

    // 1. Calculate user's total gross payout
    let total_gross_to_user_i128 = (position.collateral as i128)
        .checked_add(pnl as i128)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_add(funding_amount)
        .ok_or(PerpetualsError::MathOverflow)?;

    // 2. Calculate user's net payout after fee
    let user_total_payout_u64: u64;
    let fee_amount: u64;

    if total_gross_to_user_i128 > 0 {
        let gross_payout = total_gross_to_user_i128 as u64;
        fee_amount = std::cmp::min(closing_fee, gross_payout);
        user_total_payout_u64 = gross_payout.saturating_sub(fee_amount);
    } else {
        user_total_payout_u64 = 0;
        fee_amount = closing_fee;
    }

    let initial_escrow_balance = ctx.accounts.escrow_token.amount;
    let mut current_escrow_balance = initial_escrow_balance;

    // 3. Transfer fee to treasury first
    if fee_amount > 0 && fee_amount <= current_escrow_balance {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token.to_account_info(),
                    to: remaining_accounts.treasury_token.clone(),
                    authority: ctx.accounts.program_authority.to_account_info(),
                },
                authority_signer,
            ),
            fee_amount,
        )?;
        current_escrow_balance = current_escrow_balance
            .checked_sub(fee_amount)
            .ok_or(PerpetualsError::MathOverflow)?;
    }

    // 4. Determine amounts from escrow for user payout
    let payout_from_escrow_to_user = std::cmp::min(user_total_payout_u64, current_escrow_balance);

    if payout_from_escrow_to_user > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token.to_account_info(),
                    to: remaining_accounts.owner_token.clone(),
                    authority: ctx.accounts.program_authority.to_account_info(),
                },
                authority_signer,
            ),
            payout_from_escrow_to_user,
        )?;
        current_escrow_balance = current_escrow_balance
            .checked_sub(payout_from_escrow_to_user)
            .ok_or(PerpetualsError::MathOverflow)?;
    }

    // Amount user still needs from pool
    let payout_from_pool_to_user = user_total_payout_u64
        .checked_sub(payout_from_escrow_to_user)
        .ok_or(PerpetualsError::MathOverflow)?;

    let final_escrow_remainder_to_pool_vault = current_escrow_balance;

    // 4a. Pool pays user if necessary
    if payout_from_pool_to_user > 0 {
        require!(
            ctx.accounts.liquidity_pool.total_liquidity >= payout_from_pool_to_user,
            PerpetualsError::InsufficientLiquidity
        );

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: remaining_accounts.token_vault.clone(),
                    to: remaining_accounts.owner_token.clone(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
                pool_authority_signer,
            ),
            payout_from_pool_to_user,
        )?;
    }

    // 4b. Remaining escrow funds to pool
    if final_escrow_remainder_to_pool_vault > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token.to_account_info(),
                    to: remaining_accounts.token_vault.clone(),
                    authority: ctx.accounts.program_authority.to_account_info(),
                },
                authority_signer,
            ),
            final_escrow_remainder_to_pool_vault,
        )?;
    }

    // 5. Update Liquidity Pool state
    let net_change_for_lp_state_i128 = (final_escrow_remainder_to_pool_vault as i128)
        .checked_sub(payout_from_pool_to_user as i128)
        .ok_or(PerpetualsError::MathOverflow)?;

    if net_change_for_lp_state_i128 > 0 {
        ctx.accounts
            .liquidity_pool
            .increase_liquidity(net_change_for_lp_state_i128 as u64)?;
    } else if net_change_for_lp_state_i128 < 0 {
        ctx.accounts.liquidity_pool.decrease_liquidity(
            net_change_for_lp_state_i128
                .unsigned_abs()
                .try_into()
                .map_err(|_| PerpetualsError::MathOverflow)?,
        )?;
    }

    // Close escrow token account
    token::close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.escrow_token.to_account_info(),
            destination: ctx.accounts.matcher.to_account_info(),
            authority: ctx.accounts.program_authority.to_account_info(),
        },
        authority_signer,
    ))?;

    // Emit event
    emit!(PositionClosedEvent {
        owner: position.owner,
        position_id: position.position_id,
        baskt_id: position.baskt_id.key(),
        size: position.size,
        exit_price: params.exit_price,
        pnl,
        fee_amount,
        funding_payment: funding_amount,
        settlement_amount: user_total_payout_u64,
        pool_payout: payout_from_pool_to_user,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
