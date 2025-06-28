use crate::constants::{BPS_DIVISOR, PRICE_PRECISION};
use crate::error::PerpetualsError;
use crate::math::checked_as_u64;
use crate::math::mul_div_u128;
use crate::math::mul_div_u64;
use anchor_lang::prelude::*;

//----------------------------------------------------------------------------
// STATE STRUCTURES: ORDER
//----------------------------------------------------------------------------

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug, Default, InitSpace)]
pub enum OrderAction {
    #[default]
    Open,
    Close,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug, Default, InitSpace)]
pub enum OrderStatus {
    #[default]
    Pending,
    Filled,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug, Default, InitSpace)]
pub enum OrderType {
    #[default]
    Market,
    Limit,
}

#[account]
#[derive(InitSpace)]
pub struct Order {
    pub owner: Pubkey,
    pub order_id: u64,                   // Unique identifier (timestamp-based)
    pub baskt_id: Pubkey,                // Reference to basket
    pub size: u64,                       // Position size (in token units)
    pub collateral: u64,                 // Collateral amount
    pub is_long: bool,                   // Direction
    pub action: OrderAction,             // Open or Close
    pub status: OrderStatus,             // Pending, Filled, Cancelled
    pub timestamp: i64,                  // Creation timestamp
    pub target_position: Option<Pubkey>, // For close orders
    pub bump: u8,

    // New fields for price validation and slippage control
    pub limit_price: u64,      // User-signed
    pub max_slippage_bps: u64, // Maximum acceptable slippage in basis points

    // New field for order type
    pub order_type: OrderType,

    // Desired leverage expressed in basis points (10_000 = 1x)
    pub leverage_bps: u64,

    // Extra Space
    pub extra_space: [u8; 88],
}

impl Order {
    pub fn initialize(
        &mut self,
        owner: Pubkey,
        order_id: u64,
        baskt_id: Pubkey,
        size: u64,
        collateral: u64,
        is_long: bool,
        action: OrderAction,
        timestamp: i64,
        target_position: Option<Pubkey>,
        bump: u8,
        limit_price: u64,
        max_slippage_bps: u64,
        order_type: OrderType,
        leverage_bps: u64,
    ) -> Result<()> {
        self.owner = owner;
        self.order_id = order_id;
        self.baskt_id = baskt_id;
        self.size = size;
        self.collateral = collateral;
        self.is_long = is_long;
        self.action = action;
        self.status = OrderStatus::Pending;
        self.timestamp = timestamp;
        self.target_position = target_position;
        self.bump = bump;
        self.limit_price = limit_price;
        self.max_slippage_bps = max_slippage_bps;
        self.order_type = order_type;
        self.leverage_bps = leverage_bps;
        Ok(())
    }

    pub fn fill(&mut self) -> Result<()> {
        require!(
            self.status == OrderStatus::Pending,
            PerpetualsError::OrderAlreadyProcessed
        );
        self.status = OrderStatus::Filled;
        Ok(())
    }

    pub fn cancel(&mut self) -> Result<()> {
        require!(
            self.status == OrderStatus::Pending,
            PerpetualsError::OrderAlreadyProcessed
        );
        self.status = OrderStatus::Cancelled;
        Ok(())
    }

    /// Calculate worst-case notional value for collateral validation
    /// Uses limit_price and max_slippage_bps to determine maximum possible notional
    pub fn calculate_worst_case_notional(&self) -> Result<u64> {
        // Calculate base notional: size * limit_price / PRICE_PRECISION
        // This accounts for the fact that limit_price has 6 decimal places
        let base_notional_u128 = mul_div_u128(
            self.size as u128,
            self.limit_price as u128,
            PRICE_PRECISION as u128,
        )?;

        // Calculate the slippage adjustment using the helper that operates on u128.
        let slippage_adjustment_u128 = mul_div_u128(
            base_notional_u128,
            self.max_slippage_bps as u128,
            BPS_DIVISOR as u128,
        )?;

        // Worst-case notional is base + worst-case slippage.
        let worst_case_notional_u128 = base_notional_u128
            .checked_add(slippage_adjustment_u128)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Down-cast to u64 with overflow check – the calling code only ever
        // accepts reasonably sized notionals (see CreateOrder validation).
        checked_as_u64(worst_case_notional_u128)
    }

    /// Validate that the provided price is within acceptable slippage bounds
    pub fn validate_execution_price(&self, execution_price: u64) -> Result<()> {
        require!(execution_price > 0, PerpetualsError::InvalidOraclePrice);
        // Basic validation
        require!(self.limit_price > 0, PerpetualsError::InvalidOraclePrice);
        require!(
            self.max_slippage_bps <= 10_000,
            PerpetualsError::InvalidFeeBps
        );

        // Calculate acceptable price bounds
        let slippage_amount = mul_div_u64(self.limit_price, self.max_slippage_bps, BPS_DIVISOR)?;

        let lower_bound = self.limit_price.checked_sub(slippage_amount).unwrap_or(0);
        let upper_bound = self
            .limit_price
            .checked_add(slippage_amount)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Additional safety check: ensure bounds are reasonable

        // Check if execution price is within bounds
        require!(
            execution_price >= lower_bound && execution_price <= upper_bound,
            PerpetualsError::PriceOutOfBounds
        );

        Ok(())
    }
}
