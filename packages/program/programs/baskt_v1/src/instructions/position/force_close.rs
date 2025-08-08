use crate::constants::{
    AUTHORITY_SEED, BASKT_SEED, ESCROW_SEED, LIQUIDITY_POOL_SEED, POOL_AUTHORITY_SEED,
    POSITION_SEED, PROTOCOL_SEED,
};
use crate::error::PerpetualsError;
use crate::events::*;
use crate::state::baskt::{Baskt, BasktStatus};
use crate::state::liquidity::LiquidityPool;
use crate::state::position::{Position, PositionStatus, ProgramAuthority};
use crate::state::protocol::{Protocol, Role};
use crate::utils::{
    position_utils::{
        close_escrow_account, execute_settlement_transfers,
        update_pool_state, calculate_position_settlement, update_position_after_settlement, ClosingType, TransferParams,
    },
    effective_u64, close_account,
};
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

/// Force close a position at settlement price after baskt settlement
#[derive(Accounts)]
pub struct ForceClosePosition<'info> {
    #[account(
        constraint = protocol.has_permission(authority.key(), Role::Matcher)
            @ PerpetualsError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [POSITION_SEED, position.owner.as_ref(), &position.position_id.to_le_bytes()],
        bump = position.bump,
        constraint = position.status == PositionStatus::Open @ PerpetualsError::PositionAlreadyClosed,
        constraint = position.baskt_id == baskt.key() @ PerpetualsError::InvalidBaskt,
    )]
    pub position: Box<Account<'info, Position>>,

    #[account(
        mut,
        seeds = [BASKT_SEED, &baskt.uid.to_le_bytes()],
        bump = baskt.bump,
        constraint = matches!(baskt.status, BasktStatus::Decommissioning { .. }) @ PerpetualsError::PositionsStillOpen,
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
        constraint = owner_collateral_escrow_account.mint == protocol.collateral_mint @ PerpetualsError::InvalidMint,
        constraint = owner_collateral_escrow_account.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority,
    )]
    pub owner_collateral_escrow_account: Account<'info, TokenAccount>,

    /// User's collateral token account to receive settlement
    #[account(
        mut,
        constraint = owner_collateral_account.mint == protocol.collateral_mint @ PerpetualsError::InvalidMint,
        constraint = owner_collateral_account.owner == position.owner @ PerpetualsError::Unauthorized
    )]
    pub owner_collateral_account: Account<'info, TokenAccount>,

    /// BLP token vault for liquidity pool
    #[account(
        mut,
        constraint = usdc_vault.key() == liquidity_pool.usdc_vault @ PerpetualsError::InvalidUsdcVault,
        constraint = usdc_vault.mint == protocol.collateral_mint @ PerpetualsError::InvalidMint,
        constraint = owner_collateral_account.key() != usdc_vault.key() @ PerpetualsError::InvalidInput
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    /// Protocol treasury token account for fee collection
    #[account(
        mut,
        constraint = treasury_token.mint == protocol.collateral_mint @ PerpetualsError::InvalidMint,
        constraint = treasury_token.owner == protocol.treasury @ PerpetualsError::InvalidTreasuryAccount,
        constraint = treasury_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = treasury_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority,
        constraint = treasury_token.key() != usdc_vault.key() @ PerpetualsError::InvalidInput,
        constraint = treasury_token.key() != owner_collateral_account.key() @ PerpetualsError::InvalidInput
    )]
    pub treasury_token: Account<'info, TokenAccount>,

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
    pub size_to_close: Option<u64>, // None = full close, Some(size) = partial close
}

pub fn force_close_position<'info>(
    ctx: Context<'_, '_, 'info, 'info, ForceClosePosition<'info>>,
    params: ForceClosePositionParams,
) -> Result<()> {
    let baskt = &mut ctx.accounts.baskt;
    let position = &mut ctx.accounts.position;
    let liquidity_pool = &mut ctx.accounts.liquidity_pool;
    let clock = Clock::get()?;

    // Extract settled values from baskt status
    let settlement_price = params.close_price;
    let settlement_funding_index = baskt.funding_index.cumulative_index;

    require!(settlement_price > 0, PerpetualsError::InvalidOraclePrice);

    // Update position funding to settlement index
    position.update_funding(settlement_funding_index)?;

    // Determine size to close
    let size_to_close = params.size_to_close.unwrap_or(position.size);
    require!(size_to_close > 0, PerpetualsError::ZeroSizedPosition);
    require!(
        size_to_close <= position.size,
        PerpetualsError::InvalidPositionSize
    );

    let is_full_close = size_to_close == position.size;

    // Get effective closing fee from baskt config or protocol config
    let closing_fee_bps = effective_u64(
        baskt.config.get_closing_fee_bps(),
        ctx.accounts.protocol.config.closing_fee_bps,
    );

    // Calculate settlement details using shared utility
    let settlement_details = calculate_position_settlement(
        position,
        size_to_close,
        params.close_price,
        ClosingType::ForceClose { closing_fee_bps },
        ctx.accounts.protocol.config.treasury_cut_bps,
    )?;

    // Get escrow balance
    let escrow_balance = ctx.accounts.owner_collateral_escrow_account.amount;

    // Execute transfers using existing utility
    let transfer_result = execute_settlement_transfers(
        &ctx.accounts.token_program,
        &ctx.accounts.owner_collateral_escrow_account,
        &ctx.accounts.owner_collateral_account.to_account_info(),
        Some(&ctx.accounts.treasury_token.to_account_info()), // Include treasury for force close with fees
        &ctx.accounts.usdc_vault.to_account_info(),
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

    // Update pool state using actual transferred amounts
    update_pool_state(
        &mut ctx.accounts.liquidity_pool,
        &transfer_result,
        settlement_details.bad_debt_amount,
    )?;

    // Update position state after settlement
    update_position_after_settlement(
        position,
        size_to_close,
        settlement_details.collateral_to_release,
        settlement_details.funding_accumulated as u64,
    )?;


    // Emit force close event
    emit!(PositionForceClosed {
        baskt: baskt.key(),
        position: position.key(),
        owner: position.owner,
        settlement_price,
        close_price: params.close_price,
        entry_price: position.entry_price,
        size_closed: size_to_close,
        size_remaining: position.size,
        is_long: position.is_long,
        collateral_returned: settlement_details.user_payout_u64,
        pnl: settlement_details.pnl as i64,
        funding_payment: settlement_details.funding_accumulated,
        closed_by: ctx.accounts.authority.key(),
        timestamp: clock.unix_timestamp,
        escrow_returned_to_pool: transfer_result.from_escrow_to_pool,
        pool_payout: transfer_result.from_pool_to_user,
        bad_debt_absorbed: settlement_details.bad_debt_amount,
        collateral_remaining: position.collateral,
    });

    if is_full_close {
        baskt.open_positions = baskt
            .open_positions
            .checked_sub(1)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Close escrow token account to reclaim rent
        close_escrow_account(
            &ctx.accounts.token_program,
            &ctx.accounts.owner_collateral_escrow_account,
            &ctx.accounts.authority.to_account_info(),
            &ctx.accounts.program_authority.to_account_info(),
            ctx.bumps.program_authority,
        )?;

        // Close position account manually since we removed the close attribute
        close_account(&position.to_account_info(), &ctx.accounts.authority.to_account_info())?;
    }


    Ok(())
}
