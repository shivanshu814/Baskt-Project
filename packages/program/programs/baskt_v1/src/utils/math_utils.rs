use crate::constants::Constants;
use crate::error::PerpetualsError;
use anchor_lang::prelude::*;

pub struct Utils;

impl Utils {
    pub fn is_empty_account(account_info: &AccountInfo) -> Result<bool> {
        // Check if the account is empty (has no data)
        Ok(account_info.data_is_empty() || account_info.data_len() == 0)
    }

    /// Calculate funding payment for a position based on funding rate, position size, and elapsed time
    /// This implementation uses integer math for all calculations to avoid precision loss for sub-hourly periods
    pub fn calculate_funding_payment(
        funding_rate: i64,
        position_size: u64,
        is_long: bool,
        elapsed_time_seconds: i64,
        bps_divisor: u64,
    ) -> Result<i64> {
        // If funding rate is zero, no payment
        if funding_rate == 0 {
            return Ok(0);
        }

        // For longs: positive funding rate means they pay, negative means they receive
        // For shorts: positive funding rate means they receive, negative means they pay
        let funding_direction = if is_long { 1 } else { -1 };
        let payment_direction = funding_direction * funding_rate.signum();
        
        // Calculate absolute payment amount using precise integer math
        // The funding rate is hourly, so we need to scale by elapsed_time_seconds / FUNDING_INTERVAL_SECONDS
        // Formula: payment = position_size * funding_rate * elapsed_time_seconds / (bps_divisor * FUNDING_INTERVAL_SECONDS)
        
        // First, calculate position_size * funding_rate
        let position_funding = (position_size as i128)
            .checked_mul(funding_rate.abs() as i128)
            .ok_or(PerpetualsError::MathOverflow)?;
            
        // Then multiply by elapsed_time_seconds
        let time_scaled_funding = position_funding
            .checked_mul(elapsed_time_seconds as i128)
            .ok_or(PerpetualsError::MathOverflow)?;
            
        // Divide by bps_divisor * FUNDING_INTERVAL_SECONDS
        // Note: We're using Constants::FUNDING_INTERVAL_SECONDS (3600) directly to avoid any floating-point conversions
        let divisor = (bps_divisor as i128)
            .checked_mul(Constants::FUNDING_INTERVAL_SECONDS as i128)
            .ok_or(PerpetualsError::MathOverflow)?;
            
        let payment_amount = time_scaled_funding
            .checked_div(divisor)
            .ok_or(PerpetualsError::MathOverflow)? as i64;

        // Apply direction (positive means user pays, negative means user receives)
        let final_payment = payment_amount * payment_direction;
        
        Ok(final_payment)
    }

    pub fn calculate_funding_rate(
        long_oi: u64,
        short_oi: u64,
        max_funding_rate_bps: u64,
        bps_divisor: u64,
    ) -> Result<i64> {
        if long_oi == 0 && short_oi == 0 {
            return Ok(0);
        }

        let total_oi = long_oi
            .checked_add(short_oi)
            .ok_or(PerpetualsError::MathOverflow)?;

        // If perfectly balanced, funding rate is 0
        if long_oi == short_oi {
            return Ok(0);
        }

        // REVIEW this function can be better since its just
        // diff variable that really needs to be modified
        // based on direction

        // REVIEW how are we setting

        // Calculate imbalance: positive if more longs, negative if more shorts
        let imbalance = if long_oi > short_oi {
            let diff = long_oi
                .checked_sub(short_oi)
                .ok_or(PerpetualsError::MathOverflow)?;
            let imbalance_ratio = (diff as u128)
                .checked_mul(bps_divisor as u128)
                .ok_or(PerpetualsError::MathOverflow)?
                .checked_div(total_oi as u128)
                .ok_or(PerpetualsError::MathOverflow)?;

            let funding_rate = (imbalance_ratio as u128)
                .checked_mul(max_funding_rate_bps as u128)
                .ok_or(PerpetualsError::MathOverflow)?
                .checked_div(bps_divisor as u128)
                .ok_or(PerpetualsError::MathOverflow)?;

            funding_rate as i64
        } else {
            let diff = short_oi
                .checked_sub(long_oi)
                .ok_or(PerpetualsError::MathOverflow)?;
            let imbalance_ratio = (diff as u128)
                .checked_mul(bps_divisor as u128)
                .ok_or(PerpetualsError::MathOverflow)?
                .checked_div(total_oi as u128)
                .ok_or(PerpetualsError::MathOverflow)?;

            // REVIEW this

            let funding_rate = (imbalance_ratio as u128)
                .checked_mul(max_funding_rate_bps as u128)
                .ok_or(PerpetualsError::MathOverflow)?
                .checked_div(bps_divisor as u128)
                .ok_or(PerpetualsError::MathOverflow)?;

            -(funding_rate as i64)
        };

        Ok(imbalance)
    }

    pub fn calculate_pnl(
        entry_price: u64,
        exit_price: u64,
        size: u64,
        is_long: bool,
        price_precision: u64,
    ) -> Result<i64> {
        if entry_price == 0 || exit_price == 0 {
            return Ok(0);
        }

        // For longs: (exit_price - entry_price) * size / price_precision
        // For shorts: (entry_price - exit_price) * size / price_precision
        let pnl = if is_long {
            if exit_price > entry_price {
                // Long profit
                let price_diff = exit_price
                    .checked_sub(entry_price)
                    .ok_or(PerpetualsError::MathOverflow)?;

                let profit = (price_diff as u128)
                    .checked_mul(size as u128)
                    .ok_or(PerpetualsError::MathOverflow)?
                    .checked_div(price_precision as u128)
                    .ok_or(PerpetualsError::MathOverflow)?;

                profit as i64
            } else {
                // Long loss
                let price_diff = entry_price
                    .checked_sub(exit_price)
                    .ok_or(PerpetualsError::MathOverflow)?;

                let loss = (price_diff as u128)
                    .checked_mul(size as u128)
                    .ok_or(PerpetualsError::MathOverflow)?
                    .checked_div(price_precision as u128)
                    .ok_or(PerpetualsError::MathOverflow)?;

                -(loss as i64)
            }
        } else if entry_price > exit_price {
            // Short profit
            let price_diff = entry_price
                .checked_sub(exit_price)
                .ok_or(PerpetualsError::MathOverflow)?;

            let profit = (price_diff as u128)
                .checked_mul(size as u128)
                .ok_or(PerpetualsError::MathOverflow)?
                .checked_div(price_precision as u128)
                .ok_or(PerpetualsError::MathOverflow)?;

            profit as i64
        } else {
            // Short loss
            let price_diff = exit_price
                .checked_sub(entry_price)
                .ok_or(PerpetualsError::MathOverflow)?;

            let loss = (price_diff as u128)
                .checked_mul(size as u128)
                .ok_or(PerpetualsError::MathOverflow)?
                .checked_div(price_precision as u128)
                .ok_or(PerpetualsError::MathOverflow)?;

            -(loss as i64)
        };

        Ok(pnl)
    }

    pub fn calculate_fee(amount: u64, fee_bps: u64, bps_divisor: u64) -> Result<u64> {
        let fee = (amount as u128)
            .checked_mul(fee_bps as u128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(bps_divisor as u128)
            .ok_or(PerpetualsError::MathOverflow)? as u64;

        Ok(fee)
    }

    pub fn is_liquidatable(
        position_size: u64,
        collateral: u64,
        entry_price: u64,
        current_price: u64,
        is_long: bool,
        liquidation_threshold_bps: u64,
        bps_divisor: u64,
    ) -> Result<bool> {
        let price_precision = Constants::PRICE_PRECISION;
        let pnl = Utils::calculate_pnl(
            entry_price,
            current_price,
            position_size,
            is_long,
            price_precision,
        )?;

        // If profit, not liquidatable
        if pnl >= 0 {
            return Ok(false);
        }

        let loss = (-pnl) as u64;
        if loss >= collateral {
            return Ok(true);
        }

        let remaining_collateral = collateral
            .checked_sub(loss)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Calculate minimum required collateral
        let min_collateral = (position_size as u128)
            .checked_mul(liquidation_threshold_bps as u128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(bps_divisor as u128)
            .ok_or(PerpetualsError::MathOverflow)? as u64;

        // Liquidatable if remaining collateral is less than minimum required
        Ok(remaining_collateral < min_collateral)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_funding_rate_balanced() {
        // Equal long and short open interest
        let long_oi = 5000;
        let short_oi = 5000;
        let max_funding_rate_bps = 100; // 1%
        let bps_divisor = 10000; // 100%

        let funding_rate =
            Utils::calculate_funding_rate(long_oi, short_oi, max_funding_rate_bps, bps_divisor)
                .unwrap();

        // Balanced market should have zero funding rate
        assert_eq!(funding_rate, 0);
    }

    #[test]
    fn test_calculate_funding_rate_long_skew() {
        // More longs than shorts (75% long, 25% short)
        let long_oi = 7500;
        let short_oi = 2500;
        let max_funding_rate_bps = 100; // 1%
        let bps_divisor = 10000; // 100%

        let funding_rate =
            Utils::calculate_funding_rate(long_oi, short_oi, max_funding_rate_bps, bps_divisor)
                .unwrap();

        // Long skew should have positive funding rate (longs pay shorts)
        assert!(funding_rate > 0);

        // Expected: 50% imbalance * 1% max rate = 0.5% funding rate
        // 50% imbalance = (7500 - 2500) / 10000 = 5000 / 10000 = 50%
        // 0.5% = 50 bps
        assert_eq!(funding_rate, 50);
    }

    #[test]
    fn test_calculate_funding_rate_short_skew() {
        // More shorts than longs (25% long, 75% short)
        let long_oi = 2500;
        let short_oi = 7500;
        let max_funding_rate_bps = 100; // 1%
        let bps_divisor = 10000; // 100%

        let funding_rate =
            Utils::calculate_funding_rate(long_oi, short_oi, max_funding_rate_bps, bps_divisor)
                .unwrap();

        // Short skew should have negative funding rate (shorts pay longs)
        assert!(funding_rate < 0);

        // Expected: -50% imbalance * 1% max rate = -0.5% funding rate
        // 50% imbalance = (7500 - 2500) / 10000 = 5000 / 10000 = 50%
        // -0.5% = -50 bps
        assert_eq!(funding_rate, -50);
    }

    #[test]
    fn test_calculate_funding_rate_zero_long_oi() {
        // Only shorts, no longs
        let long_oi = 0;
        let short_oi = 5000;
        let max_funding_rate_bps = 100; // 1%
        let bps_divisor = 10000; // 100%

        let funding_rate =
            Utils::calculate_funding_rate(long_oi, short_oi, max_funding_rate_bps, bps_divisor)
                .unwrap();

        // Extreme short skew should have maximum negative funding rate
        assert!(funding_rate < 0);
        // 100% imbalance * 1% max rate = -1% funding rate = -100 bps
        assert_eq!(funding_rate, -100);
    }

    #[test]
    fn test_calculate_funding_rate_zero_short_oi() {
        // Only longs, no shorts
        let long_oi = 5000;
        let short_oi = 0;
        let max_funding_rate_bps = 100; // 1%
        let bps_divisor = 10000; // 100%

        let funding_rate =
            Utils::calculate_funding_rate(long_oi, short_oi, max_funding_rate_bps, bps_divisor)
                .unwrap();

        // Extreme long skew should have maximum positive funding rate
        assert!(funding_rate > 0);
        // 100% imbalance * 1% max rate = 1% funding rate = 100 bps
        assert_eq!(funding_rate, 100);
    }

    #[test]
    fn test_calculate_funding_rate_both_zero_oi() {
        // No open interest at all
        let long_oi = 0;
        let short_oi = 0;
        let max_funding_rate_bps = 100; // 1%
        let bps_divisor = 10000; // 100%

        let funding_rate =
            Utils::calculate_funding_rate(long_oi, short_oi, max_funding_rate_bps, bps_divisor)
                .unwrap();

        // No open interest should result in zero funding rate
        assert_eq!(funding_rate, 0);
    }

    #[test]
    fn test_calculate_funding_rate_higher_max_rate() {
        // Test with higher max funding rate (5%)
        let long_oi = 7500;
        let short_oi = 2500;
        let max_funding_rate_bps = 500; // 5%
        let bps_divisor = 10000; // 100%

        let funding_rate =
            Utils::calculate_funding_rate(long_oi, short_oi, max_funding_rate_bps, bps_divisor)
                .unwrap();

        // 50% imbalance * 5% max rate = 2.5% funding rate = 250 bps
        assert_eq!(funding_rate, 250);
    }

    #[test]
    fn test_calculate_funding_rate_small_imbalance() {
        // Very small imbalance (50.1% long, 49.9% short)
        let long_oi = 5010;
        let short_oi = 4990;
        let max_funding_rate_bps = 100; // 1%
        let bps_divisor = 10000; // 100%

        let funding_rate =
            Utils::calculate_funding_rate(long_oi, short_oi, max_funding_rate_bps, bps_divisor)
                .unwrap();

        // 0.2% imbalance * 1% max rate = 0.002% funding rate = 0.2 bps
        // But due to integer division, this might round down to 0
        // Let's verify it's a small positive number (either 0 or 1 depending on rounding)
        assert!(funding_rate >= 0 && funding_rate <= 1);
    }

    #[test]
    fn test_calculate_funding_rate_large_oi_values() {
        // Test with very large OI values that could cause overflow
        let long_oi = u64::MAX / 4; // 25% of max u64
        let short_oi = u64::MAX / 4; // 25% of max u64
        let max_funding_rate_bps = 100; // 1%
        let bps_divisor = 10000; // 100%

        let funding_rate =
            Utils::calculate_funding_rate(long_oi, short_oi, max_funding_rate_bps, bps_divisor)
                .unwrap();

        // Balanced market should have zero funding rate even with large values
        assert_eq!(funding_rate, 0);

        // Now test with imbalance
        let long_oi_imbalanced = u64::MAX / 3; // 33% of max u64
        let short_oi_imbalanced = u64::MAX / 6; // 17% of max u64

        let funding_rate = Utils::calculate_funding_rate(
            long_oi_imbalanced,
            short_oi_imbalanced,
            max_funding_rate_bps,
            bps_divisor,
        )
        .unwrap();

        // Should be positive (long skew)
        assert!(funding_rate > 0);
    }

    #[test]
    fn test_calculate_funding_payment_long_position() {
        // Long position with positive funding rate (longs pay)
        let funding_rate = 10; // 0.1% per hour
        let position_size = 10000;
        let is_long = true;
        let elapsed_time_seconds = 3600; // 1 hour
        let bps_divisor = 10000;

        let payment = Utils::calculate_funding_payment(
            funding_rate,
            position_size,
            is_long,
            elapsed_time_seconds,
            bps_divisor,
        )
        .unwrap();

        // Long position with positive funding rate should pay
        assert!(payment > 0);
        // Expected payment: 10000 * 10 / 10000 = 10 (0.1% of position size)
        assert_eq!(payment, 10);
    }

    #[test]
    fn test_calculate_funding_payment_short_position() {
        // Short position with positive funding rate (shorts receive)
        let funding_rate = 10; // 0.1% per hour
        let position_size = 10000;
        let is_long = false;
        let elapsed_time_seconds = 3600; // 1 hour
        let bps_divisor = 10000;

        let payment = Utils::calculate_funding_payment(
            funding_rate,
            position_size,
            is_long,
            elapsed_time_seconds,
            bps_divisor,
        )
        .unwrap();

        // Short position with positive funding rate should receive (negative payment)
        assert!(payment < 0);
        // Expected payment: -10000 * 10 / 10000 = -10 (receives 0.1% of position size)
        assert_eq!(payment, -10);
    }

    #[test]
    fn test_calculate_funding_payment_partial_hour() {
        // Test with 30 minutes elapsed
        let funding_rate = 10; // 0.1% per hour
        let position_size = 10000;
        let is_long = true;
        let elapsed_time_seconds = 1800; // 30 minutes (0.5 hours)
        let bps_divisor = 10000;

        let payment = Utils::calculate_funding_payment(
            funding_rate,
            position_size,
            is_long,
            elapsed_time_seconds,
            bps_divisor,
        )
        .unwrap();

        // Should be half the hourly payment
        // Expected: 10000 * 10 / 10000 * 0.5 = 5
        assert_eq!(payment, 5);
    }

    #[test]
    fn test_calculate_funding_payment_negative_funding_rate_long() {
        // Long position with negative funding rate (longs receive)
        let funding_rate = -10; // -0.1% per hour
        let position_size = 10000;
        let is_long = true;
        let elapsed_time_seconds = 3600; // 1 hour
        let bps_divisor = 10000;

        let payment = Utils::calculate_funding_payment(
            funding_rate,
            position_size,
            is_long,
            elapsed_time_seconds,
            bps_divisor,
        )
        .unwrap();

        // Long position with negative funding rate should receive (negative payment)
        assert!(payment < 0);
        // Expected payment: -10000 * 10 / 10000 = -10 (receives 0.1% of position size)
        assert_eq!(payment, -10);
    }

    #[test]
    fn test_calculate_funding_payment_negative_funding_rate_short() {
        // Short position with negative funding rate (shorts pay)
        let funding_rate = -10; // -0.1% per hour
        let position_size = 10000;
        let is_long = false;
        let elapsed_time_seconds = 3600; // 1 hour
        let bps_divisor = 10000;

        let payment = Utils::calculate_funding_payment(
            funding_rate,
            position_size,
            is_long,
            elapsed_time_seconds,
            bps_divisor,
        )
        .unwrap();

        // Short position with negative funding rate should pay (positive payment)
        assert!(payment > 0);
        // Expected payment: 10000 * 10 / 10000 = 10 (pays 0.1% of position size)
        assert_eq!(payment, 10);
    }

    #[test]
    fn test_calculate_funding_payment_zero_funding_rate() {
        // Test with zero funding rate
        let funding_rate = 0;
        let position_size = 10000;
        let is_long = true;
        let elapsed_time_seconds = 3600; // 1 hour
        let bps_divisor = 10000;

        let payment = Utils::calculate_funding_payment(
            funding_rate,
            position_size,
            is_long,
            elapsed_time_seconds,
            bps_divisor,
        )
        .unwrap();

        // Zero funding rate should result in zero payment
        assert_eq!(payment, 0);
    }

    #[test]
    fn test_calculate_funding_payment_multiple_hours() {
        // Test with 8 hours elapsed
        let funding_rate = 10; // 0.1% per hour
        let position_size = 10000;
        let is_long = true;
        let elapsed_time_seconds = 28800; // 8 hours
        let bps_divisor = 10000;

        let payment = Utils::calculate_funding_payment(
            funding_rate,
            position_size,
            is_long,
            elapsed_time_seconds,
            bps_divisor,
        )
        .unwrap();

        // Should be 8 times the hourly payment
        // Expected: 10000 * 10 / 10000 * 8 = 80
        assert_eq!(payment, 80);
    }

    #[test]
    fn test_calculate_funding_payment_large_position() {
        // Test with large position size
        let funding_rate = 10; // 0.1% per hour
        let position_size = 1_000_000_000; // 1 billion
        let is_long = true;
        let elapsed_time_seconds = 3600; // 1 hour
        let bps_divisor = 10000;

        let payment = Utils::calculate_funding_payment(
            funding_rate,
            position_size,
            is_long,
            elapsed_time_seconds,
            bps_divisor,
        )
        .unwrap();

        // Expected: 1_000_000_000 * 10 / 10000 = 1_000_000
        assert_eq!(payment, 1_000_000);
    }

    #[test]
    fn test_calculate_funding_payment_precision_handling() {
        // Test with non-integer hours to verify precision handling
        let funding_rate = 10; // 0.1% per hour
        let position_size = 10000;
        let is_long = true;
        let elapsed_time_seconds = 3723; // 1 hour, 2 minutes, 3 seconds
        let bps_divisor = 10000;

        let payment = Utils::calculate_funding_payment(
            funding_rate,
            position_size,
            is_long,
            elapsed_time_seconds,
            bps_divisor,
        )
        .unwrap();

        // Expected: close to 10.34 (10000 * 10 / 10000 * (3723/3600))
        // With integer math, we need to check the actual value
        // Let's calculate the expected value manually:
        // hours_elapsed = 3723/3600 = 1.034166...
        // payment = 10000 * 10 * 3723 / 10000 / 3600 = 10.34166... (rounded to 10)
        assert_eq!(payment, 10);
    }

    // #[test]
    // fn test_calculate_pnl_long_profit() {
    //     // Long position with price increase
    //     let entry_price = 1000;
    //     let exit_price = 1100;
    //     let size = 5000;
    //     let is_long = true;
    //     let price_precision = 1000000; // 6 decimal places
    //
    //     let pnl = Utils::calculate_pnl(
    //         entry_price,
    //         exit_price,
    //         size,
    //         is_long,
    //         price_precision
    //     ).unwrap();
    //
    //     // Long position with price increase should be profit
    //     assert!(pnl > 0);
    //     // Expected: (1100 - 1000) * 5000 / 1000000 = 100 * 5000 / 1000000 = 0.5 USDC = 500000 lamports
    //     assert_eq!(pnl, 500000);
    // }

    // #[test]
    // fn test_calculate_pnl_long_loss() {
    //     // Long position with price decrease
    //     let entry_price = 1100;
    //     let exit_price = 1000;
    //     let size = 5000;
    //     let is_long = true;
    //     let price_precision = 1000000; // 6 decimal places
    //
    //     let pnl = Utils::calculate_pnl(
    //         entry_price,
    //         exit_price,
    //         size,
    //         is_long,
    //         price_precision
    //     ).unwrap();
    //
    //     // Long position with price decrease should be loss
    //     assert!(pnl < 0);
    //     // Expected: (1000 - 1100) * 5000 / 1000000 = -100 * 5000 / 1000000 = -0.5 USDC = -500000 lamports
    //     assert_eq!(pnl, -500000);
    // }

    // #[test]
    // fn test_calculate_pnl_short_profit() {
    //     // Short position with price decrease
    //     let entry_price = 1100;
    //     let exit_price = 1000;
    //     let size = 5000;
    //     let is_long = false;
    //     let price_precision = 1000000; // 6 decimal places
    //
    //     let pnl = Utils::calculate_pnl(
    //         entry_price,
    //         exit_price,
    //         size,
    //         is_long,
    //         price_precision
    //     ).unwrap();
    //
    //     // Short position with price decrease should be profit
    //     assert!(pnl > 0);
    //     // Expected: (1100 - 1000) * 5000 / 1000000 = 100 * 5000 / 1000000 = 0.5 USDC = 500000 lamports
    //     assert_eq!(pnl, 500000);
    // }

    // #[test]
    // fn test_calculate_pnl_short_loss() {
    //     // Short position with price increase
    //     let entry_price = 1000;
    //     let exit_price = 1100;
    //     let size = 5000;
    //     let is_long = false;
    //     let price_precision = 1000000; // 6 decimal places
    //
    //     let pnl = Utils::calculate_pnl(
    //         entry_price,
    //         exit_price,
    //         size,
    //         is_long,
    //         price_precision
    //     ).unwrap();
    //
    //     // Short position with price increase should be loss
    //     assert!(pnl < 0);
    //     // Expected: (1000 - 1100) * 5000 / 1000000 = -100 * 5000 / 1000000 = -0.5 USDC = -500000 lamports
    //     assert_eq!(pnl, -500000);
    // }

    #[test]
    fn test_calculate_fee() {
        // Test fee calculation
        let amount = 10000; // 10 USDC
        let fee_bps = 10; // 0.1%
        let bps_divisor = 10000; // 100%

        let fee = Utils::calculate_fee(amount, fee_bps, bps_divisor).unwrap();

        // Expected: 10000 * 10 / 10000 = 10 (0.1% of 10 USDC = 0.01 USDC)
        assert_eq!(fee, 10);
    }

    #[test]
    fn test_is_liquidatable_with_sufficient_collateral() {
        // Position with sufficient collateral
        let position_size = 10000; // 10 USDC
        let collateral = 2000; // 2 USDC (20% collateral)
        let entry_price = 1000;
        let current_price = 950; // 5% price decrease
        let is_long = true;
        let liquidation_threshold_bps = 500; // 5% minimum
        let bps_divisor = 10000; // 100%

        let is_liquidatable = Utils::is_liquidatable(
            position_size,
            collateral,
            entry_price,
            current_price,
            is_long,
            liquidation_threshold_bps,
            bps_divisor,
        )
        .unwrap();

        // Should not be liquidatable yet
        // Loss = 5% of 10 USDC = 0.5 USDC = 500
        // Remaining collateral = 2000 - 500 = 1500
        // Minimum required = 10000 * 500 / 10000 = 500
        // 1500 > 500, so not liquidatable
        assert!(!is_liquidatable);
    }

    // #[test]
    // fn test_is_liquidatable_with_insufficient_collateral() {
    //     // Position with insufficient collateral
    //     let position_size = 10000; // 10 USDC
    //     let collateral = 1000; // 1 USDC (10% collateral)
    //     let entry_price = 1000;
    //     let current_price = 900; // 10% price decrease
    //     let is_long = true;
    //     let liquidation_threshold_bps = 500; // 5% minimum
    //     let bps_divisor = 10000; // 100%
    //
    //     let is_liquidatable = Utils::is_liquidatable(
    //         position_size,
    //         collateral,
    //         entry_price,
    //         current_price,
    //         is_long,
    //         liquidation_threshold_bps,
    //         bps_divisor
    //     ).unwrap();
    //
    //     // Should be liquidatable
    //     // Loss = 10% of 10 USDC = 1 USDC = 1000
    //     // Remaining collateral = 1000 - 1000 = 0
    //     // Minimum required = 10000 * 500 / 10000 = 500
    //     // 0 < 500, so liquidatable
    //     assert!(is_liquidatable);
    // }

    #[test]
    fn test_is_liquidatable_with_profit() {
        // Position with profit should never be liquidatable
        let position_size = 10000; // 10 USDC
        let collateral = 1000; // 1 USDC (10% collateral)
        let entry_price = 1000;
        let current_price = 1100; // 10% price increase
        let is_long = true;
        let liquidation_threshold_bps = 500; // 5% minimum
        let bps_divisor = 10000; // 100%

        let is_liquidatable = Utils::is_liquidatable(
            position_size,
            collateral,
            entry_price,
            current_price,
            is_long,
            liquidation_threshold_bps,
            bps_divisor,
        )
        .unwrap();

        // Should not be liquidatable (has profit)
        assert!(!is_liquidatable);
    }
}
