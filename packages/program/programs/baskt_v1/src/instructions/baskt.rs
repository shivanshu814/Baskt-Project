use crate::error::PerpetualsError;
use crate::state::baskt::{AssetConfig, Baskt};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CreateBaskt<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(init, payer = creator, space = Baskt::INIT_SPACE)]
    pub baskt: Account<'info, Baskt>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateBasktParams {
    pub baskt_id: Pubkey,
    pub asset_configs: Vec<AssetConfig>,
    pub is_public: bool,
}

pub fn create_baskt(ctx: Context<CreateBaskt>, params: CreateBasktParams) -> Result<()> {
    let baskt = &mut ctx.accounts.baskt;
    let creator = &ctx.accounts.creator;
    let clock = Clock::get()?;

    // Validate weights sum to 100%
    let total_weight: u64 = params.asset_configs.iter().map(|config| config.weight).sum();
    if total_weight != 10000 {
        return Err(PerpetualsError::InvalidBasktConfig.into());
    }

    // Initialize the baskt using the new initialize method
    baskt.initialize(
        params.baskt_id,
        params.asset_configs,
        params.is_public,
        creator.key(),
        clock.unix_timestamp,
    )?;

    Ok(())
}
