use crate::constants::{BPS_DIVISOR, MAX_FEE_BPS, MIN_COLLATERAL_RATIO_BPS};
use crate::error::PerpetualsError;
use crate::state::baskt::BasktConfig;
use crate::utils::validate_bps;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;


/// Returns the effective value for a u64 parameter, using the override if available.
pub fn effective_u64(override_val: Option<u64>, global_val: u64) -> u64 {
    override_val.unwrap_or(global_val)
}

/// Validates a baskt fee BPS value (optional)
/// Used by individual baskt fee setters
pub fn validate_baskt_fee_bps(fee_bps: Option<u64>) -> Result<()> {
    if let Some(fee) = fee_bps {
        validate_bps(fee, MAX_FEE_BPS)?;
    }
    Ok(())
}

/// Validates a baskt min collateral ratio BPS value (optional)
/// Used by baskt min collateral ratio setter
pub fn validate_baskt_min_collateral_ratio_bps(
    ratio_bps: Option<u64>,
    existing_liquidation_threshold: Option<u64>,
) -> Result<()> {
    if let Some(ratio) = ratio_bps {
        require!(
            ratio >= MIN_COLLATERAL_RATIO_BPS,
            PerpetualsError::InvalidCollateralRatio
        );

        // If liquidation threshold is set, ensure min collateral > liquidation threshold
        if let Some(threshold) = existing_liquidation_threshold {
            require!(ratio > threshold, PerpetualsError::InvalidCollateralRatio);
        }
    }
    Ok(())
}

/// Validates a baskt liquidation threshold BPS value (optional)
/// Used by baskt liquidation threshold setter
pub fn validate_baskt_liquidation_threshold_bps(
    threshold_bps: Option<u64>,
    existing_min_collateral_ratio: Option<u64>,
) -> Result<()> {
    if let Some(threshold) = threshold_bps {
        require!(
            threshold > 0 && threshold <= BPS_DIVISOR,
            PerpetualsError::InvalidCollateralRatio
        );

        // If min collateral ratio is set, ensure threshold < min collateral ratio
        if let Some(min_ratio) = existing_min_collateral_ratio {
            require!(
                threshold < min_ratio,
                PerpetualsError::InvalidCollateralRatio
            );
        }
    }
    Ok(())
}

/// Validates the baskt-level configuration using the same primitive checks as individual setters.
/// Used by the bulk update setter.
pub fn validate_baskt_config(config: &BasktConfig) -> Result<()> {
    // Validate all fee fields using the same validation as individual setters
    validate_baskt_fee_bps(config.get_opening_fee_bps())?;
    validate_baskt_fee_bps(config.get_closing_fee_bps())?;
    validate_baskt_fee_bps(config.get_liquidation_fee_bps())?;

    // Validate min collateral ratio with cross-validation against liquidation threshold
    validate_baskt_min_collateral_ratio_bps(
        config.get_min_collateral_ratio_bps(),
        config.get_liquidation_threshold_bps(),
    )?;

    // Validate liquidation threshold with cross-validation against min collateral ratio
    validate_baskt_liquidation_threshold_bps(
        config.get_liquidation_threshold_bps(),
        config.get_min_collateral_ratio_bps(),
    )?;

    Ok(())
}
