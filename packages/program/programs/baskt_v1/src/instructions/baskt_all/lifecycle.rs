use crate::constants::{
    BASE_NAV, BASKT_SEED, BPS_DIVISOR, FUNDING_INDEX_SEED, PRICE_PRECISION, PROTOCOL_SEED,
};
use crate::error::PerpetualsError;
use crate::events::*;
use crate::state::asset::SyntheticAsset;
use crate::state::baskt::{AssetConfig, BasktStatus, Baskt};
use crate::state::funding_index::FundingIndex;
use crate::state::protocol::{Protocol, Role};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;

// Make this a helper function that returns the right type for seeds
fn get_baskt_name_seed(baskt_name: &str) -> [u8; 32] {
    keccak::hash(baskt_name.as_bytes()).to_bytes()
}

// Helper function to check if an authority can activate a baskt
fn can_activate_baskt(baskt: &Baskt, authority: Pubkey, protocol: &Protocol) -> bool {
    baskt.creator == authority || protocol.has_permission(authority, Role::OracleManager)
}

#[derive(Accounts)]
#[instruction(params: CreateBasktParams)]
pub struct CreateBaskt<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Baskt::INIT_SPACE,
        seeds = [BASKT_SEED, &get_baskt_name_seed(&params.baskt_name)[..]],
        bump
    )]
    pub baskt: Account<'info, Baskt>,

    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateBasktParams {
    pub baskt_name: String,
    pub asset_params: Vec<CreateBasktAssetParams>,
    pub is_public: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateBasktAssetParams {
    pub weight: u64,
    pub direction: bool,
}

pub fn create_baskt(ctx: Context<CreateBaskt>, params: CreateBasktParams) -> Result<()> {
    let baskt = &mut ctx.accounts.baskt;
    let creator = &ctx.accounts.creator;
    let protocol = &ctx.accounts.protocol;
    let clock = Clock::get()?;
    let remaining = &ctx.remaining_accounts;
    // Check if baskt creation is allowed
    if !protocol.feature_flags.allow_baskt_creation {
        return Err(PerpetualsError::BasktOperationsDisabled.into());
    }

    // Validate weights sum to 100%
    let total_weight: u64 = params.asset_params.iter().map(|config| config.weight).sum();
    if total_weight != BPS_DIVISOR {
        return Err(PerpetualsError::InvalidBasktConfig.into());
    }

    let baskt_key = baskt.key();

    // Check if assets allow for the specified directions (long/short)
    for (i, asset_param) in params.asset_params.iter().enumerate() {
        // Get the corresponding asset account info
        let asset_info = &remaining[i];

        // Deserialize asset account
        let borrowed_data = asset_info.try_borrow_data()?;
        let mut asset_data = &borrowed_data[..];
        let asset: SyntheticAsset =
            anchor_lang::AccountDeserialize::try_deserialize(&mut asset_data)
                .map_err(|_| PerpetualsError::InvalidAssetAccount)?;
        if !asset.is_active {
            return Err(PerpetualsError::InactiveAsset.into());
        }
        // Check if the asset allows the specified direction
        if asset_param.direction && !asset.permissions.allow_longs {
            return Err(PerpetualsError::LongPositionsDisabled.into());
        }
        if !asset_param.direction && !asset.permissions.allow_shorts {
            return Err(PerpetualsError::ShortPositionsDisabled.into());
        }
    }

    let asset_configs: Vec<AssetConfig> = params
        .asset_params
        .iter()
        .enumerate()
        .map(|(i, config)| AssetConfig {
            asset_id: remaining[i].key(),
            direction: config.direction,
            weight: config.weight,
            baseline_price: 0,
        })
        .collect();

    baskt.initialize(
        baskt_key,
        params.baskt_name.clone(),
        asset_configs,
        params.is_public,
        creator.key(),
        clock.unix_timestamp,
        ctx.bumps.baskt,
    )?;

    emit!(BasktCreatedEvent {
        baskt_id: baskt.key(),
        baskt_name: params.baskt_name,
        creator: creator.key(),
        is_public: params.is_public,
        asset_count: params.asset_params.len() as u8,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(params: ActivateBasktParams)]
pub struct ActivateBaskt<'info> {
    #[account(
        mut,
        seeds = [BASKT_SEED, &get_baskt_name_seed(&baskt.baskt_name)[..]],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>,

    /// @dev Requires either baskt creator or OracleManager role to activate baskts
    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,

    #[account(mut, constraint = can_activate_baskt(&baskt, authority.key(), &protocol) @ PerpetualsError::Unauthorized)]
    pub authority: Signer<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ActivateBasktParams {
    pub prices: Vec<u64>,
    pub max_price_age_sec: u32,
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

    // Activate the baskt with the provided prices
    baskt.activate(params.prices, current_nav)?;

    // Set oracle params and validate max_price_age_sec
    baskt.oracle.set(
        current_nav,
        Clock::get().unwrap().unix_timestamp,
        params.max_price_age_sec,
    )?;

    Ok(())
}

// ====== Lifecycle Operations ======

/// Decommission a baskt - enters decommissioning phase
#[derive(Accounts)]
pub struct DecommissionBaskt<'info> {
    #[account(
        mut,
        seeds = [BASKT_SEED, &get_baskt_name_seed(&baskt.baskt_name)[..]],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>,

    /// Authority that can decommission (OracleManager or Owner for emergency)
    #[account(
        constraint = protocol.has_permission(authority.key(), Role::OracleManager)
            @ PerpetualsError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

pub fn decommission_baskt(ctx: Context<DecommissionBaskt>) -> Result<()> {
    let baskt = &mut ctx.accounts.baskt;
    let clock = Clock::get()?;
    let grace_period = ctx.accounts.protocol.config.decommission_grace_period;

    require!(
        matches!(baskt.status, BasktStatus::Active),
        PerpetualsError::InvalidBasktState
    );

    baskt.status = BasktStatus::Decommissioning {
        initiated_at: clock.unix_timestamp,
        grace_period_end: clock.unix_timestamp + grace_period,
    };

    emit!(BasktDecommissioningInitiated {
        baskt: baskt.key(),
        initiated_at: clock.unix_timestamp,
        grace_period_end: clock.unix_timestamp + grace_period,
        open_positions: baskt.open_positions,
    });

    Ok(())
}

/// Settle a baskt - freeze price and funding after grace period
#[derive(Accounts)]
pub struct SettleBaskt<'info> {
    #[account(
        mut,
        seeds = [BASKT_SEED, &get_baskt_name_seed(&baskt.baskt_name)[..]],
        bump = baskt.bump,
        constraint = matches!(baskt.status, BasktStatus::Decommissioning { .. }) @ PerpetualsError::InvalidBasktState
    )]
    pub baskt: Account<'info, Baskt>,

    /// Authority that can settle (OracleManager)
    #[account(
        constraint = protocol.has_permission(authority.key(), Role::OracleManager)
            @ PerpetualsError::Unauthorized
    )]
    pub authority: Signer<'info>,

    /// Funding index account for this baskt
    #[account(
        seeds = [FUNDING_INDEX_SEED, baskt.key().as_ref()],
        bump = funding_index.bump,
        constraint = funding_index.baskt_id == baskt.key() @ PerpetualsError::InvalidFundingIndex,
        constraint = funding_index.last_update_timestamp > 0 @ PerpetualsError::FundingNotUpToDate
    )]
    pub funding_index: Account<'info, FundingIndex>,

    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

pub fn settle_baskt(ctx: Context<SettleBaskt>) -> Result<()> {
    let baskt = &mut ctx.accounts.baskt;
    let funding_index = &ctx.accounts.funding_index;
    let oracle = &baskt.oracle;
    let clock = Clock::get()?;

    // Validate we're in decommissioning state and grace period has passed
    match baskt.status {
        BasktStatus::Decommissioning {
            grace_period_end, ..
        } => {
            require!(
                clock.unix_timestamp >= grace_period_end,
                PerpetualsError::GracePeriodNotOver
            );
        }
        _ => return err!(PerpetualsError::InvalidBasktState),
    }

    // Get current oracle price (oracle should already be updated before calling this)
    let settlement_price = oracle.get_price()?;

    // Capture the current funding index (already an i128)
    let settlement_funding_index = funding_index.cumulative_index;

    // Update baskt status to settled with actual funding index
    baskt.status = BasktStatus::Settled {
        settlement_price,
        settlement_funding_index,
        settled_at: clock.unix_timestamp,
    };

    emit!(BasktSettled {
        baskt: baskt.key(),
        settlement_price,
        settlement_funding_index,
        settled_at: clock.unix_timestamp,
        remaining_positions: baskt.open_positions,
    });

    Ok(())
}

/// Close a baskt - final state when all positions are closed
#[derive(Accounts)]
pub struct CloseBaskt<'info> {
    #[account(
        mut,
        seeds = [BASKT_SEED, &get_baskt_name_seed(&baskt.baskt_name)[..]],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>,

    /// Authority that can close baskt (OracleManager)
    #[account(
        constraint = protocol.has_permission(authority.key(), Role::OracleManager)
            @ PerpetualsError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

pub fn close_baskt(ctx: Context<CloseBaskt>) -> Result<()> {
    let baskt = &mut ctx.accounts.baskt;
    let clock = Clock::get()?;

    // Must be settled
    require!(
        matches!(baskt.status, BasktStatus::Settled { .. }),
        PerpetualsError::InvalidBasktState
    );

    // All positions must be closed
    require!(
        baskt.open_positions == 0,
        PerpetualsError::PositionsStillOpen
    );

    // Calculate final NAV - for now use current oracle price
    let final_nav = baskt.get_settlement_nav()?;

    baskt.status = BasktStatus::Closed {
        final_nav,
        closed_at: clock.unix_timestamp,
    };

    emit!(BasktClosed {
        baskt: baskt.key(),
        final_nav,
        closed_at: clock.unix_timestamp,
    });

    Ok(())
}
