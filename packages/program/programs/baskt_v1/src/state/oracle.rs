//! Oracle price service handling

use {crate::error::PerpetualsError, crate::constants::Constants, anchor_lang::prelude::*};

#[derive(Clone, PartialEq, InitSpace, AnchorSerialize, AnchorDeserialize, Default, Debug)]
pub struct OracleParams {
    pub price: u64,
    pub max_price_age_sec: u32,
    pub publish_time: i64,
}

impl OracleParams {
    pub fn set(&mut self, price: u64, publish_time: i64, max_price_age_sec: u32) -> Result<()> {
        // Validate max_price_age_sec is not zero to ensure staleness checks always work
        require!(max_price_age_sec > 0, PerpetualsError::InvalidOracleParameter);
        
        self.price = price;
        self.publish_time = publish_time;
        self.max_price_age_sec = max_price_age_sec;
        
        Ok(())
    }
    pub fn update(&mut self, price: u64, publish_time: i64) {
        self.price = price;
        self.publish_time = publish_time;
    }
    pub fn get_price(&self, current_time: i64) -> Result<u64> {
        let last_update_age_sec = (current_time - self.publish_time) as u64; // Safe conversion for time difference
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

    /// Validate submitted price against oracle with deviation bounds
    /// Used for position operations to prevent price manipulation
    pub fn validate_submitted_price(
        &self,
        submitted_price: u64,
        max_deviation_bps: u64,
        current_time: i64,
    ) -> Result<()> {
        // First ensure oracle price is fresh and valid
        let oracle_price = self.get_price(current_time)?;
        
        // Validate submitted price is not zero
        require!(submitted_price > 0, PerpetualsError::InvalidOraclePrice);
        
        // Calculate maximum allowed deviation
        let max_deviation = (oracle_price as u128)
            .checked_mul(max_deviation_bps as u128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(Constants::BPS_DIVISOR as u128)
            .ok_or(PerpetualsError::MathOverflow)? as u64;
        
        let lower_bound = oracle_price.saturating_sub(max_deviation);
        let upper_bound = oracle_price
            .checked_add(max_deviation)
            .ok_or(PerpetualsError::MathOverflow)?;
        
        // Check if submitted price is within acceptable bounds
        if submitted_price < lower_bound || submitted_price > upper_bound {
            return err!(PerpetualsError::PriceOutOfBounds);
        }
        Ok(())
    }

    /// Validate price for liquidation with stricter bounds
    /// Liquidations should use conservative pricing to protect users
    pub fn validate_liquidation_price(
        &self,
        submitted_price: u64,
        current_time: i64,
    ) -> Result<()> {
        // Use stricter deviation bounds for liquidations (1% instead of standard 2.5%)
        self.validate_submitted_price(
            submitted_price,
            Constants::LIQUIDATION_PRICE_DEVIATION_BPS,
            current_time
        )
    }

    /// Validate price for position opening/closing
    pub fn validate_execution_price(
        &self,
        submitted_price: u64,
        current_time: i64,
    ) -> Result<()> {
        // Use standard deviation bounds for regular operations
        self.validate_submitted_price(
            submitted_price,
            Constants::MAX_PRICE_DEVIATION_BPS,
            current_time
        )
    }
}
