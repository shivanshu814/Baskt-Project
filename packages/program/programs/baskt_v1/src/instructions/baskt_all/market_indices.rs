use {
    crate::constants::{BASKT_SEED, MAX_FUNDING_RATE_BPS, PROTOCOL_SEED},
    crate::error::PerpetualsError,
    crate::state::{
        baskt::Baskt,
        market_indices::MarketIndices,
        protocol::{Protocol, Role},
    },
    anchor_lang::prelude::*,
};

//----------------------------------------------------------------------------
// Update Market Indices Instruction
//----------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(new_funding_rate: i64, new_borrow_rate: i64)] // Both in BPS
pub struct update_market_indices<'info> {
    /// @dev Requires FundingManager role to update market indices
    #[account(mut, constraint = protocol.has_permission(authority.key(), Role::FundingManager) @ PerpetualsError::UnauthorizedRole)]
    pub authority: Signer<'info>,

    /// Baskt account associated with the market indices. Used only for seed verification.
    #[account(
        mut,
        seeds = [BASKT_SEED, &baskt.uid.to_le_bytes()],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>, 

    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

pub fn update_market_indices(ctx: Context<update_market_indices>, new_funding_rate: i64, new_borrow_rate: i64) -> Result<()> {
    // Validate the funding rate is within bounds (can be negative)
    require!(
        new_funding_rate.unsigned_abs() <= MAX_FUNDING_RATE_BPS,
        PerpetualsError::FundingRateExceedsMaximum
    );
    
    // Validate the borrow rate (must be positive and within bounds)
    require!(
        new_borrow_rate >= 0 && (new_borrow_rate as u64) <= MAX_FUNDING_RATE_BPS,
        PerpetualsError::BorrowRateExceedsMaximum
    );
    
    require!(ctx.accounts.baskt.is_trading(), PerpetualsError::BasktNotActive);

    let clock = Clock::get()?;

    // Update both indices in a single call
    ctx.accounts
        .baskt
        .market_indices
        .update_indices(new_funding_rate, new_borrow_rate, clock.unix_timestamp)?;

    // Emit the updated event with both indices
    emit!(crate::events::MarketIndexUpdatedEvent {
        baskt_id: ctx.accounts.baskt.key(),
        cumulative_funding_index: ctx.accounts.baskt.market_indices.cumulative_funding_index,
        cumulative_borrow_index: ctx.accounts.baskt.market_indices.cumulative_borrow_index,
        current_funding_rate: ctx.accounts.baskt.market_indices.current_funding_rate,
        current_borrow_rate: ctx.accounts.baskt.market_indices.current_borrow_rate,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
