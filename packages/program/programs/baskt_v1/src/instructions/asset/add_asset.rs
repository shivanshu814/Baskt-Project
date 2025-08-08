use crate::constants::*;
use crate::error::PerpetualsError;
use crate::state::{
    asset::{AssetPermissions, SyntheticAsset},
    protocol::{Protocol, Role},
};
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AddAssetParams {
    pub permissions: AssetPermissions,
    pub ticker: String,
}

#[derive(Accounts)]
#[instruction(params: AddAssetParams)]
pub struct AddAsset<'info> {
    #[account(mut,
        constraint = protocol.has_permission(admin.key(), Role::AssetManager) @ PerpetualsError::UnauthorizedRole
    )]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = SyntheticAsset::DISCRIMINATOR.len() + SyntheticAsset::INIT_SPACE,
        seeds = [ASSET_SEED, params.ticker.as_bytes()],
        bump
    )]
    pub asset: Account<'info, SyntheticAsset>,

    #[account(seeds = [PROTOCOL_SEED], bump, )]
    pub protocol: Account<'info, Protocol>,

    pub system_program: Program<'info, System>,
}

pub fn add_asset(ctx: Context<AddAsset>, params: AddAssetParams) -> Result<()> {
    let asset = &mut ctx.accounts.asset;
    let clock = Clock::get()?;
    asset.initialize(
        params.ticker,
        params.permissions,
        clock.unix_timestamp as u32, // Convert to u32 for optimized timestamp
    )?;
    Ok(())
}
