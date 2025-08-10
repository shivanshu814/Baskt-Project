use crate::constants::{ASSET_SEED, BASE_NAV, BASKT_SEED, BPS_DIVISOR, PRICE_PRECISION, PROTOCOL_SEED};
use crate::error::PerpetualsError;
use crate::events::*;
use crate::state::asset::SyntheticAsset;
use crate::state::baskt::{AssetConfig, Baskt, BasktStatus};
use crate::state::funding_index::FundingIndex;
use crate::state::protocol::{Protocol, Role};
use crate::utils::{transfer_sol};
use anchor_lang::prelude::*;
use std::collections::HashSet;


#[derive(Accounts)]
#[instruction(params: CreateBasktParams)]
pub struct CreateBaskt<'info> {
    #[account(
        init,
        payer = creator,
        space = Baskt::DISCRIMINATOR.len() + Baskt::INIT_SPACE,
        seeds = [BASKT_SEED, &params.uid.to_le_bytes()],
        bump
    )]
    pub baskt: Account<'info, Baskt>,

    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,

    /// Treasury account to receive the fee
    /// CHECK: Validated via protocol constraint
    #[account(
        mut,
        constraint = treasury.key() == protocol.treasury @ PerpetualsError::Unauthorized
    )]
    pub treasury: UncheckedAccount<'info>,

    /// System program for SOL transfers
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateBasktParams {
    pub uid: u32,
    pub asset_params: Vec<CreateBasktAssetParams>,
    pub is_public: bool,
    pub baskt_rebalance_period: u64,
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

    // Handle SOL fee for baskt creation
    let creation_fee_lamports = protocol.config.baskt_creation_fee_lamports;
    
    // Transfer fee to treasury using helper method
    if creation_fee_lamports > 0 {
        transfer_sol(
            &ctx.accounts.creator.to_account_info(),
            &ctx.accounts.treasury.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            creation_fee_lamports,
        )?;
    }

    // Validate weights sum to 100%
    let total_weight: u64 = params.asset_params.iter().map(|config| config.weight).sum();
    if total_weight != BPS_DIVISOR {
        return Err(PerpetualsError::InvalidBasktConfig.into());
    }

    // Ensure asset list does not contain duplicates
    let mut seen_assets: HashSet<Pubkey> = HashSet::with_capacity(params.asset_params.len());

    // Check if assets allow for the specified directions (long/short)
    for (i, asset_param) in params.asset_params.iter().enumerate() {
        // Get the corresponding asset account info
        let asset_info = &remaining[i];

        if !seen_assets.insert(asset_info.key()) {
            return Err(PerpetualsError::InvalidBasktConfig.into());
        }

        // Deserialize asset account
        let borrowed_data = asset_info.try_borrow_data()?;
        let mut asset_data = &borrowed_data[..];
        let asset: SyntheticAsset =
            anchor_lang::AccountDeserialize::try_deserialize(&mut asset_data)
                .map_err(|_| PerpetualsError::InvalidAssetAccount)?;
        
        // Now validate the PDA using the ticker from the asset
        let expected_asset_pda = Pubkey::find_program_address(
            &[ASSET_SEED, asset.ticker.as_bytes()],
            ctx.program_id,
        ).0;
        
        require!(
            asset_info.key() == expected_asset_pda,
            PerpetualsError::InvalidAssetAccount
        );
        require!(
            *asset_info.owner == *ctx.program_id,
            PerpetualsError::InvalidAssetAccount
        );        
        
        if !asset.is_active {
            return Err(PerpetualsError::InactiveAsset.into());
        }
        
        // Check if the asset allows the specified direction
        if asset_param.direction && !asset.permissions.allow_longs() {
            return Err(PerpetualsError::LongPositionsDisabled.into());
        }
        if !asset_param.direction && !asset.permissions.allow_shorts() {
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
        params.uid as u32,
        asset_configs,
        params.is_public,
        creator.key(),
        clock.unix_timestamp as u32,
        ctx.bumps.baskt,
        params.baskt_rebalance_period as u32,
    )?;

    emit!(BasktCreatedEvent {
        uid: params.uid,
        baskt_id: baskt.key(),
        creator: creator.key(),
        is_public: params.is_public,
        asset_count: params.asset_params.len() as u8,
        timestamp: clock.unix_timestamp,
        baskt_rebalance_period: params.baskt_rebalance_period,
    });

    Ok(())
}
