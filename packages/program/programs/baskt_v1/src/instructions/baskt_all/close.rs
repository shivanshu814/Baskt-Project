use crate::constants::{BASKT_SEED, PROTOCOL_SEED};
use crate::error::PerpetualsError;
use crate::events::*;
use crate::state::baskt::{Baskt, BasktStatus};
use crate::state::protocol::{Protocol, Role};
use anchor_lang::prelude::*;

/// Close a baskt - final state when all positions are closed
#[derive(Accounts)]
pub struct CloseBaskt<'info> {
    #[account(
        mut,
        seeds = [BASKT_SEED, &baskt.uid.to_le_bytes()],
        close = creator,
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>,

    /// Creator of the baskt - receives rent when closed
    /// CHECK: Validated via constraint
    #[account(mut, constraint = creator.key() == baskt.creator @ PerpetualsError::Unauthorized)]
    pub creator: UncheckedAccount<'info>,

    /// Authority that can close baskt (BasktManager)
    #[account(
        constraint = protocol.has_permission(authority.key(), Role::BasktManager)
            @ PerpetualsError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

pub fn close_baskt(ctx: Context<CloseBaskt>) -> Result<()> {
    let baskt = &mut ctx.accounts.baskt;
    let clock = Clock::get()?;

    // Must be decommissioning
    require!(
        matches!(baskt.status, BasktStatus::Decommissioning { .. }),
        PerpetualsError::InvalidBasktState
    );

    // All positions must be closed
    require!(
        baskt.open_positions == 0,
        PerpetualsError::PositionsStillOpen
    );

    emit!(BasktClosed {
        baskt: baskt.key(),
        closed_at: clock.unix_timestamp,
    });

    Ok(())
}

