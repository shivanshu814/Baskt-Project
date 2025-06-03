use {
    crate::constants::{BPS_DIVISOR, LIQUIDATION_FEE_BPS},
    crate::error::PerpetualsError,
    crate::events::*,
    crate::state::{
        baskt::Baskt,
        funding_index::FundingIndex,
        liquidity::LiquidityPool,
        position::{Position, PositionStatus, ProgramAuthority},
        protocol::{Protocol, Role},
        registry::ProtocolRegistry,
    },
    anchor_lang::prelude::*,
    anchor_spl::token::{self, Token, TokenAccount, Transfer},
};

/// Parameters for liquidating a position
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct LiquidatePositionParams {
    pub exit_price: u64,
}

/// Wrapper for remaining accounts to improve readability
pub struct LiquidatePositionRemainingAccounts<'info> {
    pub owner_token: &'info AccountInfo<'info>,
    pub treasury_token: &'info AccountInfo<'info>,
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
}

/// LiquidatePosition using ProtocolRegistry
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
        seeds = [b"position", position.owner.as_ref(), &position.position_id.to_le_bytes()],
        bump = position.bump,
        constraint = position.status as u8 == PositionStatus::Open as u8 @ PerpetualsError::PositionAlreadyClosed,
        close = liquidator,
    )]
    pub position: Account<'info, Position>,

    /// CHECK: Position owner, for token transfers
    pub position_owner: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"funding_index", position.baskt_id.as_ref()],
        bump = funding_index.bump
    )]
    pub funding_index: Account<'info, FundingIndex>,

    #[account(
        constraint = baskt.key() == position.baskt_id @ PerpetualsError::InvalidBaskt,
        constraint = baskt.is_active @ PerpetualsError::BasktInactive
    )]
    pub baskt: Account<'info, Baskt>,

    /// Protocol registry containing common addresses
    #[account(
        seeds = [ProtocolRegistry::SEED],
        bump = registry.bump,
    )]
    pub registry: Account<'info, ProtocolRegistry>,

    /// Protocol for permission checks
    #[account(
        constraint = protocol.key() == registry.protocol @ PerpetualsError::Unauthorized,
        constraint = protocol.feature_flags.allow_liquidations @ PerpetualsError::PositionOperationsDisabled,
        constraint = protocol.has_permission(liquidator.key(), Role::Liquidator) @ PerpetualsError::Unauthorized
    )]
    pub protocol: Account<'info, Protocol>,

    /// Liquidity pool (loaded from registry)
    #[account(
        mut,
        constraint = liquidity_pool.key() == registry.liquidity_pool @ PerpetualsError::InvalidLiquidityPool
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    /// Treasury account (loaded from registry)
    /// CHECK: Validated via registry constraint
    #[account(
        constraint = treasury.key() == registry.treasury @ PerpetualsError::Unauthorized
    )]
    pub treasury: UncheckedAccount<'info>,

    /// Position escrow token account
    #[account(
        mut,
        seeds = [b"escrow", position.key().as_ref()],
        bump,
        constraint = escrow_token.mint == registry.escrow_mint @ PerpetualsError::InvalidMint,
        constraint = escrow_token.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = escrow_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = escrow_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    /// PDA used for token authority over escrow
    #[account(
        seeds = [b"authority"],
        bump,
        constraint = program_authority.key() == registry.program_authority @ PerpetualsError::InvalidProgramAuthority
    )]
    pub program_authority: Account<'info, ProgramAuthority>,

    /// CHECK: PDA authority for token_vault - validated via registry
    #[account(
        constraint = pool_authority.key() == registry.pool_authority @ PerpetualsError::InvalidPoolAuthority
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
    let registry = &ctx.accounts.registry;
    let clock = Clock::get()?;

    // Validate liquidation price
    ctx.accounts.baskt.oracle.validate_liquidation_price(params.exit_price, clock.unix_timestamp)?;

    // Update funding first
    position.update_funding(funding_index.cumulative_index)?;

    // Check if position is liquidatable
    let is_liquidatable = position.is_liquidatable(params.exit_price)?;
    require!(is_liquidatable, PerpetualsError::PositionNotLiquidatable);

    // Liquidate the position
    position.liquidate(
        params.exit_price,
        funding_index.cumulative_index,
        clock.unix_timestamp,
    )?;

    // Calculate amounts
    let pnl = position.calculate_pnl()?;
    let funding_amount = position.funding_accumulated;
    let raw_liquidation_fee = (position.size as u128)
        .checked_mul(LIQUIDATION_FEE_BPS as u128)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_div(BPS_DIVISOR as u128)
        .ok_or(PerpetualsError::MathOverflow)? as u64;

    // Parse remaining accounts
    let remaining_accounts = LiquidatePositionRemainingAccounts::parse(ctx.remaining_accounts)?;

    // Signer seeds
    let authority_signer_seeds = [b"authority".as_ref(), &[ctx.bumps.program_authority]];
    let authority_signer = &[&authority_signer_seeds[..]];

    // Pool authority signer seeds
    let lp_key = ctx.accounts.liquidity_pool.key();
    let proto_key = ctx.accounts.protocol.key();
    let pool_authority_signer_seeds = [
        b"pool_authority".as_ref(),
        lp_key.as_ref(),
        proto_key.as_ref(),
        &[registry.pool_authority_bump],
    ];
    let pool_authority_signer = &[&pool_authority_signer_seeds[..]];

    // 1. Transfer liquidation fee to treasury
    let initial_escrow_balance = ctx.accounts.escrow_token.amount;
    let mut current_escrow_balance = initial_escrow_balance;

    let liquidation_fee_paid_to_treasury = std::cmp::min(raw_liquidation_fee, initial_escrow_balance);

    if liquidation_fee_paid_to_treasury > 0 {
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
            liquidation_fee_paid_to_treasury,
        )?;
        current_escrow_balance = current_escrow_balance
            .checked_sub(liquidation_fee_paid_to_treasury)
            .ok_or(PerpetualsError::MathOverflow)?;
    }

    // 2. Calculate owner's net settlement
    let owner_net_settlement_i128 = (position.collateral as i128)
        .checked_add(pnl as i128)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_add(funding_amount)
        .ok_or(PerpetualsError::MathOverflow)?;

    let owner_payout_u64 = if owner_net_settlement_i128 > 0 {
        owner_net_settlement_i128 as u64
    } else {
        0
    };

    // 3. Determine amounts from escrow
    let payout_from_escrow_to_owner = std::cmp::min(owner_payout_u64, current_escrow_balance);

    if payout_from_escrow_to_owner > 0 {
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
            payout_from_escrow_to_owner,
        )?;
        current_escrow_balance = current_escrow_balance
            .checked_sub(payout_from_escrow_to_owner)
            .ok_or(PerpetualsError::MathOverflow)?;
    }

    let payout_from_pool_to_owner = owner_payout_u64
        .checked_sub(payout_from_escrow_to_owner)
        .ok_or(PerpetualsError::MathOverflow)?;

    let final_escrow_remainder_to_pool_vault = current_escrow_balance;

    // 4. Pool transfers
    if payout_from_pool_to_owner > 0 {
        require!(
            ctx.accounts.liquidity_pool.total_liquidity >= payout_from_pool_to_owner,
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
            payout_from_pool_to_owner,
        )?;
    }

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
        .checked_sub(payout_from_pool_to_owner as i128)
        .ok_or(PerpetualsError::MathOverflow)?;

    if net_change_for_lp_state_i128 > 0 {
        ctx.accounts.liquidity_pool.increase_liquidity(net_change_for_lp_state_i128 as u64)?;
    } else if net_change_for_lp_state_i128 < 0 {
        ctx.accounts.liquidity_pool.decrease_liquidity(
            net_change_for_lp_state_i128.unsigned_abs().try_into()
                .map_err(|_| PerpetualsError::MathOverflow)?
        )?;
    }

    // Position is closed automatically via constraint

    // Emit event
    emit!(PositionLiquidatedEvent {
        owner: position.owner,
        position_id: position.position_id,
        baskt_id: position.baskt_id,
        size: position.size,
        exit_price: params.exit_price,
        pnl,
        liquidation_fee: liquidation_fee_paid_to_treasury,
        funding_payment: funding_amount,
        remaining_collateral: owner_payout_u64,
        pool_payout: payout_from_pool_to_owner,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}