use crate::{
    constants::Constants,
    error::PerpetualsError,
    math,
    state::oracle::{OracleParams, OraclePrice},
    utils::Utils,
};
use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct SyntheticAsset {
    pub asset_id: Pubkey, // Account ID of the asset
    #[max_len(10)]
    pub ticker: String, // Ticker symbol for the asset (e.g., "BTC", "ETH")
    pub oracle: OracleParams, // Oracle providing asset price
    pub open_interest_long: u64, // Total open interest for long positions
    pub open_interest_short: u64, // Total open interest for short positions
    pub last_funding_update: i64, // Timestamp of last funding rate update
    pub funding_rate: i64, // Current funding rate
    pub total_funding_long: i64, // Total funding paid by longs
    pub total_funding_short: i64, // Total funding paid by shorts
    pub total_opening_fees: u64, // Total fees collected from opening positions
    pub total_closing_fees: u64, // Total fees collected from closing positions
    pub total_liquidation_fees: u64, // Total fees collected from liquidations
}

impl SyntheticAsset {
    /// Initialize a new synthetic asset
    pub fn initialize(
        &mut self,
        asset_id: Pubkey,
        ticker: String,
        oracle: OracleParams,
        timestamp: i64,
    ) -> Result<()> {
        self.asset_id = asset_id;
        self.ticker = ticker;
        self.oracle = oracle;
        self.open_interest_long = 0;
        self.open_interest_short = 0;
        self.last_funding_update = timestamp;
        self.funding_rate = 0;
        self.total_funding_long = 0;
        self.total_funding_short = 0;
        self.total_opening_fees = 0;
        self.total_closing_fees = 0;
        self.total_liquidation_fees = 0;

        Ok(())
    }

    /// Calculate the funding rate based on open interest imbalance
    pub fn calculate_funding_rate(
        &mut self,
        constants: &Constants,
        current_time: i64,
    ) -> Result<i64> {
        // Calculate funding rate using the Utils function
        let funding_rate = Utils::calculate_funding_rate(
            self.open_interest_long,
            self.open_interest_short,
            constants.MAX_FUNDING_RATE_BPS,
            constants.BPS_DIVISOR,
        )?;

        // Update the funding rate and last update time
        self.funding_rate = funding_rate;
        self.last_funding_update = current_time;

        Ok(funding_rate)
    }

    /// Calculate funding payment for a position
    pub fn calculate_funding_payment(
        &self,
        position_size: u64,
        is_long: bool,
        elapsed_time_seconds: i64,
        constants: &Constants,
    ) -> Result<i64> {
        // If no time has passed, no funding payment
        if elapsed_time_seconds <= 0 {
            return Ok(0);
        }

        // Use the Utils function to calculate the funding payment
        Utils::calculate_funding_payment(
            self.funding_rate,
            position_size,
            is_long,
            elapsed_time_seconds,
            constants.BPS_DIVISOR,
            constants.PRICE_PRECISION,
        )
    }

    /// Get the current price from the oracle
    pub fn get_price(
        &self,
        oracle_account_info: &AccountInfo,
        current_time: i64,
        use_ema: bool,
    ) -> Result<OraclePrice> {
        // Fetch the price from the oracle using the OraclePrice::new_from_oracle method
        OraclePrice::new_from_oracle(oracle_account_info, &self.oracle, current_time, use_ema)
    }

    /// Update open interest when a position is opened
    pub fn update_open_interest_for_open_position(
        &mut self,
        size: u64,
        is_long: bool,
    ) -> Result<()> {
        if is_long {
            self.open_interest_long = math::checked_add(self.open_interest_long, size)?;
        } else {
            self.open_interest_short = math::checked_add(self.open_interest_short, size)?;
        }

        Ok(())
    }

    /// Update open interest when a position is closed
    pub fn update_open_interest_for_close_position(
        &mut self,
        size: u64,
        is_long: bool,
    ) -> Result<()> {
        if is_long {
            self.open_interest_long = math::checked_sub(self.open_interest_long, size)?;
        } else {
            self.open_interest_short = math::checked_sub(self.open_interest_short, size)?;
        }

        Ok(())
    }

    /// Process opening a position
    pub fn process_open_position(
        &mut self,
        size: u64,
        is_long: bool,
        opening_fee: u64,
    ) -> Result<()> {
        // Update open interest
        self.update_open_interest_for_open_position(size, is_long)?;

        // Update fees
        self.total_opening_fees = math::checked_add(self.total_opening_fees, opening_fee)?;

        Ok(())
    }

    /// Process closing a position
    pub fn process_close_position(
        &mut self,
        size: u64,
        is_long: bool,
        closing_fee: u64,
        funding_payment: i64,
    ) -> Result<()> {
        // Update open interest
        self.update_open_interest_for_close_position(size, is_long)?;
        // Update total funding
        if funding_payment > 0 {
            // Positive means long pays funding
            self.total_funding_long =
                math::checked_add_signed(self.total_funding_long, funding_payment)?;
        } else {
            // Negative means long receives funding
            self.total_funding_short =
                math::checked_add_signed(self.total_funding_short, -funding_payment)?;
        }

        // Update fees
        self.total_closing_fees = math::checked_add(self.total_closing_fees, closing_fee)?;

        Ok(())
    }

    /// Process liquidating a position
    pub fn process_liquidation(
        &mut self,
        size: u64,
        is_long: bool,
        liquidation_fee: u64,
        funding_payment: i64,
    ) -> Result<()> {
        // Update open interest (same as closing)
        self.update_open_interest_for_close_position(size, is_long)?;
        // Update total funding
        if funding_payment > 0 {
            self.total_funding_long =
                math::checked_add_signed(self.total_funding_long, funding_payment)?;
        } else {
            self.total_funding_short =
                math::checked_add_signed(self.total_funding_short, -funding_payment)?;
        }

        // Update liquidation fees
        self.total_liquidation_fees =
            math::checked_add(self.total_liquidation_fees, liquidation_fee)?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_synthetic_asset_size() {
        // With InitSpace, we don't need to manually calculate the size
        // The discriminator (8 bytes) is automatically included
        assert!(SyntheticAsset::INIT_SPACE > 0);
    }

    #[test]
    fn test_initialize() {
        let mut asset = SyntheticAsset::default();
        let asset_id = Pubkey::new_unique();
        let oracle = OracleParams::default();
        let timestamp = 1234567890;

        asset
            .initialize(asset_id, "BTC".to_string(), oracle, timestamp)
            .unwrap();

        assert_eq!(asset.asset_id, asset_id);
        assert_eq!(asset.ticker, "BTC");
        assert_eq!(asset.oracle, oracle);
        assert_eq!(asset.open_interest_long, 0);
        assert_eq!(asset.open_interest_short, 0);
        assert_eq!(asset.last_funding_update, timestamp);
        assert_eq!(asset.funding_rate, 0);
        assert_eq!(asset.total_funding_long, 0);
        assert_eq!(asset.total_funding_short, 0);
        assert_eq!(asset.total_opening_fees, 0);
        assert_eq!(asset.total_closing_fees, 0);
        assert_eq!(asset.total_liquidation_fees, 0);
    }
    #[test]
    fn test_calculate_funding_rate_balanced() {
        let mut asset = SyntheticAsset::default();
        let asset_id = Pubkey::new_unique();
        let oracle = OracleParams::default();
        let price = 1000;
        let timestamp = 1234567890;

        asset
            .initialize(asset_id, "BTC".to_string(), oracle, timestamp)
            .unwrap();

        // Set equal long and short interest
        asset.open_interest_long = 5000;
        asset.open_interest_short = 5000;

        let constants = Constants::default();
        let funding_rate = asset
            .calculate_funding_rate(&constants, timestamp + 3600)
            .unwrap();

        // Equal interest should result in zero funding rate
        assert_eq!(funding_rate, 0);
        assert_eq!(asset.funding_rate, 0);
        assert_eq!(asset.last_funding_update, timestamp + 3600);
    }

    #[test]
    fn test_calculate_funding_rate_long_skew() {
        let mut asset = SyntheticAsset::default();
        let asset_id = Pubkey::new_unique();
        let oracle = OracleParams::default();
        let timestamp = 1234567890;

        asset
            .initialize(asset_id, "BTC".to_string(), oracle, timestamp)
            .unwrap();

        // Set more longs than shorts (75% long, 25% short)
        asset.open_interest_long = 7500;
        asset.open_interest_short = 2500;

        let constants = Constants::default();
        let funding_rate = asset
            .calculate_funding_rate(&constants, timestamp + 3600)
            .unwrap();

        // Should have positive funding rate (longs pay shorts)
        assert!(funding_rate > 0);
        assert_eq!(asset.funding_rate, funding_rate);
        assert_eq!(asset.last_funding_update, timestamp + 3600);
    }

    #[test]
    fn test_calculate_funding_rate_short_skew() {
        let mut asset = SyntheticAsset::default();
        let asset_id = Pubkey::new_unique();
        let oracle = OracleParams::default();
        let timestamp = 1234567890;

        asset
            .initialize(asset_id, "BTC".to_string(), oracle, timestamp)
            .unwrap();

        // Set more shorts than longs (25% long, 75% short)
        asset.open_interest_long = 2500;
        asset.open_interest_short = 7500;

        let constants = Constants::default();
        let funding_rate = asset
            .calculate_funding_rate(&constants, timestamp + 3600)
            .unwrap();

        // Should have negative funding rate (shorts pay longs)
        assert!(funding_rate < 0);
        assert_eq!(asset.funding_rate, funding_rate);
        assert_eq!(asset.last_funding_update, timestamp + 3600);
    }

    #[test]
    fn test_calculate_funding_payment_long_position() {
        let mut asset = SyntheticAsset::default();
        let asset_id = Pubkey::new_unique();
        let oracle = OracleParams::default();
        let timestamp = 1234567890;

        asset
            .initialize(asset_id, "BTC".to_string(), oracle, timestamp)
            .unwrap();

        // Set positive funding rate (longs pay shorts)
        asset.funding_rate = 10; // 0.1% per hour

        let position_size = 10000;
        let is_long = true;
        let elapsed_time_seconds = 3600; // 1 hour

        let constants = Constants::default();
        let payment = asset
            .calculate_funding_payment(position_size, is_long, elapsed_time_seconds, &constants)
            .unwrap();

        // Long position with positive funding rate should pay
        assert!(payment > 0);
        // Expected payment: 10000 * 10 / 10000 = 10 (0.1% of position size)
        assert_eq!(payment, 10);
    }

    #[test]
    fn test_calculate_funding_payment_short_position() {
        let mut asset = SyntheticAsset::default();
        let asset_id = Pubkey::new_unique();
        let oracle = OracleParams::default();
        let timestamp = 1234567890;

        asset
            .initialize(asset_id, "BTC".to_string(), oracle, timestamp)
            .unwrap();

        // Set positive funding rate (longs pay shorts)
        asset.funding_rate = 10; // 0.1% per hour

        let position_size = 10000;
        let is_long = false; // Short position
        let elapsed_time_seconds = 3600; // 1 hour

        let constants = Constants::default();
        let payment = asset
            .calculate_funding_payment(position_size, is_long, elapsed_time_seconds, &constants)
            .unwrap();

        // Short position with positive funding rate should receive (negative payment)
        assert!(payment < 0);
        // Expected payment: -10000 * 10 / 10000 = -10 (receives 0.1% of position size)
        assert_eq!(payment, -10);
    }

    #[test]
    fn test_process_open_position() {
        let mut asset = SyntheticAsset::default();
        let asset_id = Pubkey::new_unique();
        let oracle = OracleParams::default();
        let timestamp = 1234567890;

        asset
            .initialize(asset_id, "BTC".to_string(), oracle, timestamp)
            .unwrap();

        // Open a long position
        let size = 5000;
        let is_long = true;
        let opening_fee = 10;

        asset
            .process_open_position(size, is_long, opening_fee)
            .unwrap();

        assert_eq!(asset.open_interest_long, size);
        assert_eq!(asset.open_interest_short, 0);
        assert_eq!(asset.total_opening_fees, opening_fee);

        // Open a short position
        let size2 = 3000;
        let is_long2 = false;
        let opening_fee2 = 6;

        asset
            .process_open_position(size2, is_long2, opening_fee2)
            .unwrap();

        assert_eq!(asset.open_interest_long, size);
        assert_eq!(asset.open_interest_short, size2);
        assert_eq!(asset.total_opening_fees, opening_fee + opening_fee2);
    }

    #[test]
    fn test_process_close_position() {
        let mut asset = SyntheticAsset::default();
        let asset_id = Pubkey::new_unique();
        let oracle = OracleParams::default();
        let timestamp = 1234567890;

        asset
            .initialize(asset_id, "BTC".to_string(), oracle, timestamp)
            .unwrap();

        // Set initial open interest
        asset.open_interest_long = 5000;
        asset.open_interest_short = 3000;

        // Close a long position
        let size = 2000;
        let is_long = true;
        let closing_fee = 5;
        let funding_payment = 20; // Long pays funding

        asset
            .process_close_position(size, is_long, closing_fee, funding_payment)
            .unwrap();

        assert_eq!(asset.open_interest_long, 3000); // 5000 - 2000
        assert_eq!(asset.open_interest_short, 3000); // Unchanged
        assert_eq!(asset.total_closing_fees, closing_fee);
        assert_eq!(asset.total_funding_long, funding_payment);
        assert_eq!(asset.total_funding_short, 0);
    }

    #[test]
    fn test_process_liquidation() {
        let mut asset = SyntheticAsset::default();
        let asset_id = Pubkey::new_unique();
        let oracle = OracleParams::default();
        let timestamp = 1234567890;

        asset
            .initialize(asset_id, "BTC".to_string(), oracle, timestamp)
            .unwrap();

        // Set initial open interest
        asset.open_interest_long = 5000;
        asset.open_interest_short = 3000;

        // Liquidate a short position
        let size = 1000;
        let is_long = false;
        let liquidation_fee = 25;
        let funding_payment = -15; // Short receives funding

        asset
            .process_liquidation(size, is_long, liquidation_fee, funding_payment)
            .unwrap();

        assert_eq!(asset.open_interest_long, 5000); // Unchanged
        assert_eq!(asset.open_interest_short, 2000); // 3000 - 1000
        assert_eq!(asset.total_liquidation_fees, liquidation_fee);
        assert_eq!(asset.total_funding_long, 0); // Not updated when funding_payment < 0
        assert_eq!(asset.total_funding_short, 15); // Short pays 15 (absolute value of -15)
    }
}
