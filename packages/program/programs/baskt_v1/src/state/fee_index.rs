use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default, InitSpace)]
pub struct RebalanceFeeIndex {
    /// Cumulative rebalance fee index (monotonically increasing)
    /// Represents the total cumulative rebalance fee amount per unit position size
    /// Scaled by PRICE_PRECISION for precision
    pub cumulative_index: u64,
    
    /// Timestamp of the last rebalance that updated this index
    pub last_update_timestamp: i64,
    
    /// Current rebalance fee amount per unit position size (scaled by PRICE_PRECISION)
    /// This is the fee that will be applied in the next rebalance
    pub current_fee_per_unit: u64,
}

impl RebalanceFeeIndex {
    /// Initialize a new rebalance fee index
    pub fn initialize(&mut self, timestamp: i64) -> Result<()> {
        self.cumulative_index = 0; // Start at 0
        self.last_update_timestamp = timestamp;
        self.current_fee_per_unit = 0; // Start with no fee
        Ok(())
    }
        pub fn update_index(&mut self, new_fee_per_unit: u64, current_timestamp: i64) -> Result<()> {
        use crate::error::PerpetualsError;
        
        // Add the new fee to the cumulative index
        self.cumulative_index = self
            .cumulative_index
            .checked_add(new_fee_per_unit)
            .ok_or(PerpetualsError::MathOverflow)?;
        
        // Update timestamp and current fee
        self.last_update_timestamp = current_timestamp;
        self.current_fee_per_unit = new_fee_per_unit;
        
        Ok(())
    }
    

}