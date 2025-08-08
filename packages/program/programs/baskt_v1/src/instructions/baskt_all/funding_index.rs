use {
    crate::constants::{BASKT_SEED, MAX_FUNDING_RATE_BPS, PROTOCOL_SEED},
    crate::error::PerpetualsError,
    crate::state::{
        baskt::Baskt,
        funding_index::FundingIndex,
        protocol::{Protocol, Role},
    },
    anchor_lang::prelude::*,
};

//----------------------------------------------------------------------------
// Update Funding Index Instruction
//----------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(new_rate: i64)] // BPS
pub struct UpdateFundingIndex<'info> {
    /// @dev Requires FundingManager role to update funding indices
    #[account(mut, constraint = protocol.has_permission(authority.key(), Role::FundingManager) @ PerpetualsError::UnauthorizedRole)]
    pub authority: Signer<'info>,

    /// Baskt account associated with the funding index. Used only for seed verification.
    #[account(
        mut,
        seeds = [BASKT_SEED, &baskt.uid.to_le_bytes()],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>, 

    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

pub fn update_funding_index(ctx: Context<UpdateFundingIndex>, new_rate: i64) -> Result<()> {
    // Validate the new rate is within bounds
    require!(
        new_rate.unsigned_abs() <= MAX_FUNDING_RATE_BPS,
        PerpetualsError::FundingRateExceedsMaximum
    );
    require!(ctx.accounts.baskt.is_trading(), PerpetualsError::BasktNotActive);

    let clock = Clock::get()?;

    ctx.accounts
        .baskt
        .funding_index
        .update_index(new_rate, clock.unix_timestamp)?;

    // Emit the FundingIndexUpdatedEvent
    emit!(crate::events::FundingIndexUpdatedEvent {
        baskt_id: ctx.accounts.baskt.key(),
        cumulative_index: ctx.accounts.baskt.funding_index.cumulative_index,
        current_rate: ctx.accounts.baskt.funding_index.current_rate,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
