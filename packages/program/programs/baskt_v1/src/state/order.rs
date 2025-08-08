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
#[repr(u8)]
pub enum OrderAction {
    #[default]
    Open = 0,
    Close = 1,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug, Default, InitSpace)]
#[repr(u8)]
pub enum OrderStatus {
    #[default]
    Pending = 0,
    Filled = 1,
    Cancelled = 2,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug, Default, InitSpace)]
#[repr(u8)]
pub enum OrderType {
    #[default]
    Market = 0,
    Limit = 1,
}

// Open order parameters - required for opening positions
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub struct OpenOrderParams {
    pub notional_value: u64,    // Position value in USD
    pub leverage_bps: u64,      // Leverage in basis points
    pub collateral: u64,        // Collateral amount
    pub is_long: bool,          // Direction (long/short)
}

// Close order parameters - required for closing positions
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub struct CloseOrderParams {
    pub size_as_contracts: u64, // Size to close in contracts
    pub target_position: Pubkey, // Position to close
}

// Market order parameters - no additional fields needed
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub struct MarketOrderParams {
    // No additional fields for market orders
}

// Limit order parameters - required for limit orders
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub struct LimitOrderParams {
    pub limit_price: u64,       // User-specified limit price
    pub max_slippage_bps: u64,  // Maximum acceptable slippage in basis points
}

// Combined action parameters
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub enum ActionParams {
    Open(OpenOrderParams),
    Close(CloseOrderParams),
}

// Combined order type parameters
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub enum OrderTypeParams {
    Market(MarketOrderParams),
    Limit(LimitOrderParams),
}

#[account]
#[derive(InitSpace)]
pub struct Order {
    pub owner: Pubkey,
    pub order_id: u32,                   // Unique identifier (timestamp-based)
    pub baskt_id: Pubkey,                // Reference to basket

    pub action: OrderAction,             // Open or Close
    pub order_type: OrderType,           // Market or Limit
    
    // Combined parameters using enums
    pub action_params: ActionParams,     // Open or Close parameters
    pub order_type_params: OrderTypeParams, // Market or Limit parameters

    pub status: OrderStatus,             // Pending, Filled, Cancelled
    pub timestamp: u32,                  // Creation timestamp
    pub bump: u8,

    // Extra Space
    pub extra_space: [u8; 150],
}

impl Order {
    // Step 1: Initialize the order with basic info and action
    pub fn initialize(
        &mut self,
        owner: Pubkey,
        order_id: u32,
        baskt_id: Pubkey,
        action: OrderAction,
        timestamp: u32,
        bump: u8,
    ) -> Result<()> {
        self.owner = owner;
        self.order_id = order_id;
        self.baskt_id = baskt_id;
        self.action = action;
        self.status = OrderStatus::Pending;
        self.timestamp = timestamp;
        self.bump = bump;
        
        Ok(())
    }

    // Step 2a: Initialize as Open order
    pub fn init_open(&mut self, open_params: OpenOrderParams) -> Result<()> {
        require!(
            self.action == OrderAction::Open,
            PerpetualsError::InvalidOrderAction
        );
        self.action_params = ActionParams::Open(open_params);
        Ok(())
    }

    // Step 2b: Initialize as Close order
    pub fn init_close(&mut self, close_params: CloseOrderParams) -> Result<()> {
        require!(
            self.action == OrderAction::Close,
            PerpetualsError::InvalidOrderAction
        );
        self.action_params = ActionParams::Close(close_params);
        Ok(())
    }

    // Step 3a: Initialize as Market order
    pub fn init_market(&mut self) -> Result<()> {
        self.order_type = OrderType::Market;
        self.order_type_params = OrderTypeParams::Market(MarketOrderParams {});
        Ok(())
    }

    // Step 3b: Initialize as Limit order
    pub fn init_limit(&mut self, limit_params: LimitOrderParams) -> Result<()> {
        self.order_type = OrderType::Limit;
        self.order_type_params = OrderTypeParams::Limit(limit_params);
        Ok(())
    }

    // Helper methods to safely access parameters
    pub fn get_open_params(&self) -> Result<&OpenOrderParams> {
        require!(
            self.action == OrderAction::Open,
            PerpetualsError::InvalidOrderAction
        );
        match &self.action_params {
            ActionParams::Open(params) => Ok(params),
            _ => Err(PerpetualsError::InvalidInput.into()),
        }
    }

    pub fn get_close_params(&self) -> Result<&CloseOrderParams> {
        require!(
            self.action == OrderAction::Close,
            PerpetualsError::InvalidOrderAction
        );
        match &self.action_params {
            ActionParams::Close(params) => Ok(params),
            _ => Err(PerpetualsError::InvalidInput.into()),
        }
    }

    pub fn get_limit_params(&self) -> Result<&LimitOrderParams> {
        require!(
            self.order_type == OrderType::Limit,
            PerpetualsError::InvalidInput
        );
        match &self.order_type_params {
            OrderTypeParams::Limit(params) => Ok(params),
            _ => Err(PerpetualsError::InvalidInput.into()),
        }
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

    /// Validate that the provided price is within acceptable slippage bounds
    pub fn validate_execution_price(&self, execution_price: u64) -> Result<()> {
        require!(execution_price > 0, PerpetualsError::InvalidOraclePrice);
        
        if self.order_type == OrderType::Limit {
            let limit_params = self.get_limit_params()?;
            
            // Basic validation
            require!(limit_params.limit_price > 0, PerpetualsError::InvalidOraclePrice);
       
            // Calculate acceptable price bounds
            let slippage_amount = mul_div_u64(
                limit_params.limit_price, 
                limit_params.max_slippage_bps, 
                BPS_DIVISOR
            )?;

            let lower_bound = limit_params.limit_price
                .checked_sub(slippage_amount)
                .unwrap_or(0);
            let upper_bound = limit_params.limit_price
                .checked_add(slippage_amount)
                .ok_or(PerpetualsError::MathOverflow)?;

            msg!("lower_bound: {}, upper_bound: {}", lower_bound, upper_bound);
            msg!("execution_price: {}", execution_price);

            // Check if execution price is within bounds
            require!(
                execution_price >= lower_bound && execution_price <= upper_bound,
                PerpetualsError::PriceOutOfBounds
            );
        }
        Ok(())
    }
}
