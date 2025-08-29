use {
    crate::constants::{
        AUTHORITY_SEED, ESCROW_SEED, LIQUIDITY_POOL_SEED, ORDER_SEED, POOL_AUTHORITY_SEED,
        POSITION_SEED, PROTOCOL_SEED,
    },
    crate::error::PerpetualsError,
    crate::events::*,
    crate::state::{
        baskt::Baskt,
        liquidity::LiquidityPool,
        order::{Order, OrderAction, OrderStatus},
        position::{Position, PositionStatus, ProgramAuthority},
        protocol::{Protocol, Role},
    },
    crate::utils::{
        effective_u64, execute_settlement_transfers, update_pool_state,
        ClosingType, TransferParams, close_account, close_escrow_account, calculate_position_settlement, update_position_after_settlement,
    },
    anchor_lang::prelude::*,
    anchor_spl::token::{self, Token, TokenAccount},
};

/// Parameters for closing a position
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct ClosePositionParams {
    pub exit_price: u64,
    pub size_to_close: Option<u64>, // None = full close, Some(size) = partial close
}

/// ClosePosition
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
        close = order_owner
    )]
    pub order: Box<Account<'info, Order>>,

    /// CHECK: Order owner for return rent to owner
    #[account(
        mut,
        constraint = order_owner.key() == order.owner @ PerpetualsError::InvalidInput
    )]
    pub order_owner: UncheckedAccount<'info>,


    #[account(
        mut,
        seeds = [POSITION_SEED, position.owner.as_ref(), &position.position_id.to_le_bytes()],
        bump = position.bump,
        constraint = position.owner == order.owner @ PerpetualsError::Unauthorized,
        constraint = position.status as u8 == PositionStatus::Open as u8 @ PerpetualsError::PositionAlreadyClosed,
    )]
    pub position: Box<Account<'info, Position>>,

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
        constraint = owner_collateral_escrow_account.mint == protocol.collateral_mint @ PerpetualsError::InvalidMint,
        constraint = owner_collateral_escrow_account.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = owner_collateral_escrow_account.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = owner_collateral_escrow_account.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub owner_collateral_escrow_account: Account<'info, TokenAccount>,

    /// User's collateral token account to receive settlement
    #[account(
        mut,
        constraint = owner_collateral_account.mint == protocol.collateral_mint @ PerpetualsError::InvalidMint,
        constraint = owner_collateral_account.owner == position.owner @ PerpetualsError::Unauthorized
    )]
    pub owner_collateral_account: Account<'info, TokenAccount>,

    /// Protocol treasury token account for fee collection
    #[account(
        mut,
        constraint = treasury_token.mint == protocol.collateral_mint @ PerpetualsError::InvalidMint,
        constraint = treasury_token.owner == protocol.treasury @ PerpetualsError::InvalidTreasuryAccount,
        constraint = treasury_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = treasury_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub treasury_token: Account<'info, TokenAccount>,

    /// BLP token vault for liquidity pool fees
    #[account(
        mut,
        constraint = usdc_vault.key() == liquidity_pool.usdc_vault @ PerpetualsError::InvalidUsdcVault,
        constraint = usdc_vault.mint == protocol.collateral_mint @ PerpetualsError::InvalidMint,
        constraint = treasury_token.key() != usdc_vault.key() @ PerpetualsError::InvalidInput,
        constraint = owner_collateral_account.key() != usdc_vault.key() @ PerpetualsError::InvalidInput,
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    /// PDA used for token authority over escrow - still needed for CPI signing
    #[account(
        seeds = [AUTHORITY_SEED],
        bump,
    )]
    pub program_authority: Account<'info, ProgramAuthority>,

    /// CHECK: PDA authority for usdc_vault - validated via protocol
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
    let market_indices = &ctx.accounts.baskt.market_indices;
    let clock = Clock::get()?;


    let close_params = order.get_close_params()?;

    let size_to_close = params.size_to_close.unwrap_or(close_params.size_as_contracts);

    require!(size_to_close > 0, PerpetualsError::InvalidPositionSize);
    require!(size_to_close <= position.size, PerpetualsError::InvalidPositionSize);

    
    order.validate_execution_price(params.exit_price)?;

    // Validate target position
    let target_pos_key = order.get_close_params()?.target_position;

    require_keys_eq!(
        target_pos_key,
        position.key(),
        PerpetualsError::InvalidTargetPosition
    );

    // Update both funding and borrow indices for the full position first
    position.update_market_indices(
        market_indices.cumulative_funding_index,
        market_indices.cumulative_borrow_index,
        params.exit_price
    )?;

    // Apply rebalance fee to position
    let rebalance_fee_owed = position.apply_rebalance_fee(ctx.accounts.baskt.rebalance_fee_index.cumulative_index, params.exit_price)?;

    let is_full_close = size_to_close == position.size;

    // Get effective closing fee from baskt config or protocol config
    let closing_fee_bps = effective_u64(
        ctx.accounts.baskt.config.get_closing_fee_bps(),
        ctx.accounts.protocol.config.closing_fee_bps,
    );

    // Calculate settlement details using shared utility
    let settlement_details = calculate_position_settlement(
        position,
        size_to_close,
        params.exit_price,
        ClosingType::Normal { closing_fee_bps },
        ctx.accounts.protocol.config.treasury_cut_bps,
        rebalance_fee_owed,
    )?;

    execute_settlement_transfers(
        &ctx.accounts.token_program,
        &ctx.accounts.owner_collateral_escrow_account,
        &ctx.accounts.owner_collateral_account.to_account_info(),
        Some(&ctx.accounts.treasury_token.to_account_info()),
        &ctx.accounts.usdc_vault.to_account_info(),
        &ctx.accounts.program_authority.to_account_info(),
        &ctx.accounts.pool_authority.to_account_info(),
        ctx.accounts.liquidity_pool.key(),
        ctx.accounts.protocol.key(),
        &TransferParams {
            escrow_balance: ctx.accounts.owner_collateral_escrow_account.amount,
            authority_bump: ctx.bumps.program_authority,
            pool_authority_bump: ctx.bumps.pool_authority,
        },
        &settlement_details
    )?;

    // Update pool state using actual transferred amounts
    update_pool_state(
        &mut ctx.accounts.liquidity_pool,
        &settlement_details,
    )?;

    // Update position state after settlement
    update_position_after_settlement(
        position,
        size_to_close,
        settlement_details.collateral_to_release,
    )?;

    emit!(PositionClosedEvent {
        order_id: order.order_id as u64,
        position_id: position.position_id as u64,
        owner: position.owner,
        baskt_id: position.baskt_id.key(),
        size_closed: size_to_close,
        size_remaining: position.size,
        exit_price: params.exit_price,
        timestamp: clock.unix_timestamp,
        collateral_remaining: position.collateral,
        // Settlement details
        fee_to_treasury: settlement_details.fee_to_treasury,
        fee_to_blp: settlement_details.fee_to_blp,
        pnl: settlement_details.pnl,
        funding_accumulated: settlement_details.funding_accumulated,
        borrow_accumulated: settlement_details.borrow_accumulated,
        escrow_to_treasury: settlement_details.escrow_to_treasury,
        escrow_to_pool: settlement_details.escrow_to_pool,
        escrow_to_user: settlement_details.escrow_to_user,
        pool_to_user: settlement_details.pool_to_user,
        user_total_payout: settlement_details.user_payout_u64,
        base_fee: settlement_details.base_fee,
        rebalance_fee: settlement_details.rebalance_fee,
        bad_debt_amount: settlement_details.bad_debt_amount,
        collateral_released: settlement_details.collateral_to_release,
    });

    // Handle instruction-specific logic (account closing, event emission)
    if is_full_close {
        // Decrement open positions count
        ctx.accounts.baskt.open_positions = ctx
            .accounts
            .baskt
            .open_positions
            .checked_sub(1)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Close escrow token account
        close_escrow_account(
            &ctx.accounts.token_program,
            &ctx.accounts.owner_collateral_escrow_account,
            &ctx.accounts.matcher.to_account_info(),
            &ctx.accounts.program_authority.to_account_info(),
            ctx.bumps.program_authority,
        )?;

        // Close position account manually since we removed the close attribute
        close_account(&ctx.accounts.position.to_account_info(), &ctx.accounts.matcher.to_account_info())?;
  
    }
 

    Ok(())
}
