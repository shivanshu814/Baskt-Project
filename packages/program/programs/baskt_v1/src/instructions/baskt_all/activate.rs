use crate::constants::{BASE_NAV, BASKT_SEED, BPS_DIVISOR, PRICE_PRECISION, PROTOCOL_SEED};
use crate::error::PerpetualsError;
use crate::events::*;
use crate::state::asset::SyntheticAsset;
use crate::state::baskt::{AssetConfig, Baskt, BasktStatus};
use crate::state::funding_index::FundingIndex;
use crate::state::protocol::{Protocol, Role};
use anchor_lang::prelude::*;

// Helper function to check if an authority can activate a baskt
fn can_activate_baskt(baskt: &Baskt, authority: Pubkey, protocol: &Protocol) -> bool {
    protocol.has_permission(authority, Role::BasktManager)
}


#[derive(Accounts)]
#[instruction(params: ActivateBasktParams)]
pub struct ActivateBaskt<'info> {
    #[account(
        mut,
        seeds = [BASKT_SEED, &baskt.uid.to_le_bytes()],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>,

    /// @dev Requires BasktManager role to activate baskts
    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,

    #[account(mut, constraint = can_activate_baskt(&baskt, authority.key(), &protocol) @ PerpetualsError::Unauthorized)]
    pub authority: Signer<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ActivateBasktParams {
    pub prices: Vec<u64>,
}

pub fn activate_baskt(ctx: Context<ActivateBaskt>, params: ActivateBasktParams) -> Result<()> {
    require!(
        matches!(ctx.accounts.baskt.status, BasktStatus::Pending),
        PerpetualsError::BasktAlreadyActive
    );
    let baskt = &mut ctx.accounts.baskt;

    let current_nav = BASE_NAV
        .checked_mul(PRICE_PRECISION)
        .ok_or(PerpetualsError::MathOverflow)?;

    // Check if the number of prices matches the number of assets in the baskt
    if params.prices.len() != baskt.current_asset_configs.len() {
        return Err(PerpetualsError::InvalidBasktConfig.into());
    }
    let clock = Clock::get()?;
    // Activate the baskt with the provided prices
    baskt.activate(params.prices, current_nav)?;
    baskt.funding_index.initialize(clock.unix_timestamp)?;

    Ok(())
}