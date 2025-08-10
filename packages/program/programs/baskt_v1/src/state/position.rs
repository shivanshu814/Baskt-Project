use crate::{
    constants::{FUNDING_PRECISION, PRICE_PRECISION, BPS_DIVISOR},
    error::PerpetualsError,
    math::mul_div_u64,
    utils::calc_fee,
};
use anchor_lang::prelude::*;

//----------------------------------------------------------------------------
// STATE STRUCTURES: POSITION
//----------------------------------------------------------------------------

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug, Default, InitSpace)]
#[repr(u8)]
pub enum PositionStatus {
    #[default]
    Open = 0,
    Closed = 1,
    Liquidated = 2,
    ForceClosed = 3,
}

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub owner: Pubkey,
    pub position_id: u32,
    pub baskt_id: Pubkey,
    pub size: u64,
    pub collateral: u64,
    pub is_long: bool,
    pub entry_price: u64,
    pub exit_info: ExitInfo,
    pub last_funding_index: i128,  // Last updated index (scaled by FUNDING_PRECISION)
    pub funding_accumulated: i128, // Total funding paid/received (scaled by token decimals, NOT funding precision)
    pub last_rebalance_fee_index: u64, // Last applied rebalance fee index (prevents double charging)
    pub status: PositionStatus,
    pub timestamp_open: u32,
    pub bump: u8,

    // Extra Space
    pub extra_space: [u8; 120],
}

// Combined exit information
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub enum ExitInfo {
    None,
    Closed { price: u64, timestamp: u32 },
    Liquidated { price: u64, timestamp: u32 },
    ForceClosed { price: u64, timestamp: u32 },
}

#[account]
#[derive(Default, InitSpace)]
pub struct ProgramAuthority {}

impl Position {
    /// Initializes a new position with the given parameters
    /// Note: Collateral validation should be done before calling this method
    /// using the real notional value (size * entry_price)
    pub fn initialize(
        &mut self,
        owner: Pubkey,
        position_id: u32,
        baskt_id: Pubkey,
        size: u64,
        collateral: u64,
        is_long: bool,
        entry_price: u64,
        entry_funding_index: i128,
        entry_rebalance_fee_index: u64,
        timestamp_open: u32,
        bump: u8,
    ) -> Result<()> {
        require!(size > 0, PerpetualsError::ZeroSizedPosition);
        require!(collateral > 0, PerpetualsError::InsufficientCollateral);
        require!(entry_price > 0, PerpetualsError::InvalidOraclePrice);

        // Note: Collateral validation is now done in the calling instruction
        // using the real notional value (size * entry_price) instead of just size

        self.owner = owner;
        self.position_id = position_id;
        self.baskt_id = baskt_id;
        self.size = size;
        self.collateral = collateral;
        self.is_long = is_long;
        self.entry_price = entry_price;
        self.exit_info = ExitInfo::None;
        self.last_funding_index = entry_funding_index;
        self.funding_accumulated = 0;
        self.last_rebalance_fee_index = entry_rebalance_fee_index;
        self.status = PositionStatus::Open;
        self.timestamp_open = timestamp_open;
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

    /// Update funding for this position based on the current funding index
    /// The funding payment is based on:
    /// - The difference between current index and last saved index
    /// - The position size
    /// - The position direction (long pays on positive index delta, short pays on negative)
    /// Resulting payment is scaled by token decimals.
    pub fn update_funding(&mut self, current_funding_index: i128, exit_price: u64) -> Result<()> {
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

        let current_notional_u64 = mul_div_u64(self.size, exit_price, PRICE_PRECISION)?;

        // Calculate funding payment: size * index_delta * direction / FUNDING_PRECISION
        // Result is scaled by token decimals (implicitly, as size is scaled)
        let funding_payment = (current_notional_u64 as i128)
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

    /// Check if position can be liquidated at the given price
    pub fn is_liquidatable(
        &self,
        current_price: u64,
        liquidation_threshold_bps: u64,
        current_rebalance_fee_index: u64,
    ) -> Result<bool> {
        // Calculate unrealized PnL
        let unrealized_pnl = self.calculate_unrealized_pnl(current_price)?;

        // Calculate rebalance fee owed
        let rebalance_fee_owed = self.calculate_rebalance_fee_owed(current_rebalance_fee_index, current_price)?;

        // Calculate total equity = collateral + unrealized_pnl + funding_accumulated - rebalance_fee_owed
        let total_equity = (self.collateral as i128)
            .checked_add(unrealized_pnl as i128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_add(self.funding_accumulated)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_sub(rebalance_fee_owed as i128)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Calculate minimum required collateral based on threshold using current notional value

        let current_notional_u64 = mul_div_u64(self.size, current_price, PRICE_PRECISION)?;
        let min_collateral = calc_fee(current_notional_u64, liquidation_threshold_bps)? as u128;

        msg!("total_equity: {}", total_equity);
        msg!("min_collateral: {}", min_collateral);

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

    /// Apply rebalance fee to position based on current rebalance fee index
    /// 
    /// This method calculates the rebalance fee owed by the position based on the
    /// difference between the baskt's current rebalance fee index and the
    /// position's last applied rebalance fee index.
    /// 
    /// The position's last_rebalance_fee_index is updated to prevent double charging.
    /// 
    /// @param current_rebalance_fee_index Current rebalance fee index from the baskt
    /// @return Amount of fee owed (in collateral token units)
    pub fn apply_rebalance_fee(&mut self, current_rebalance_fee_index: u64, current_price: u64) -> Result<u64> {
        // Update last applied rebalance fee index to current index
        let fee_owed = self.calculate_rebalance_fee_owed(current_rebalance_fee_index, current_price)?;
        self.last_rebalance_fee_index = current_rebalance_fee_index;
        Ok(fee_owed)
    }

    pub fn calculate_rebalance_fee_owed(&self, current_rebalance_fee_index: u64, current_price: u64) -> Result<u64> {
        let fee_index_diff = current_rebalance_fee_index
            .checked_sub(self.last_rebalance_fee_index)
            .ok_or(PerpetualsError::MathOverflow)?;

        let current_notional_u64 = mul_div_u64(self.size, current_price, PRICE_PRECISION)?;

        let rebalance_fee_owed = current_notional_u64
            .checked_mul(fee_index_diff)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(BPS_DIVISOR)
            .ok_or(PerpetualsError::MathOverflow)?;

        Ok(rebalance_fee_owed)
    }

    // Helper methods for ExitInfo
    pub fn get_exit_price(&self) -> Option<u64> {
        match &self.exit_info {
            ExitInfo::None => None,
            ExitInfo::Closed { price, .. } => Some(*price),
            ExitInfo::Liquidated { price, .. } => Some(*price),
            ExitInfo::ForceClosed { price, .. } => Some(*price),
        }
    }

    pub fn get_exit_timestamp(&self) -> Option<u32> {
        match &self.exit_info {
            ExitInfo::None => None,
            ExitInfo::Closed { timestamp, .. } => Some(*timestamp),
            ExitInfo::Liquidated { timestamp, .. } => Some(*timestamp),
            ExitInfo::ForceClosed { timestamp, .. } => Some(*timestamp),
        }
    }

    pub fn set_exit_info(&mut self, exit_info: ExitInfo) {
        self.exit_info = exit_info;
    }
}
