use crate::{constants::Constants, error::PerpetualsError, utils::Utils};
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, InitSpace, Clone, PartialEq, Debug)]
// REVIEW
// We should be a "Not Filled ?" if we have an offchain market making engine
// Then we need it to validate all the signatures befor we can make the user do it right?
// This potentialls means we will need to have txs per trade?
// Lets keep this configurable for now
// Set some amount of limits onchain.
pub enum PositionStatus {
    Open,
    Closed,
    Liquidated,
}

impl Default for PositionStatus {
    fn default() -> Self {
        Self::Open
    }
}

//REVIEW: Should this also have units? how many units of the baskt are bought so we can do average for the user?
#[account]
#[derive(Default, InitSpace)]
pub struct Position {
    pub owner: Pubkey,            // Trader's address
    pub baskt_id: Pubkey,         // Baskt ID
    pub size: u64,                // Position size in USDC
    pub collateral: u64,          // USDC collateral
    pub is_long: bool,            // True = Long, False = Short
    pub entry_price: u64,         // Entry price
    pub close_price: Option<u64>, // Closing price
    pub funding_accumulated: i64, // Funding accrued
    pub status: PositionStatus,   // OPEN, CLOSED, LIQUIDATED
    pub opening_fee: u64,         // Fee paid when opening position
    pub closing_fee: u64,         // Fee paid when closing position
    pub borrowing_fee: u64,       // Borrowing fee accumulated
    pub pnl: i64,                 // Profit and loss
    pub timestamp: i64,           // Time of taking the position
    pub funding_fee: i64,         // Funding fee accumulated
    pub liquidation_fee: u64,     // Fee paid if liquidated
}

impl Position {
    /// Initialize a new position
    pub fn initialize(
        &mut self,
        owner: Pubkey,
        baskt_id: Pubkey,
        size: u64,
        collateral: u64,
        is_long: bool,
        entry_price: u64,
        opening_fee: u64,
        timestamp: i64,
    ) -> Result<()> {
        // Validate position size
        if size == 0 {
            return Err(PerpetualsError::InvalidPositionSize.into());
        }

        // Validate collateral
        let min_collateral = (size as u128)
            .checked_mul(Constants::MIN_COLLATERAL_RATIO_BPS as u128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(Constants::BPS_DIVISOR as u128)
            .ok_or(PerpetualsError::MathOverflow)? as u64;

        if collateral < min_collateral {
            return Err(PerpetualsError::InsufficientCollateral.into());
        }

        self.owner = owner;
        self.baskt_id = baskt_id;
        self.size = size;
        self.collateral = collateral;
        self.is_long = is_long;
        self.entry_price = entry_price;
        self.close_price = None;
        self.funding_accumulated = 0;
        self.status = PositionStatus::Open;
        self.opening_fee = opening_fee;
        self.closing_fee = 0;
        self.borrowing_fee = 0;
        self.pnl = 0;
        self.timestamp = timestamp;
        self.funding_fee = 0;
        self.liquidation_fee = 0;

        Ok(())
    }

    /// Close a position
    pub fn close(&mut self, exit_price: u64, closing_fee: u64) -> Result<()> {
        if self.status != PositionStatus::Open {
            return Err(PerpetualsError::PositionAlreadyClosed.into());
        }

        // Calculate PnL
        let pnl = Utils::calculate_pnl(
            self.entry_price,
            exit_price,
            self.size,
            self.is_long,
            Constants::PRICE_PRECISION,
        )?;

        self.close_price = Some(exit_price);
        self.status = PositionStatus::Closed;
        self.closing_fee = closing_fee;
        self.pnl = pnl;

        Ok(())
    }

    /// Liquidate a position
    pub fn liquidate(&mut self, exit_price: u64, liquidation_fee: u64) -> Result<()> {
        if self.status != PositionStatus::Open {
            return Err(PerpetualsError::PositionAlreadyClosed.into());
        }

        // Check if position is liquidatable
        let is_liquidatable = Utils::is_liquidatable(
            self.size,
            self.collateral,
            self.entry_price,
            exit_price,
            self.is_long,
            Constants::LIQUIDATION_THRESHOLD_BPS,
            Constants::BPS_DIVISOR,
        )?;

        if !is_liquidatable {
            return Err(PerpetualsError::PositionNotLiquidatable.into());
        }

        // Calculate PnL
        let pnl = Utils::calculate_pnl(
            self.entry_price,
            exit_price,
            self.size,
            self.is_long,
            Constants::PRICE_PRECISION,
        )?;

        self.close_price = Some(exit_price);
        self.status = PositionStatus::Liquidated;
        self.liquidation_fee = liquidation_fee;
        self.pnl = pnl;

        Ok(())
    }

    /// Calculate the current PnL of the position
    pub fn calculate_current_pnl(&self, current_price: u64) -> Result<i64> {
        if self.status != PositionStatus::Open {
            return Ok(self.pnl);
        }

        Utils::calculate_pnl(
            self.entry_price,
            current_price,
            self.size,
            self.is_long,
            Constants::PRICE_PRECISION,
        )
    }

    /// Calculate the total collateral including PnL
    pub fn calculate_total_collateral(&self, current_price: u64) -> Result<i64> {
        let pnl = self.calculate_current_pnl(current_price)?;

        // If PnL is negative and exceeds collateral, return 0
        if pnl < 0 && pnl.abs() as u64 >= self.collateral {
            return Ok(0);
        }

        // Add PnL to collateral
        let total_collateral = (self.collateral as i64)
            .checked_add(pnl)
            .ok_or(PerpetualsError::MathOverflow)?;

        Ok(total_collateral)
    }

    /// Check if position is liquidatable
    pub fn is_liquidatable(&self, current_price: u64) -> Result<bool> {
        if self.status != PositionStatus::Open {
            return Ok(false);
        }

        Utils::is_liquidatable(
            self.size,
            self.collateral,
            self.entry_price,
            current_price,
            self.is_long,
            Constants::LIQUIDATION_THRESHOLD_BPS,
            Constants::BPS_DIVISOR,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_position_size() {
        // With InitSpace, we don't need to manually calculate the size
        // The discriminator (8 bytes) is automatically included
        assert!(Position::INIT_SPACE > 0);
    }

    #[test]
    fn test_position_initialize() {
        let mut position = Position::default();
        let owner = Pubkey::new_unique();
        let baskt_id = Pubkey::new_unique();
        let size = 1000;
        let collateral = 500; // 50% collateral ratio
        let is_long = true;
        let entry_price = 100;
        let opening_fee = 10;
        let timestamp = 1234567890;

        position
            .initialize(
                owner,
                baskt_id,
                size,
                collateral,
                is_long,
                entry_price,
                opening_fee,
                timestamp,
            )
            .unwrap();

        assert_eq!(position.owner, owner);
        assert_eq!(position.baskt_id, baskt_id);
        assert_eq!(position.size, size);
        assert_eq!(position.collateral, collateral);
        assert_eq!(position.is_long, is_long);
        assert_eq!(position.entry_price, entry_price);
        assert_eq!(position.close_price, None);
        assert_eq!(position.funding_accumulated, 0);
        assert_eq!(position.status, PositionStatus::Open);
        assert_eq!(position.opening_fee, opening_fee);
        assert_eq!(position.closing_fee, 0);
        assert_eq!(position.borrowing_fee, 0);
        assert_eq!(position.pnl, 0);
        assert_eq!(position.timestamp, timestamp);
        assert_eq!(position.funding_fee, 0);
        assert_eq!(position.liquidation_fee, 0);
    }

    // #[test]
    // fn test_position_initialize_invalid_size() {
    //     let mut position = Position::default();
    //     let owner = Pubkey::new_unique();
    //     let baskt_id = Pubkey::new_unique();
    //     let size = 0; // Invalid size
    //     let collateral = 500;
    //     let is_long = true;
    //     let entry_price = 100;
    //     let opening_fee = 10;
    //     let timestamp = 1234567890;
    //
    //     let result = position.initialize(
    //         owner,
    //         baskt_id,
    //         size,
    //         collateral,
    //         is_long,
    //         entry_price,
    //         opening_fee,
    //         timestamp,
    //     );
    //
    //     assert!(result.is_err());
    //     assert_eq!(result.unwrap_err().to_string(), PerpetualsError::InvalidPositionSize.to_string());
    // }

    // #[test]
    // fn test_position_close() {
    //     let mut position = Position::default();
    //     let owner = Pubkey::new_unique();
    //     let baskt_id = Pubkey::new_unique();
    //     let size = 1000;
    //     let collateral = 500;
    //     let is_long = true;
    //     let entry_price = 100;
    //     let exit_price = 120; // 20% profit
    //     let opening_fee = 10;
    //     let closing_fee = 15;
    //     let timestamp = 1234567890;
    //
    //     position.initialize(
    //         owner,
    //         baskt_id,
    //         size,
    //         collateral,
    //         is_long,
    //         entry_price,
    //         opening_fee,
    //         timestamp,
    //     ).unwrap();
    //
    //     position.close(exit_price, closing_fee).unwrap();
    //
    //     assert_eq!(position.status, PositionStatus::Closed);
    //     assert_eq!(position.close_price, Some(exit_price));
    //     assert_eq!(position.closing_fee, closing_fee);
    //     assert!(position.pnl > 0); // Should have profit
    // }

    // #[test]
    // fn test_position_close_already_closed() {
    //     let mut position = Position::default();
    //     let owner = Pubkey::new_unique();
    //     let baskt_id = Pubkey::new_unique();
    //     let size = 1000;
    //     let collateral = 500;
    //     let is_long = true;
    //     let entry_price = 100;
    //     let exit_price = 120;
    //     let opening_fee = 10;
    //     let closing_fee = 15;
    //     let timestamp = 1234567890;
    //
    //     position.initialize(
    //         owner,
    //         baskt_id,
    //         size,
    //         collateral,
    //         is_long,
    //         entry_price,
    //         opening_fee,
    //         timestamp,
    //     ).unwrap();
    //
    //     position.close(exit_price, closing_fee).unwrap();
    //
    //     // Try to close again
    //     let result = position.close(exit_price, closing_fee);
    //
    //     assert!(result.is_err());
    //     assert_eq!(result.unwrap_err().to_string(), PerpetualsError::PositionAlreadyClosed.to_string());
    // }

    // #[test]
    // fn test_position_liquidate() {
    //     let mut position = Position::default();
    //     let owner = Pubkey::new_unique();
    //     let baskt_id = Pubkey::new_unique();
    //     let size = 1000;
    //     let collateral = 100; // 10% collateral (low for testing liquidation)
    //     let is_long = true;
    //     let entry_price = 100;
    //     let exit_price = 80; // 20% loss, should be liquidatable
    //     let opening_fee = 10;
    //     let liquidation_fee = 20;
    //     let timestamp = 1234567890;
    //
    //     position.initialize(
    //         owner,
    //         baskt_id,
    //         size,
    //         collateral,
    //         is_long,
    //         entry_price,
    //         opening_fee,
    //         timestamp,
    //     ).unwrap();
    //
    //     position.liquidate(exit_price, liquidation_fee).unwrap();
    //
    //     assert_eq!(position.status, PositionStatus::Liquidated);
    //     assert_eq!(position.close_price, Some(exit_price));
    //     assert_eq!(position.liquidation_fee, liquidation_fee);
    //     assert!(position.pnl < 0); // Should have loss
    // }

    // #[test]
    // fn test_calculate_current_pnl() {
    //     let mut position = Position::default();
    //     let owner = Pubkey::new_unique();
    //     let baskt_id = Pubkey::new_unique();
    //     let size = 1000;
    //     let collateral = 500;
    //     let is_long = true;
    //     let entry_price = 100;
    //     let current_price = 110; // 10% profit
    //     let opening_fee = 10;
    //     let timestamp = 1234567890;
    //
    //     position.initialize(
    //         owner,
    //         baskt_id,
    //         size,
    //         collateral,
    //         is_long,
    //         entry_price,
    //         opening_fee,
    //         timestamp,
    //     ).unwrap();
    //
    //     let pnl = position.calculate_current_pnl(current_price).unwrap();
    //
    //     assert!(pnl > 0); // Should have profit
    //
    //     // For a long position with 10% price increase, PnL should be 10% of size
    //     let expected_pnl = (size as f64 * 0.1) as i64;
    //     assert_eq!(pnl, expected_pnl);
    // }

    #[test]
    fn test_calculate_total_collateral() {
        let mut position = Position::default();
        let owner = Pubkey::new_unique();
        let baskt_id = Pubkey::new_unique();
        let size = 1000;
        let collateral = 500;
        let is_long = true;
        let entry_price = 100;
        let current_price = 110; // 10% profit
        let opening_fee = 10;
        let timestamp = 1234567890;

        position
            .initialize(
                owner,
                baskt_id,
                size,
                collateral,
                is_long,
                entry_price,
                opening_fee,
                timestamp,
            )
            .unwrap();

        let total_collateral = position.calculate_total_collateral(current_price).unwrap();

        // Total collateral should be original collateral + PnL
        let pnl = position.calculate_current_pnl(current_price).unwrap();
        let expected_total = collateral as i64 + pnl;

        assert_eq!(total_collateral, expected_total);
    }

    // #[test]
    // fn test_is_liquidatable() {
    //     let mut position = Position::default();
    //     let owner = Pubkey::new_unique();
    //     let baskt_id = Pubkey::new_unique();
    //     let size = 1000;
    //     let collateral = 100; // 10% collateral (low for testing liquidation)
    //     let is_long = true;
    //     let entry_price = 100;
    //     let opening_fee = 10;
    //     let timestamp = 1234567890;
    //
    //     position.initialize(
    //         owner,
    //         baskt_id,
    //         size,
    //         collateral,
    //         is_long,
    //         entry_price,
    //         opening_fee,
    //         timestamp,
    //     ).unwrap();
    //
    //     // Price drops 5% - should not be liquidatable yet
    //     let current_price_1 = 95;
    //     let is_liquidatable_1 = position.is_liquidatable(current_price_1).unwrap();
    //     assert!(!is_liquidatable_1);
    //
    //     // Price drops 15% - should be liquidatable
    //     let current_price_2 = 85;
    //     let is_liquidatable_2 = position.is_liquidatable(current_price_2).unwrap();
    //     assert!(is_liquidatable_2);
    // }
}
