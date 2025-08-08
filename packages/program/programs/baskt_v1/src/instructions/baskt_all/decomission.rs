use crate::constants::{BASE_NAV, BASKT_SEED, BPS_DIVISOR, PRICE_PRECISION, PROTOCOL_SEED};
use crate::error::PerpetualsError;
use crate::events::*;
use crate::state::asset::SyntheticAsset;
use crate::state::baskt::{AssetConfig, Baskt, BasktStatus};
use crate::state::funding_index::FundingIndex;
use crate::state::protocol::{Protocol, Role};
use anchor_lang::prelude::*;

/// Decommission a baskt - enters decommissioning phase
#[derive(Accounts)]
pub struct DecommissionBaskt<'info> {
    #[account(
        mut,
        seeds = [BASKT_SEED, &baskt.uid.to_le_bytes()],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>,

    /// Authority that can decommission (BasktManager or Owner for emergency)
    #[account(
        constraint = protocol.has_permission(authority.key(), Role::BasktManager) || authority.key() == baskt.creator
            @ PerpetualsError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

pub fn decommission_baskt(ctx: Context<DecommissionBaskt>) -> Result<()> {
    let baskt = &mut ctx.accounts.baskt;
    let clock = Clock::get()?;

    require!(
        matches!(baskt.status, BasktStatus::Active),
        PerpetualsError::InvalidBasktState
    );

    baskt.status = BasktStatus::Decommissioning;

    emit!(BasktDecommissioningInitiated {
        baskt: baskt.key(),
        initiated_at: clock.unix_timestamp,
    });

    Ok(())
}
