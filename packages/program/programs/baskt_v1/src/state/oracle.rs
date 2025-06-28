//! Oracle price service handling

use {
    crate::constants::{BPS_DIVISOR, LIQUIDATION_PRICE_DEVIATION_BPS, MAX_PRICE_DEVIATION_BPS},
    crate::error::PerpetualsError,
    crate::math::mul_div_u64,
    anchor_lang::prelude::*,
};

#[derive(Clone, PartialEq, InitSpace, AnchorSerialize, AnchorDeserialize, Default, Debug)]
pub struct OracleParams {
    pub price: u64,
    pub max_price_age_sec: u32,
    pub publish_time: i64,
}

impl OracleParams {
    pub fn set(&mut self, price: u64, publish_time: i64, max_price_age_sec: u32) -> Result<()> {
        // Validate max_price_age_sec is not zero to ensure staleness checks always work
        require!(
            max_price_age_sec > 0,
            PerpetualsError::InvalidOracleParameter
        );

        self.price = price;
        self.publish_time = publish_time;
        self.max_price_age_sec = max_price_age_sec;

        Ok(())
    }
    pub fn update(&mut self, price: u64, publish_time: i64) {
        self.price = price;
        self.publish_time = publish_time;
    }

    /// Internal helper to calculate safe time difference
    fn calculate_time_diff(&self, current_time: i64) -> Result<u64> {
        // Use saturating_sub to prevent underflow, then check for negative
        let time_diff = current_time.saturating_sub(self.publish_time);
        if time_diff < 0 {
            msg!("Error: Current time is before publish time");
            return err!(PerpetualsError::InvalidOraclePrice);
        }
        Ok(time_diff as u64)
    }

    /// Internal helper that accepts timestamp
    fn _get_price_with_time(&self, current_time: i64) -> Result<u64> {
        let last_update_age_sec = self.calculate_time_diff(current_time)?;

        if last_update_age_sec > self.max_price_age_sec as u64 {
            msg!("Error: Custom oracle price is stale");
            return err!(PerpetualsError::StaleOraclePrice);
        }

        let price = self.price;
        if price == 0 {
            msg!("Error: Custom oracle price is zero");
            return err!(PerpetualsError::InvalidOraclePrice);
        }

        Ok(price)
    }

    /// Get the current price, checking staleness using system clock
    pub fn get_price(&self) -> Result<u64> {
        let clock = Clock::get()?;
        self._get_price_with_time(clock.unix_timestamp)
    }

    /// Internal helper for price validation with timestamp
    fn _validate_submitted_price_with_time(
        &self,
        submitted_price: u64,
        max_deviation_bps: u64,
        current_time: i64,
    ) -> Result<()> {
        // First ensure oracle price is fresh and valid
        let oracle_price = self._get_price_with_time(current_time)?;

        // Validate submitted price is not zero
        require!(submitted_price > 0, PerpetualsError::InvalidOraclePrice);

        // Calculate maximum allowed deviation
        let max_deviation = mul_div_u64(oracle_price, max_deviation_bps, BPS_DIVISOR)?;

        // Use checked arithmetic for bounds calculation
        let lower_bound = oracle_price.checked_sub(max_deviation).unwrap_or(0); // Lower bound can't go below 0

        let upper_bound = oracle_price
            .checked_add(max_deviation)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Check if submitted price is within acceptable bounds
        if submitted_price < lower_bound || submitted_price > upper_bound {
            return err!(PerpetualsError::PriceOutOfBounds);
        }
        Ok(())
    }

    /// Validate submitted price against oracle with deviation bounds
    /// Used for position operations to prevent price manipulation
    pub fn validate_submitted_price(
        &self,
        submitted_price: u64,
        max_deviation_bps: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        self._validate_submitted_price_with_time(
            submitted_price,
            max_deviation_bps,
            clock.unix_timestamp,
        )
    }

    /// Validate price for liquidation with stricter bounds
    /// Liquidations should use conservative pricing to protect users
    pub fn validate_liquidation_price(&self, submitted_price: u64) -> Result<()> {
        // Use stricter deviation bounds for liquidations (20% instead of standard 25%)
        self.validate_submitted_price(submitted_price, LIQUIDATION_PRICE_DEVIATION_BPS)
    }

    /// Validate price for position opening/closing
    pub fn validate_execution_price(&self, submitted_price: u64) -> Result<()> {
        // Use standard deviation bounds for regular operations
        self.validate_submitted_price(submitted_price, MAX_PRICE_DEVIATION_BPS)
    }
}
