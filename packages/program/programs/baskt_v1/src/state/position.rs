use crate::{
    constants::{
        BPS_DIVISOR, FUNDING_PRECISION, LIQUIDATION_THRESHOLD_BPS, MIN_COLLATERAL_RATIO_BPS,
        PRICE_PRECISION,
    },
    error::PerpetualsError,
};
use anchor_lang::prelude::*;

//----------------------------------------------------------------------------
// STATE STRUCTURES: POSITION
//----------------------------------------------------------------------------

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug, Default, InitSpace)]
pub enum PositionStatus {
    #[default]
    Open,
    Closed,
    Liquidated,
}

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub owner: Pubkey,
    pub position_id: u64,
    pub baskt_id: Pubkey,
    pub size: u64,
    pub collateral: u64,
    pub is_long: bool,
    pub entry_price: u64,
    pub exit_price: Option<u64>,
    pub entry_funding_index: i128, // Index at position open (scaled by FUNDING_PRECISION)
    pub last_funding_index: i128,  // Last updated index (scaled by FUNDING_PRECISION)
    pub funding_accumulated: i128, // Total funding paid/received (scaled by token decimals, NOT funding precision)
    pub status: PositionStatus,
    pub timestamp_open: i64,
    pub timestamp_close: Option<i64>,
    pub bump: u8,
}

#[account]
#[derive(Default, InitSpace)]
pub struct ProgramAuthority {}

impl Position {
    /// Initializes a new position with the given parameters
    pub fn initialize(
        &mut self,
        owner: Pubkey,
        position_id: u64,
        baskt_id: Pubkey,
        size: u64,
        collateral: u64,
        is_long: bool,
        entry_price: u64,
        entry_funding_index: i128,
        timestamp_open: i64,
        bump: u8,
    ) -> Result<()> {
        require!(size > 0, PerpetualsError::ZeroSizedPosition);
        require!(collateral > 0, PerpetualsError::InsufficientCollateral);

        // Check minimum collateral ratio
        let min_collateral = (size as u128)
            .checked_mul(MIN_COLLATERAL_RATIO_BPS as u128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(BPS_DIVISOR as u128)
            .ok_or(PerpetualsError::MathOverflow)? as u64;

        require!(
            collateral >= min_collateral,
            PerpetualsError::InsufficientCollateral
        );

        self.owner = owner;
        self.position_id = position_id;
        self.baskt_id = baskt_id;
        self.size = size;
        self.collateral = collateral;
        self.is_long = is_long;
        self.entry_price = entry_price;
        self.exit_price = None;
        self.entry_funding_index = entry_funding_index;
        self.last_funding_index = entry_funding_index;
        self.funding_accumulated = 0;
        self.status = PositionStatus::Open;
        self.timestamp_open = timestamp_open;
        self.timestamp_close = None;
        self.bump = bump;
        Ok(())
    }

    /// Add collateral to an existing position
    pub fn add_collateral(&mut self, additional_collateral: u64) -> Result<()> {
        require!(
            self.status == PositionStatus::Open,
            PerpetualsError::PositionAlreadyClosed
        );
        require!(
            additional_collateral > 0,
            PerpetualsError::InsufficientCollateral
        );

        // Check for overflow before adding collateral
        // This provides a specific error for collateral overflow vs. general math overflow
        let new_collateral = self
            .collateral
            .checked_add(additional_collateral)
            .ok_or(PerpetualsError::CollateralOverflow)?;

        // Update the collateral amount
        self.collateral = new_collateral;

        Ok(())
    }

    /// Close the position with given exit price and funding index
    pub fn settle_close(
        &mut self,
        exit_price: u64,
        current_funding_index: i128,
        timestamp_close: i64,
    ) -> Result<()> {
        require!(
            self.status == PositionStatus::Open,
            PerpetualsError::PositionAlreadyClosed
        );

        // Update funding accumulated
        self.update_funding(current_funding_index)?;

        // Close the position
        self.exit_price = Some(exit_price);
        self.status = PositionStatus::Closed;
        self.timestamp_close = Some(timestamp_close);

        Ok(())
    }

    /// Liquidate the position with given exit price and funding index
    /// Note: This assumes update_funding has already been called before this method
    pub fn liquidate(
        &mut self,
        exit_price: u64,
        current_funding_index: i128,
        timestamp_close: i64,
    ) -> Result<()> {
        require!(
            self.status == PositionStatus::Open,
            PerpetualsError::PositionAlreadyClosed
        );

        // We don't need to update funding here as it should be done before calling this method
        // Just verify that the funding index is up to date
        require!(
            self.last_funding_index == current_funding_index,
            PerpetualsError::FundingNotUpToDate
        );

        // Liquidate the position
        self.exit_price = Some(exit_price);
        self.status = PositionStatus::Liquidated;
        self.timestamp_close = Some(timestamp_close);

        Ok(())
    }

    /// Update funding for this position based on the current funding index
    /// The funding payment is based on:
    /// - The difference between current index and last saved index
    /// - The position size
    /// - The position direction (long pays on positive index delta, short pays on negative)
    /// Resulting payment is scaled by token decimals.
    pub fn update_funding(&mut self, current_funding_index: i128) -> Result<()> {
        // Calculate index delta (scaled by FUNDING_PRECISION)
        let index_delta = current_funding_index
            .checked_sub(self.last_funding_index)
            .ok_or(PerpetualsError::MathOverflow)?;

        if index_delta == 0 {
            self.last_funding_index = current_funding_index;
            return Ok(()); // No change in index, no funding payment
        }

        // For longs: positive index delta means they pay, negative means they receive
        // For shorts: invert the payment direction
        let direction_multiplier: i128 = if self.is_long { -1 } else { 1 };

        // Calculate funding payment: size * index_delta * direction / FUNDING_PRECISION
        // Result is scaled by token decimals (implicitly, as size is scaled)
        let funding_payment = (self.size as i128)
            .checked_mul(index_delta)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_mul(direction_multiplier)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(FUNDING_PRECISION as i128)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Update accumulated funding and last index
        self.funding_accumulated = self
            .funding_accumulated
            .checked_add(funding_payment)
            .ok_or(PerpetualsError::MathOverflow)?;

        self.last_funding_index = current_funding_index;

        Ok(())
    }

    /// Calculate realized PnL for this position (scaled by token decimals)
    /// Requires the position to have an exit price
    pub fn calculate_pnl(&self) -> Result<i64> {
        // Require that position has an exit price
        let exit_price = self.exit_price.ok_or(PerpetualsError::PositionStillOpen)?;

        // Calculate price difference based on direction
        // PnL = direction * (exit_price - entry_price) * size / PRICE_PRECISION
        let price_delta = if self.is_long {
            // For longs: profit if exit_price > entry_price
            (exit_price as i128).checked_sub(self.entry_price as i128)
        } else {
            // For shorts: profit if entry_price > exit_price
            (self.entry_price as i128).checked_sub(exit_price as i128)
        }
        .ok_or(PerpetualsError::MathOverflow)?;

        let pnl = (price_delta)
            .checked_mul(self.size as i128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(PRICE_PRECISION as i128)
            .ok_or(PerpetualsError::MathOverflow)?
            .try_into()
            .map_err(|_| PerpetualsError::MathOverflow)?;

        Ok(pnl)
    }

    /// Check if position can be liquidated at the given price
    pub fn is_liquidatable(&self, current_price: u64) -> Result<bool> {
        // Calculate unrealized PnL
        let unrealized_pnl = self.calculate_unrealized_pnl(current_price)?;

        // Calculate total equity = collateral + unrealized_pnl + funding_accumulated
        let total_equity = (self.collateral as i128)
            .checked_add(unrealized_pnl as i128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_add(self.funding_accumulated)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Calculate minimum required collateral based on threshold
        let min_collateral = (self.size as u128)
            .checked_mul(LIQUIDATION_THRESHOLD_BPS as u128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(BPS_DIVISOR as u128)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Liquidatable if total equity falls below the maintenance margin
        // This allows liquidation even when equity is positive but below threshold
        Ok(total_equity < min_collateral as i128)
    }

    /// Calculate unrealized PnL at a specific price (scaled by token decimals)
    pub fn calculate_unrealized_pnl(&self, current_price: u64) -> Result<i64> {
        // Calculate price difference based on direction
        // PnL = direction * (current_price - entry_price) * size / PRICE_PRECISION
        let price_delta = if self.is_long {
            // For longs: profit if current_price > entry_price
            (current_price as i128).checked_sub(self.entry_price as i128)
        } else {
            // For shorts: profit if entry_price > current_price
            (self.entry_price as i128).checked_sub(current_price as i128)
        }
        .ok_or(PerpetualsError::MathOverflow)?;

        let pnl = (price_delta)
            .checked_mul(self.size as i128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(PRICE_PRECISION as i128)
            .ok_or(PerpetualsError::MathOverflow)?
            .try_into()
            .map_err(|_| PerpetualsError::MathOverflow)?;

        Ok(pnl)
    }
}
