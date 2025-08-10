use anchor_lang::prelude::*;

use crate::constants::BPS_DIVISOR;
use crate::error::PerpetualsError;
use crate::math::{checked_percentage, checked_sub};

/// Calculate a generic fee from `amount * fee_bps / BPS_DIVISOR`.
/// Returns [`PerpetualsError::MathOverflow`] on overflow.
/// Returns [`PerpetualsError::InvalidFeeBps`] if fee_bps exceeds 100%.
pub fn calc_fee(amount: u64, fee_bps: u64) -> Result<u64> {
    // Validate fee_bps is within bounds (0-100%)
    require!(fee_bps <= BPS_DIVISOR, PerpetualsError::InvalidFeeBps);
    checked_percentage(amount, fee_bps, BPS_DIVISOR)
}

/// Calculate minimum collateral required based on notional value
/// Unlike calc_fee, this allows ratios above 100% (e.g., 110% = 11,000 bps)
pub fn calc_min_collateral_from_notional(
    notional_value: u64,
    min_collateral_ratio_bps: u64,
) -> Result<u64> {
    // Use checked_percentage directly without the 100% constraint from calc_fee
    checked_percentage(notional_value, min_collateral_ratio_bps, BPS_DIVISOR)
}

/// Calculate net collateral after deducting fee from total collateral
/// Fee should be calculated separately using calc_fee_from_notional
pub fn net_collateral_after_fee(total_collateral: u64, fee_amount: u64) -> Result<u64> {
    checked_sub(total_collateral, fee_amount)
}

/// Split an amount between treasury and BLP according to `treasury_cut_bps`.
/// Returns (to_treasury, to_blp).
pub fn split_fee(amount: u64, treasury_cut_bps: u64) -> Result<(u64, u64)> {
    let to_treasury = calc_fee(amount, treasury_cut_bps)?;
    let to_blp = checked_sub(amount, to_treasury)?;
    Ok((to_treasury, to_blp))
}

/// Validate a basis-points value (u16) does not exceed the supplied maximum.
/// Primarily used in configuration setter instructions.
pub fn validate_bps(value: u64, max: u64) -> Result<()> {
    require!(value <= max, PerpetualsError::InvalidFeeBps);
    Ok(())
}

/// Calculate opening fee with effective fee rate resolution
/// This helper consolidates the logic for getting effective opening fee BPS and calculating the fee
/// Used by both order validation (worst-case) and position opening (real execution)
pub fn calc_opening_fee_with_effective_rate(
    notional_value: u64,
    baskt_opening_fee_bps: Option<u64>,
    protocol_opening_fee_bps: u64,
) -> Result<u64> {
    use crate::utils::effective_u64;

    let opening_fee_bps = effective_u64(baskt_opening_fee_bps, protocol_opening_fee_bps);
    calc_fee(notional_value, opening_fee_bps)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calc_opening_fee_with_effective_rate() {
        // Test with baskt override
        let result = calc_opening_fee_with_effective_rate(
            1_000_000, // 1 USDC notional
            Some(50),  // 0.5% baskt fee (overrides protocol)
            10,        // 0.1% protocol fee
        )
        .unwrap();
        assert_eq!(result, 5000); // 1_000_000 * 50 / 10_000 = 5000

        // Test with protocol default (no baskt override)
        let result = calc_opening_fee_with_effective_rate(
            1_000_000, // 1 USDC notional
            None,      // No baskt override
            10,        // 0.1% protocol fee
        )
        .unwrap();
        assert_eq!(result, 1000); // 1_000_000 * 10 / 10_000 = 1000

        // Test with zero notional
        let result = calc_opening_fee_with_effective_rate(
            0,        // 0 notional
            Some(50), // 0.5% baskt fee
            10,       // 0.1% protocol fee
        )
        .unwrap();
        assert_eq!(result, 0);
    }
}
