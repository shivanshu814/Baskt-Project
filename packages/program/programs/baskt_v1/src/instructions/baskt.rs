use crate::error::PerpetualsError;
use crate::state::baskt::{AssetConfig, Baskt};
use crate::state::asset::SyntheticAsset;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(baskt_name: String)]
pub struct CreateBaskt<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = Baskt::INIT_SPACE,
        seeds = [b"baskt", baskt_name.as_bytes()],
        bump
    )]
    pub baskt: Account<'info, Baskt>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AssetParams {
    pub asset_id: Pubkey,
    pub direction: bool,
    pub weight: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateBasktParams {
    pub baskt_name: String,
    pub asset_params: Vec<AssetParams>,
    pub is_public: bool,
}

pub fn create_baskt(ctx: Context<CreateBaskt>, params: CreateBasktParams) -> Result<()> {
    let baskt = &mut ctx.accounts.baskt;
    let creator = &ctx.accounts.creator;
    let clock = Clock::get()?;
    let remaining = &ctx.remaining_accounts;

    // Validate weights sum to 100%
    let total_weight: u64 = params.asset_params.iter().map(|config| config.weight).sum();
    if total_weight != 10000 {
        return Err(PerpetualsError::InvalidBasktConfig.into());
    }

    // Get the key before initializing
    let baskt_key = baskt.key();

    // Process asset/oracle pairs to get current prices
    // Pass None for baskt_option since we're creating the baskt and don't need to validate asset membership
    let asset_prices = Baskt::process_asset_oracle_pairs(remaining, clock.unix_timestamp, None)?;

    // Map the asset configs to include the correct baseline prices
    let asset_configs = params.asset_params.iter().map(|config| {
        // Find current price for this asset
        let baseline_price = asset_prices.iter()
            .find(|(id, _)| *id == config.asset_id)
            .map(|(_, price)| *price)
            .unwrap_or(1000000); // Default to 1.0 if price not found
        
        AssetConfig {
            asset_id: config.asset_id,
            direction: config.direction,
            weight: config.weight,
            baseline_price,
        }
    }).collect();

    // Initialize the baskt using the new initialize method
    baskt.initialize(
        baskt_key,
        params.baskt_name,
        asset_configs,
        params.is_public,
        creator.key(),
        clock.unix_timestamp,
    )?;

    Ok(())
}
