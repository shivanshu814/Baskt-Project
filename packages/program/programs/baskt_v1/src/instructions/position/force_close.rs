use crate::constants::{
    AUTHORITY_SEED, BASKT_SEED, BPS_DIVISOR, ESCROW_SEED, LIQUIDITY_POOL_SEED, POOL_AUTHORITY_SEED,
    POSITION_SEED, PROTOCOL_SEED,
};
use crate::error::PerpetualsError;
use crate::events::*;
use crate::math::mul_div_u64;
use crate::state::baskt::{BasktStatus, Baskt};
use crate::state::liquidity::LiquidityPool;
use crate::state::position::{Position, PositionStatus, ProgramAuthority};
use crate::state::protocol::{Protocol, Role};
use crate::utils::position_utils::{
    calculate_settlement, close_escrow_account, execute_settlement_transfers, update_pool_state,
    ClosingType, TransferParams,
};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;
use anchor_spl::token::{Token, TokenAccount};

/// Helper function to get baskt name seed
fn get_baskt_name_seed(baskt_name: &str) -> [u8; 32] {
    keccak::hash(baskt_name.as_bytes()).to_bytes()
}

/// Force close a position at settlement price after baskt settlement
#[derive(Accounts)]
pub struct ForceClosePosition<'info> {
    /// OracleManager who can force close positions
    #[account(
        constraint = protocol.has_permission(authority.key(), Role::OracleManager)
            @ PerpetualsError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [POSITION_SEED, position.owner.as_ref(), &position.position_id.to_le_bytes()],
        bump = position.bump,
        constraint = position.status == PositionStatus::Open @ PerpetualsError::PositionAlreadyClosed,
        constraint = position.baskt_id == baskt.key() @ PerpetualsError::InvalidBaskt,
        close = authority, // Authority gets the rent
    )]
    pub position: Box<Account<'info, Position>>,

    #[account(
        mut,
        seeds = [BASKT_SEED, &get_baskt_name_seed(&baskt.baskt_name)[..]],
        bump = baskt.bump,
        constraint = matches!(baskt.status, BasktStatus::Settled { .. }) @ PerpetualsError::BasktNotSettled,
    )]
    pub baskt: Box<Account<'info, Baskt>>,

    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Box<Account<'info, Protocol>>,

    /// Liquidity pool to update state
    #[account(
        mut,
        seeds = [LIQUIDITY_POOL_SEED],
        bump = liquidity_pool.bump
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    /// Position escrow token account
    #[account(
        mut,
        seeds = [ESCROW_SEED, position.key().as_ref()],
        bump,
        constraint = escrow_token.mint == protocol.escrow_mint @ PerpetualsError::InvalidMint,
        constraint = escrow_token.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority,
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    /// Program authority PDA
    #[account(
        seeds = [AUTHORITY_SEED],
        bump,
    )]
    pub program_authority: Account<'info, ProgramAuthority>,

    /// CHECK: Pool authority PDA for transfers from pool vault
    #[account(
        seeds = [POOL_AUTHORITY_SEED, liquidity_pool.key().as_ref(), protocol.key().as_ref()],
        bump,
    )]
    pub pool_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

/// Parameters for force closing a position
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ForceClosePositionParams {
    /// Price to use for closing the position
    pub close_price: u64,
}

/// Wrapper for remaining accounts used in force close
pub struct ForceCloseRemainingAccounts<'info> {
    /// CHECK: owner token account
    pub owner_token: &'info AccountInfo<'info>,
    /// CHECK: token vault account
    pub token_vault: &'info AccountInfo<'info>,
}

impl<'info> ForceCloseRemainingAccounts<'info> {
    pub fn parse(remaining_accounts: &'info [AccountInfo<'info>]) -> Result<Self> {
        require!(
            remaining_accounts.len() >= 2,
            PerpetualsError::InvalidAccountInput
        );

        Ok(Self {
            owner_token: &remaining_accounts[0],
            token_vault: &remaining_accounts[1],
        })
    }
}

pub fn force_close_position<'info>(
    ctx: Context<'_, '_, 'info, 'info, ForceClosePosition<'info>>,
    params: ForceClosePositionParams,
) -> Result<()> {
    let baskt = &mut ctx.accounts.baskt;
    let position = &mut ctx.accounts.position;
    let liquidity_pool = &mut ctx.accounts.liquidity_pool;
    let clock = Clock::get()?;

    // Parse remaining accounts
    let remaining_accounts = ForceCloseRemainingAccounts::parse(ctx.remaining_accounts)?;

    // Extract settled values from baskt status
    let (settlement_price, settlement_funding_index, settled_at) = match baskt.status {
        BasktStatus::Settled {
            settlement_price,
            settlement_funding_index,
            settled_at,
            ..
        } => (settlement_price, settlement_funding_index, settled_at),
        _ => return err!(PerpetualsError::BasktNotSettled),
    };

    // Validate close price is within reasonable deviation from settlement price (1%)
    let price_diff = params.close_price.abs_diff(settlement_price);
    let price_deviation = mul_div_u64(price_diff, BPS_DIVISOR, settlement_price)?;
    require!(
        price_deviation <= 100, // 1% = 100 basis points
        PerpetualsError::PriceDeviationTooHigh
    );

    // Update position funding to settlement index
    position.update_funding(settlement_funding_index)?;

    // Set exit price and calculate PnL
    position.exit_price = Some(params.close_price);
    let pnl = position.calculate_pnl()?;

    // Calculate settlement using existing utility
    let settlement_details = calculate_settlement(
        position,
        pnl,
        ClosingType::ForceSettlement, // No fees
        0, // treasury_cut_bps doesn't matter for force settlement (no fees)
        params.close_price,
    )?;

    // Get escrow balance
    let escrow_balance = ctx.accounts.escrow_token.amount;

    // Execute transfers using existing utility
    let transfer_result = execute_settlement_transfers(
        &ctx.accounts.token_program,
        &ctx.accounts.escrow_token,
        remaining_accounts.owner_token,
        None, // No treasury for force close
        remaining_accounts.token_vault,
        &ctx.accounts.program_authority.to_account_info(),
        &ctx.accounts.pool_authority.to_account_info(),
        liquidity_pool.key(),
        ctx.accounts.protocol.key(),
        &TransferParams {
            escrow_balance,
            authority_bump: ctx.bumps.program_authority,
            pool_authority_bump: ctx.bumps.pool_authority,
        },
        &settlement_details,
    )?;

    // Update pool state using existing utility
    update_pool_state(
        liquidity_pool,
        &transfer_result,
        settlement_details.bad_debt_amount,
    )?;

    // Close escrow token account to reclaim rent
    close_escrow_account(
        &ctx.accounts.token_program,
        &ctx.accounts.escrow_token,
        &ctx.accounts.authority.to_account_info(),
        &ctx.accounts.program_authority.to_account_info(),
        ctx.bumps.program_authority,
    )?;

    // Calculate position duration
    let position_duration = clock.unix_timestamp.saturating_sub(position.timestamp_open);

    // Update position status
    position.status = PositionStatus::ForceClosed;
    position.timestamp_close = Some(clock.unix_timestamp);

    // Update baskt position count
    baskt.open_positions = baskt
        .open_positions
        .checked_sub(1)
        .ok_or(PerpetualsError::MathOverflow)?; // prevent silent underflow

    // Emit comprehensive event
    emit!(PositionForceClosed {
        baskt: baskt.key(),
        position: position.key(),
        owner: position.owner,
        settlement_price,
        close_price: params.close_price,
        entry_price: position.entry_price,
        size: position.size,
        is_long: position.is_long,
        collateral_returned: settlement_details.user_payout_u64,
        pnl,
        funding_payment: position.funding_accumulated,
        closed_by: ctx.accounts.authority.key(),
        // Enhanced fields
        timestamp: clock.unix_timestamp,
        escrow_returned_to_pool: transfer_result.escrow_to_pool,
        pool_payout: transfer_result.from_pool_to_user,
        bad_debt_absorbed: settlement_details.bad_debt_amount,
        baskt_settlement_timestamp: settled_at,
        position_duration_seconds: position_duration,
    });

    Ok(())
}
