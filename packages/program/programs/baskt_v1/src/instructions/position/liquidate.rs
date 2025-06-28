use {
    crate::constants::{
        AUTHORITY_SEED, ESCROW_SEED, FUNDING_INDEX_SEED, LIQUIDITY_POOL_SEED, POOL_AUTHORITY_SEED,
        POSITION_SEED, PROTOCOL_SEED,
    },
    crate::error::PerpetualsError,
    crate::events::*,
    crate::state::{
        baskt::Baskt,
        funding_index::FundingIndex,
        liquidity::LiquidityPool,
        position::{Position, PositionStatus, ProgramAuthority},
        protocol::{Protocol, Role},
    },
    crate::utils::{
        calculate_settlement, close_escrow_account, effective_u64, execute_settlement_transfers,
        update_pool_state, validate_treasury_and_vault, ClosingType, TransferParams,
    },
    anchor_lang::prelude::*,
    anchor_spl::token::{Token, TokenAccount},
};

/// Parameters for liquidating a position
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct LiquidatePositionParams {
    pub exit_price: u64,
}

/// Wrapper for remaining accounts to improve readability
pub struct LiquidatePositionRemainingAccounts<'info> {
    /// CHECK: owner token account, needs to be mapped to position owner
    pub owner_token: &'info AccountInfo<'info>,
    /// CHECK: treasury token account, needs to be mapped to protocol treasury
    pub treasury_token: &'info AccountInfo<'info>,
    /// CHECK: token vault account, needs to be mapped to liquidity pool vault
    pub token_vault: &'info AccountInfo<'info>,
}

impl<'info> LiquidatePositionRemainingAccounts<'info> {
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

/// LiquidatePosition
///
/// Remaining accounts expected (in order):
/// 0. owner_token account
/// 1. treasury_token account
/// 2. token_vault account
///
#[derive(Accounts)]
pub struct LiquidatePosition<'info> {
    #[account(mut)]
    pub liquidator: Signer<'info>,

    #[account(
        mut,
        seeds = [POSITION_SEED, position.owner.as_ref(), &position.position_id.to_le_bytes()],
        bump = position.bump,
        constraint = position.status as u8 == PositionStatus::Open as u8 @ PerpetualsError::PositionAlreadyClosed,
        close = liquidator,
    )]
    pub position: Account<'info, Position>,

    /// CHECK: Position owner, for token transfers
    pub position_owner: UncheckedAccount<'info>,

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
    pub baskt: Account<'info, Baskt>,

    /// Protocol for permission checks
    #[account(
        constraint = protocol.feature_flags.allow_liquidations @ PerpetualsError::PositionOperationsDisabled,
        constraint = protocol.has_permission(liquidator.key(), Role::Liquidator) @ PerpetualsError::Unauthorized,
        seeds = [PROTOCOL_SEED],
        bump
    )]
    pub protocol: Box<Account<'info, Protocol>>,

    /// Liquidity pool
    #[account(
        mut,
        seeds = [LIQUIDITY_POOL_SEED],
        bump = liquidity_pool.bump
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    /// CHECK Treasury account
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

    /// PDA used for token authority over escrow
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

pub fn liquidate_position<'info>(
    ctx: Context<'_, '_, 'info, 'info, LiquidatePosition<'info>>,
    params: LiquidatePositionParams,
) -> Result<()> {
    let position = &mut ctx.accounts.position;
    let funding_index = &ctx.accounts.funding_index;
    let clock = Clock::get()?;

    // Validate liquidation price
    ctx.accounts
        .baskt
        .oracle
        .validate_liquidation_price(params.exit_price)?;

    // Update funding first
    position.update_funding(funding_index.cumulative_index)?;

    // Get effective liquidation threshold from baskt config or protocol config
    let liquidation_threshold_bps = effective_u64(
        ctx.accounts.baskt.config.liquidation_threshold_bps,
        ctx.accounts.protocol.config.liquidation_threshold_bps,
    );

    // Check if position is liquidatable
    let is_liquidatable = position.is_liquidatable(params.exit_price, liquidation_threshold_bps)?;
    require!(is_liquidatable, PerpetualsError::PositionNotLiquidatable);

    // Liquidate the position
    position.liquidate(
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

    // Get effective liquidation fee from baskt config or protocol config
    let liquidation_fee_bps = effective_u64(
        ctx.accounts.baskt.config.liquidation_fee_bps,
        ctx.accounts.protocol.config.liquidation_fee_bps,
    );

    // Calculate settlement details using the new unified approach
    let settlement_details = calculate_settlement(
        position,
        pnl,
        ClosingType::Liquidation {
            liquidation_fee_bps,
        },
        ctx.accounts.protocol.config.treasury_cut_bps,
        params.exit_price,
    )?;

    // Parse remaining accounts
    let remaining_accounts = LiquidatePositionRemainingAccounts::parse(ctx.remaining_accounts)?;

    // Validate remaining accounts for security
    remaining_accounts.validate(&ctx.accounts.protocol, &ctx.accounts.liquidity_pool)?;

    // Prepare transfer parameters
    let transfer_params = TransferParams {
        escrow_balance: ctx.accounts.escrow_token.amount,
        authority_bump: ctx.bumps.program_authority,
        pool_authority_bump: ctx.bumps.pool_authority,
    };

    // Execute all settlement transfers using the unified approach
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
        settlement_details.bad_debt_amount,
    )?;

    // Close escrow token account to reclaim rent
    close_escrow_account(
        &ctx.accounts.token_program,
        &ctx.accounts.escrow_token,
        &ctx.accounts.liquidator.to_account_info(),
        &ctx.accounts.program_authority.to_account_info(),
        ctx.bumps.program_authority,
    )?;

    // Position is closed automatically via constraint

    // Emit event
    emit!(PositionLiquidatedEvent {
        owner: position.owner,
        position_id: position.position_id,
        baskt_id: position.baskt_id,
        size: position.size,
        exit_price: params.exit_price,
        pnl: settlement_details.pnl as i64,
        fee_to_treasury: transfer_result.actual_fee_to_treasury,
        fee_to_blp: transfer_result.actual_fee_to_blp,
        funding_payment: settlement_details.funding_accumulated,
        remaining_collateral: settlement_details.user_payout_u64,
        pool_payout: transfer_result.from_pool_to_user,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
