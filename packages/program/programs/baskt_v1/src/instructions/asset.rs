use crate::state::{asset::SyntheticAsset, oracle::OracleParams};
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AddAssetParams {
    pub asset_id: Pubkey,
    pub ticker: String,
    pub oracle: OracleParams,
}

#[derive(Accounts)]
pub struct AddAsset<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(init, payer = admin, space = 8 + SyntheticAsset::INIT_SPACE)]
    pub asset: Account<'info, SyntheticAsset>,

    pub system_program: Program<'info, System>,
}

pub fn add_asset(ctx: Context<AddAsset>, params: AddAssetParams) -> Result<()> {
    let asset = &mut ctx.accounts.asset;
    let clock = Clock::get()?;

    asset.initialize(
        params.asset_id,
        params.ticker,
        params.oracle,
        clock.unix_timestamp,
    )?;

    Ok(())
}
