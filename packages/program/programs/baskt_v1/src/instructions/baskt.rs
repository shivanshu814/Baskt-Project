use crate::constants::{BPS_DIVISOR, PRICE_PRECISION, BASE_NAV};
use crate::error::PerpetualsError;
use crate::events::BasktCreatedEvent;
use crate::state::asset::SyntheticAsset;
use crate::state::baskt::{AssetConfig, BasktV1};
use crate::state::protocol::{Protocol, Role};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;

// Make this a helper function that returns the right type for seeds
fn get_baskt_name_seed(baskt_name: &str) -> [u8; 32] {
    keccak::hash(baskt_name.as_bytes()).to_bytes()
}

// Helper function to check if an authority can activate a baskt
fn can_activate_baskt(baskt: &BasktV1, authority: Pubkey, protocol: &Protocol) -> bool {
    baskt.creator == authority || protocol.has_permission(authority, Role::OracleManager)
}

#[derive(Accounts)]
#[instruction(params: CreateBasktParams)]
pub struct CreateBaskt<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + BasktV1::INIT_SPACE,
        seeds = [b"baskt", &get_baskt_name_seed(&params.baskt_name)[..]], 
        bump
    )]
    pub baskt: Account<'info, BasktV1>,

    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(seeds = [b"protocol"], bump)]
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
        let asset_data = &mut &**asset_info.try_borrow_data()?;
        let asset: SyntheticAsset =
            match anchor_lang::AccountDeserialize::try_deserialize(asset_data) {
                Ok(asset) => asset,
                Err(_) => return Err(PerpetualsError::InvalidAssetAccount.into()),
            };
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
        seeds = [b"baskt", &get_baskt_name_seed(&baskt.baskt_name)[..]], 
        bump = baskt.bump
    )]
    pub baskt: Account<'info, BasktV1>,

    /// @dev Requires either baskt creator or OracleManager role to activate baskts
    #[account(seeds = [b"protocol"], bump)]
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
        !ctx.accounts.baskt.is_active,
        PerpetualsError::BasktAlreadyActive
    );
    let baskt = &mut ctx.accounts.baskt;

    let current_nav = BASE_NAV * PRICE_PRECISION;

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
