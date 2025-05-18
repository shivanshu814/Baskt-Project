use crate::{constants::*, error::PerpetualsError};
use anchor_lang::prelude::*;

//----------------------------------------------------------------------------
// STATE STRUCTURES: FUNDING
//----------------------------------------------------------------------------

#[account]
#[derive(InitSpace)]
pub struct FundingIndex {
    pub baskt_id: Pubkey,
    pub cumulative_index: i128,        // Global funding index (scaled by FUNDING_PRECISION)
    pub last_update_timestamp: i64,
    pub current_rate: i64,             // Current hourly rate (BPS, can be positive or negative)
    pub bump: u8,
}

impl FundingIndex {
    /// Initialize a new funding index for a basket
    /// The index starts at FUNDING_PRECISION (representing 1.0)
    pub fn initialize(
        &mut self,
        baskt_id: Pubkey,
        timestamp: i64,
        bump: u8,
    ) -> Result<()> {
        self.baskt_id = baskt_id;
        self.cumulative_index = Constants::FUNDING_PRECISION as i128; // Start at 1.0 (scaled)
        self.last_update_timestamp = timestamp;
        self.current_rate = 0;                       // Start with 0% funding rate
        self.bump = bump;
        Ok(())
    }

    /// Updates the cumulative funding index based on time elapsed and current rate
    ///
    /// The funding index starts at FUNDING_PRECISION (1.0 × 10^10) and accumulates.
    /// We use pure integer math for all calculations to maintain precision for sub-hourly periods.
    /// Formula: index_change = (old_rate_bps * time_elapsed * FUNDING_PRECISION) / (BPS_DIVISOR * SECONDS_IN_HOUR)
    /// new_index = old_index + index_change
    ///
    /// @param new_rate          The new hourly funding rate in BPS (e.g., 100 = 1% hourly)
    /// @param current_timestamp Current Unix timestamp
    /// @return Result with nothing or error
    pub fn update_index(&mut self, new_rate: i64, current_timestamp: i64) -> Result<()> {
        // Calculate time elapsed since last update in seconds
        let time_elapsed = current_timestamp.checked_sub(self.last_update_timestamp)
            .ok_or(PerpetualsError::MathOverflow)?;

        if time_elapsed <= 0 {
             // If time moves backwards or no time passed, only update the rate
            self.current_rate = new_rate;
            return Ok(());
        }

        // Calculate the funding increment for this period using the *old* rate
        // Formula: index_change = (old_rate_bps * time_elapsed * FUNDING_PRECISION) / (BPS_DIVISOR * SECONDS_IN_HOUR)
        
        // Calculate old_rate_bps * time_elapsed
        let rate_time_product = (self.current_rate as i128)
            .checked_mul(time_elapsed as i128)
            .ok_or(PerpetualsError::MathOverflow)?;
            
        // Multiply by FUNDING_PRECISION
        let scaled_product = rate_time_product
            .checked_mul(Constants::FUNDING_PRECISION as i128)
            .ok_or(PerpetualsError::MathOverflow)?;
            
        // Calculate the divisor: BPS_DIVISOR * SECONDS_IN_HOUR 
        let divisor = (Constants::BPS_DIVISOR as i128)
            .checked_mul(Constants::SECONDS_IN_HOUR as i128)
            .ok_or(PerpetualsError::MathOverflow)?;
            
        // Calculate the final index change
        let index_change = scaled_product
            .checked_div(divisor)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Update the cumulative index
        self.cumulative_index = self.cumulative_index
            .checked_add(index_change)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Update last update timestamp and set the new current rate for the *next* period
        self.last_update_timestamp = current_timestamp;
        self.current_rate = new_rate;

        Ok(())
    }
} 