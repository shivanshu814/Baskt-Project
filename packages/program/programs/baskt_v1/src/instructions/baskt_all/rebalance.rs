use crate::constants::{BPS_DIVISOR, PROTOCOL_SEED};
use crate::error::PerpetualsError;
use crate::state::baskt::{AssetConfig, Baskt};
use crate::state::protocol::{Protocol, Role};
use crate::events::BasktRebalancedEvent;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Rebalance<'info> {
    #[account(mut)]
    pub baskt: Account<'info, Baskt>,

    /// @dev Requires Rebalancer role to rebalance
    #[account(
        mut,
        constraint = protocol.has_permission(payer.key(), Role::Rebalancer) @ PerpetualsError::Unauthorized
    )]
    pub payer: Signer<'info>,

    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,

    pub system_program: Program<'info, System>,
}

pub fn rebalance(
    ctx: Context<Rebalance>, 
    asset_params: Vec<AssetConfig>, 
    new_nav: u64,
    rebalance_fee_per_unit: Option<u64>
) -> Result<()> {
    let baskt = &mut ctx.accounts.baskt;
    
    // Verify baskt is in trading state
    require!(baskt.is_trading(), PerpetualsError::BasktNotActive);
    
    // Verify new asset configs are valid
    require!(
        !asset_params.is_empty(),
        PerpetualsError::InvalidAssetConfig
    );
    
    // Verify asset count matches current baskt configuration
    require!(
        asset_params.len() == baskt.current_asset_configs.len(),
        PerpetualsError::InvalidBasktConfig
    );

    let current_timestamp = Clock::get()?.unix_timestamp;

    // Single pass: validate assets, weights, calculate total, and update baseline prices
    let mut total_weight: u64 = 0;

    for (i, new_config) in asset_params.iter().enumerate() {
        let current_config = &mut baskt.current_asset_configs[i];

        // Verify asset ID matches
        require!(
            new_config.asset_id == current_config.asset_id,
            PerpetualsError::InvalidBasktConfig
        );

        // Verify weight is positive
        require!(new_config.weight > 0, PerpetualsError::InvalidAssetWeights);

        // Accumulate total weight
        total_weight = total_weight
            .checked_add(new_config.weight)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Update baseline price (keeping existing weight and direction)
        current_config.baseline_price = new_config.baseline_price;
        current_config.weight = new_config.weight;
    }

    // Verify total weight is 10000 (100%)
    require!(
        total_weight == BPS_DIVISOR,
        PerpetualsError::InvalidAssetWeights
    );

    // Update rebalance fee index with the new fee (if provided)
    if let Some(fee_per_unit) = rebalance_fee_per_unit {
        if fee_per_unit > 0 {
            baskt.rebalance_fee_index.update_index(fee_per_unit, current_timestamp)?;
        }
    }


    baskt.last_rebalance_time = current_timestamp as u32;
    baskt.baseline_nav = new_nav;

    emit!(BasktRebalancedEvent {
        baskt_id: baskt.key(),
        rebalance_index: baskt.rebalance_fee_index.cumulative_index,
        new_nav: baskt.baseline_nav, 
        timestamp: current_timestamp,
    });

    Ok(())
}
