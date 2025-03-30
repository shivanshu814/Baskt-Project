use anchor_lang::prelude::*;
use crate::state::baskt::{Baskt, RebalanceHistory, AssetParams};
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

    pub protocol: Account<'info, Protocol>,

    pub system_program: Program<'info, System>,
}

pub fn rebalance(
    ctx: Context<Rebalance>,
    asset_params: Vec<AssetParams>,
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

    // Verify total weight is 10000
    let total_weight: u64 = asset_params.iter().map(|config| config.weight).sum();
    require!(
        total_weight == 10000,
        PerpetualsError::InvalidAssetConfig
    );
    
    let current_timestamp = Clock::get()?.unix_timestamp;
    let baskt = &ctx.accounts.baskt;


    // Process oracle accounts to get current prices
    let asset_prices = Baskt::process_asset_oracle_pairs(
        ctx.remaining_accounts, current_timestamp, Some(baskt))?;


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
        &asset_prices,
        current_timestamp,
    )?;

    Ok(())
} 