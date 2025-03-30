use crate::error::PerpetualsError;
use crate::state::asset::SyntheticAsset;
use crate::state::baskt::{AssetConfig, Baskt, AssetParams};
use crate::state::protocol::Protocol;
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

    /// Protocol account to check feature flags
    #[account(seeds = [b"protocol"], bump)]
    pub protocol: Account<'info, Protocol>,

    pub system_program: Program<'info, System>,
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
    let protocol = &ctx.accounts.protocol;
    let clock = Clock::get()?;
    let remaining = &ctx.remaining_accounts;

    // Check if baskt creation is allowed
    if !protocol.feature_flags.allow_baskt_creation {
        return Err(PerpetualsError::FeatureDisabled.into());
    }

    // Validate weights sum to 100%
    let total_weight: u64 = params.asset_params.iter().map(|config| config.weight).sum();
    if total_weight != 10000 {
        return Err(PerpetualsError::InvalidBasktConfig.into());
    }

    let baskt_key = baskt.key();

    let asset_prices = Baskt::process_asset_oracle_pairs(remaining, clock.unix_timestamp, None)?;

    // Check if assets allow for the specified directions (long/short)
    for (i, asset_param) in params.asset_params.iter().enumerate() {
        // Get the corresponding asset account info
        let asset_info = &remaining[i * 2];

        // Deserialize asset account
        let asset_data = &mut &**asset_info.try_borrow_data()?;
        let asset: SyntheticAsset =
            match anchor_lang::AccountDeserialize::try_deserialize(asset_data) {
                Ok(asset) => asset,
                Err(_) => return Err(PerpetualsError::InvalidAssetAccount.into()),
            };

        // Check if the asset allows the specified direction
        if asset_param.direction && !asset.permissions.allow_longs {
            return Err(PerpetualsError::LongPositionsDisabled.into());
        }
        if !asset_param.direction && !asset.permissions.allow_shorts {
            return Err(PerpetualsError::ShortPositionsDisabled.into());
        }
    }

    // Map the asset configs to include the correct baseline prices
    let asset_configs: Vec<AssetConfig> = params
        .asset_params
        .iter()
        .map(|config| {
            // Find current price for this asset
            let baseline_price = asset_prices
                .iter()
                .find(|(id, _)| *id == config.asset_id)
                .map(|(_, price)| *price)
                .unwrap_or(1000000); // Default to 1.0 if price not found

            AssetConfig {
                asset_id: config.asset_id,
                direction: config.direction,
                weight: config.weight,
                baseline_price,
            }
        })
        .collect();
    // Does asset allow longs and shorts

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
