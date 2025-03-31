use crate::error::PerpetualsError;
use crate::state::{
    asset::{AssetPermissions, SyntheticAsset},
    oracle::OracleParams,
    protocol::{Protocol, Role},
};
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AddAssetParams {
    pub ticker: String,
    pub oracle: OracleParams,
    pub permissions: AssetPermissions,
}

#[derive(Accounts)]
#[instruction(params: AddAssetParams)]
pub struct AddAsset<'info> {
    #[account(mut,
        constraint = protocol.has_permission(&admin.key(), Role::AssetManager) @ PerpetualsError::UnauthorizedSigner
    )]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + SyntheticAsset::INIT_SPACE,
        seeds = [b"asset", params.ticker.as_bytes()],
        bump
    )]
    pub asset: Account<'info, SyntheticAsset>,

    /// Protocol account for access control check
    #[account(seeds = [b"protocol"], bump)]
    pub protocol: Account<'info, Protocol>,

    pub system_program: Program<'info, System>,
}

pub fn add_asset(ctx: Context<AddAsset>, params: AddAssetParams) -> Result<()> {
    // Get the asset key before borrowing it mutably
    let asset_key = ctx.accounts.asset.key();
    let asset = &mut ctx.accounts.asset;
    let clock = Clock::get()?;

    // Use the asset account's key as the asset_id
    asset.initialize(
        asset_key,
        params.ticker,
        params.oracle,
        clock.unix_timestamp,
        Some(params.permissions),
    )?;

    Ok(())
}
