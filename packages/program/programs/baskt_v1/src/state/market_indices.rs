use crate::{
    constants::{BPS_DIVISOR, FUNDING_PRECISION, SECONDS_IN_HOUR},
    error::PerpetualsError,
};
use anchor_lang::prelude::*;

//----------------------------------------------------------------------------
// STATE STRUCTURES: MARKET INDICES
//----------------------------------------------------------------------------

#[account]
#[derive(InitSpace)]
pub struct MarketIndices {
    // Funding fields (existing, renamed for clarity)
    pub cumulative_funding_index: i128, // Global funding index (scaled by FUNDING_PRECISION)
    pub current_funding_rate: i64, // Current hourly funding rate (BPS, can be positive or negative)
    
    // Borrow fields (new)
    pub cumulative_borrow_index: i128, // Global borrow index (scaled by FUNDING_PRECISION, always increases)
    pub current_borrow_rate: i64, // Current hourly borrow rate (BPS, always positive)
    
    // Shared timestamp
    pub last_update_timestamp: i64,
}

impl MarketIndices {
    /// Initialize new market indices for a basket
    /// Both indices start at FUNDING_PRECISION (representing 1.0)
    pub fn initialize(&mut self, timestamp: i64) -> Result<()> {
        self.cumulative_funding_index = FUNDING_PRECISION as i128; // Start at 1.0 (scaled)
        self.cumulative_borrow_index = FUNDING_PRECISION as i128; // Start at 1.0 (scaled)
        self.current_funding_rate = 0; // Start with 0% funding rate
        self.current_borrow_rate = 0; // Start with 0% borrow rate
        self.last_update_timestamp = timestamp;
        Ok(())
    }

    /// Updates both cumulative indices based on time elapsed and current rates
    ///
    /// Both indices start at FUNDING_PRECISION (1.0 × 10^10) and accumulate.
    /// We use pure integer math for all calculations to maintain precision for sub-hourly periods.
    /// Formula: index_change = (old_rate_bps * time_elapsed * FUNDING_PRECISION) / (BPS_DIVISOR * SECONDS_IN_HOUR)
    /// new_index = old_index + index_change
    ///
    /// @param new_funding_rate  The new hourly funding rate in BPS (can be positive or negative)
    /// @param new_borrow_rate   The new hourly borrow rate in BPS (always positive)
    /// @param current_timestamp Current Unix timestamp
    /// @return Result with nothing or error
    pub fn update_indices(&mut self, new_funding_rate: i64, new_borrow_rate: i64, current_timestamp: i64) -> Result<()> {
        // Calculate time elapsed since last update in seconds
        let time_elapsed = current_timestamp
            .checked_sub(self.last_update_timestamp)
            .ok_or(PerpetualsError::MathOverflow)?;

        if time_elapsed <= 0 {
            // If time moves backwards or no time passed, only update the rates
            self.current_funding_rate = new_funding_rate;
            self.current_borrow_rate = new_borrow_rate;
            return Ok(());
        }

        // Update funding index (can go up or down)
        let funding_change = self.calculate_index_change(self.current_funding_rate, time_elapsed)?;
        self.cumulative_funding_index = self.cumulative_funding_index
            .checked_add(funding_change)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Update borrow index (always increases, borrow rate is always positive)
        let borrow_change = self.calculate_index_change(self.current_borrow_rate, time_elapsed)?;
        self.cumulative_borrow_index = self.cumulative_borrow_index
            .checked_add(borrow_change)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Update rates and timestamp for the *next* period
        self.current_funding_rate = new_funding_rate;
        self.current_borrow_rate = new_borrow_rate;
        self.last_update_timestamp = current_timestamp;

        Ok(())
    }

    /// Helper method to calculate index change for a given rate and time elapsed
    fn calculate_index_change(&self, rate_bps: i64, time_elapsed: i64) -> Result<i128> {
        // Formula: index_change = (rate_bps * time_elapsed * FUNDING_PRECISION) / (BPS_DIVISOR * SECONDS_IN_HOUR)
        
        // Calculate rate_bps * time_elapsed
        let rate_time_product = (rate_bps as i128)
            .checked_mul(time_elapsed as i128)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Multiply by FUNDING_PRECISION
        let scaled_product = rate_time_product
            .checked_mul(FUNDING_PRECISION as i128)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Calculate the divisor: BPS_DIVISOR * SECONDS_IN_HOUR
        let divisor = (BPS_DIVISOR as i128)
            .checked_mul(SECONDS_IN_HOUR as i128)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Calculate the final index change
        let index_change = scaled_product
            .checked_div(divisor)
            .ok_or(PerpetualsError::MathOverflow)?;

        Ok(index_change)
    }
}
