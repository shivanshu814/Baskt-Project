use {
    crate::constants::{
        AUTHORITY_SEED, ESCROW_SEED, FUNDING_INDEX_SEED, LIQUIDITY_POOL_SEED, ORDER_SEED,
        POOL_AUTHORITY_SEED, POSITION_SEED, PROTOCOL_SEED,
    },
    crate::error::PerpetualsError,
    crate::events::*,
    crate::state::{
        baskt::Baskt,
        funding_index::FundingIndex,
        liquidity::LiquidityPool,
        order::{Order, OrderAction, OrderStatus},
        position::{Position, PositionStatus, ProgramAuthority},
        protocol::{Protocol, Role},
    },
    crate::utils::{
        calculate_settlement, effective_u64, execute_settlement_transfers, update_pool_state,
        validate_treasury_and_vault, ClosingType, TransferParams,
    },
    anchor_lang::prelude::*,
    anchor_spl::token::{self, CloseAccount, Token, TokenAccount},
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

    #[account(
        mut,
        seeds = [FUNDING_INDEX_SEED, position.baskt_id.as_ref()],
        bump = funding_index.bump
    )]
    pub funding_index: Account<'info, FundingIndex>,

    #[account(
        mut,
        constraint = baskt.key() == position.baskt_id @ PerpetualsError::InvalidBaskt,
        constraint = baskt.is_trading() || baskt.is_unwinding() @ PerpetualsError::InvalidBasktState
    )]
    pub baskt: Box<Account<'info, Baskt>>,

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
        .validate_execution_price(params.exit_price)?;

    // Settle position
    position.settle_close(
        params.exit_price,
        funding_index.cumulative_index,
        clock.unix_timestamp,
    )?;

    // Decrement open positions count
    ctx.accounts.baskt.open_positions = ctx
        .accounts
        .baskt
        .open_positions
        .checked_sub(1)
        .ok_or(PerpetualsError::MathOverflow)?; // prevent silent underflow

    // Calculate amounts
    let pnl = position.calculate_pnl()?;

    // Parse remaining accounts
    let remaining_accounts = ClosePositionRemainingAccounts::parse(ctx.remaining_accounts)?;

    // Validate remaining accounts for security
    remaining_accounts.validate(&ctx.accounts.protocol, &ctx.accounts.liquidity_pool)?;

    // Get effective closing fee from baskt config or protocol config
    let closing_fee_bps = effective_u64(
        ctx.accounts.baskt.config.closing_fee_bps,
        ctx.accounts.protocol.config.closing_fee_bps,
    );

    // Calculate settlement details
    let settlement_details = calculate_settlement(
        position,
        pnl,
        ClosingType::Normal { closing_fee_bps },
        ctx.accounts.protocol.config.treasury_cut_bps,
        params.exit_price,
    )?;

    // Prepare transfer parameters
    let transfer_params = TransferParams {
        escrow_balance: ctx.accounts.escrow_token.amount,
        authority_bump: ctx.bumps.program_authority,
        pool_authority_bump: ctx.bumps.pool_authority,
    };

    // Execute all settlement transfers
    let transfer_result = execute_settlement_transfers(
        &ctx.accounts.token_program,
        &ctx.accounts.escrow_token,
        &remaining_accounts.owner_token,
        Some(&remaining_accounts.treasury_token),
        &remaining_accounts.token_vault,
        &ctx.accounts.program_authority.to_account_info(),
        &ctx.accounts.pool_authority.to_account_info(),
        ctx.accounts.liquidity_pool.key(),
        ctx.accounts.protocol.key(),
        &transfer_params,
        &settlement_details,
    )?;

    // Update liquidity pool state using actual transferred amounts
    update_pool_state(
        &mut ctx.accounts.liquidity_pool,
        &transfer_result,
        0, // No bad debt in normal close
    )?;

    // Close escrow token account
    let authority_signer_seeds = [AUTHORITY_SEED.as_ref(), &[ctx.bumps.program_authority]];
    let authority_signer = &[&authority_signer_seeds[..]];

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
        order_id: order.order_id,
        owner: position.owner,
        position_id: position.position_id,
        baskt_id: position.baskt_id.key(),
        size: position.size,
        exit_price: params.exit_price,
        pnl: settlement_details.pnl as i64,
        fee_to_treasury: transfer_result.actual_fee_to_treasury,
        fee_to_blp: transfer_result.actual_fee_to_blp,
        funding_payment: settlement_details.funding_accumulated,
        settlement_amount: settlement_details.user_payout_u64,
        pool_payout: transfer_result.from_pool_to_user,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
