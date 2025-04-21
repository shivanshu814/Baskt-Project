use anchor_lang::prelude::*;
use crate::state::baskt::{Baskt, RebalanceHistory, AssetConfig};
use crate::state::protocol::{Protocol, Role};
use crate::error::PerpetualsError;

#[derive(Accounts)]
pub struct Rebalance<'info> {
    #[account(mut)]
    pub baskt: Account<'info, Baskt>,

    #[account(
        init,
        payer = payer,
        space = RebalanceHistory::INIT_SPACE,
        seeds = [
            b"rebalance_history",
            baskt.baskt_id.as_ref(),
            &baskt.last_rebalance_index.to_le_bytes(),
        ],
        bump
    )]
    pub rebalance_history: Account<'info, RebalanceHistory>,

    #[account(
        mut,
        constraint = 
            baskt.creator == payer.key() ||
            protocol.has_role(&payer.key(), Role::Rebalancer) @ PerpetualsError::Unauthorized
    )]
    pub payer: Signer<'info>,
    
    #[account(seeds = [b"protocol"], bump)]
    pub protocol: Account<'info, Protocol>,

    pub system_program: Program<'info, System>,
}

pub fn rebalance(
    ctx: Context<Rebalance>,
    asset_params: Vec<AssetConfig>,
) -> Result<()> {
    // Verify baskt is active
    require!(
        ctx.accounts.baskt.is_active,
        PerpetualsError::BasktInactive
    );

    // Verify new asset configs are valid
    require!(
        !asset_params.is_empty(),
        PerpetualsError::InvalidAssetConfig
    );

    let baskt = &ctx.accounts.baskt;

    // Verify that length of new asset configs is same as current
    require!(
        asset_params.len() == baskt.current_asset_configs.len(),
        PerpetualsError::InvalidAssetConfig
    );


    // Verify that assets are correct with the same index 
    for (index, config) in asset_params.iter().enumerate() {
        require!(
            config.asset_id == baskt.current_asset_configs[index].asset_id,
            PerpetualsError::InvalidAssetConfig
        );
    }

    // Verify total weight is 10000
    let total_weight: u64 = asset_params.iter().map(|config| config.weight).sum();
    require!(
        total_weight == 10000,
        PerpetualsError::InvalidAssetConfig
    );


    let current_nav = baskt.get_nav(&ctx.remaining_accounts[0])?;
    let current_timestamp = Clock::get()?.unix_timestamp;


    ctx.accounts.rebalance_history.initialize(
        ctx.accounts.baskt.baskt_id,
        ctx.accounts.baskt.last_rebalance_index,
        ctx.accounts.baskt.current_asset_configs.clone(),
        ctx.accounts.baskt.baseline_nav,
        current_timestamp,
    )?;

    // Perform rebalance
    ctx.accounts.baskt.rebalance(
        asset_params,
        current_timestamp,
        current_nav,
    )?;

    Ok(())
} 