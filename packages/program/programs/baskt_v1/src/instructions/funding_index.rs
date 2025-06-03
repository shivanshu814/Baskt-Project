use anchor_lang::solana_program::keccak;
use {
    crate::constants::MAX_FUNDING_RATE_BPS,
    crate::error::PerpetualsError,
    crate::state::{
        baskt::Baskt,
        funding_index::FundingIndex,
        protocol::{Protocol, Role},
    },
    anchor_lang::prelude::*,
};

// Make this a helper function that returns the right type for seeds
fn get_baskt_name_seed(baskt_name: &str) -> [u8; 32] {
    keccak::hash(baskt_name.as_bytes()).to_bytes()
}

//----------------------------------------------------------------------------
// Initialize Funding Index Instruction
//----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct InitializeFundingIndex<'info> {
    /// @dev Requires Owner role to initialize funding indices
    #[account(mut, constraint = protocol.has_permission(authority.key(), Role::Owner) @ PerpetualsError::UnauthorizedRole)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + FundingIndex::INIT_SPACE,
        seeds = [b"funding_index", baskt.key().as_ref()],
        bump
    )]
    pub funding_index: Account<'info, FundingIndex>,

    /// Baskt account to initialize funding index for.
    #[account(
        seeds = [b"baskt", &get_baskt_name_seed(&baskt.baskt_name)[..]],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>,

    #[account(seeds = [b"protocol"], bump)]
    pub protocol: Account<'info, Protocol>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_funding_index(ctx: Context<InitializeFundingIndex>) -> Result<()> {
    let funding_index = &mut ctx.accounts.funding_index;
    let baskt = &ctx.accounts.baskt;
    let clock = Clock::get()?;
    let bump = ctx.bumps.funding_index;

    funding_index.initialize(baskt.key(), clock.unix_timestamp, bump)?;

    // Emit the FundingIndexInitializedEvent
    emit!(crate::events::FundingIndexInitializedEvent {
        baskt_id: baskt.key(),
        initial_index: funding_index.cumulative_index,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

//----------------------------------------------------------------------------
// Update Funding Index Instruction
//----------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(new_rate: i64)] // BPS
pub struct UpdateFundingIndex<'info> {
    /// @dev Requires FundingManager role to update funding indices
    #[account(mut, constraint = protocol.has_permission(authority.key(), Role::FundingManager) @ PerpetualsError::UnauthorizedRole)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"funding_index", baskt.key().as_ref()],
        bump = funding_index.bump
    )]
    pub funding_index: Account<'info, FundingIndex>,

    /// Baskt account associated with the funding index. Used only for seed verification.
    #[account(
        seeds = [b"baskt", baskt.baskt_id.as_ref()],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>, // Read-only access needed for seeds

    #[account(seeds = [b"protocol"], bump)]
    pub protocol: Account<'info, Protocol>,
}

pub fn update_funding_index(ctx: Context<UpdateFundingIndex>, new_rate: i64) -> Result<()> {
    // Validate the new rate is within bounds
    require!(
        new_rate.unsigned_abs() <= MAX_FUNDING_RATE_BPS,
        PerpetualsError::FundingRateExceedsMaximum
    );

    let funding_index = &mut ctx.accounts.funding_index;
    let clock = Clock::get()?;

    funding_index.update_index(new_rate, clock.unix_timestamp)?;

    // Emit the FundingIndexUpdatedEvent
    emit!(crate::events::FundingIndexUpdatedEvent {
        baskt_id: ctx.accounts.baskt.key(),
        cumulative_index: funding_index.cumulative_index,
        current_rate: funding_index.current_rate,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
