use crate::error::PerpetualsError;
use crate::state::asset::SyntheticAsset;
use crate::state::baskt::Baskt;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct GetAssetPrice<'info> {
    pub asset: Account<'info, SyntheticAsset>,
    /// CHECK: Oracle account is validated in the get_price method
    #[account(constraint = oracle.key() == asset.oracle.oracle_account @ PerpetualsError::InvalidOracleAccount)]
    pub oracle: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct GetBasktNav<'info> {
    #[account(constraint = baskt.is_active @ PerpetualsError::BasktInactive)]
    pub baskt: Account<'info, Baskt>,
}

pub fn get_asset_price(ctx: Context<GetAssetPrice>) -> Result<u64> {
    let asset = &ctx.accounts.asset;
    let oracle = &ctx.accounts.oracle;
    let clock = Clock::get()?;
    
    // Get the price from oracle and return it
    let oracle_price = asset.get_price(oracle, clock.unix_timestamp, false)?;
    Ok(oracle_price.price)
}

pub fn get_baskt_nav(ctx: Context<GetBasktNav>) -> Result<u64> {
    let baskt = &ctx.accounts.baskt;
    let clock = Clock::get()?;
    let remaining = &ctx.remaining_accounts;
    
    // Return baseline NAV if no accounts provided
    if remaining.len() == 0 {
        return Ok(baskt.baseline_nav);
    }
    
    // Process asset/oracle pairs to get current prices
    // Pass baskt reference to validate each asset is in the baskt
    let current_prices = Baskt::process_asset_oracle_pairs(remaining, clock.unix_timestamp, Some(baskt))?;
    
    // If no valid prices were obtained, return baseline NAV
    if current_prices.is_empty() {
        return Ok(baskt.baseline_nav);
    }

    
    // Calculate and return NAV with current prices
    baskt.calculate_nav(&current_prices)
}
