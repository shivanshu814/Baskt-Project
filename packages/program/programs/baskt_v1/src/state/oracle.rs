//! Oracle price service handling

use {crate::error::PerpetualsError, anchor_lang::prelude::*};

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
}
