use crate::error::PerpetualsError;
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

#[account]
#[derive(InitSpace)]
pub struct Order {
    pub owner: Pubkey,
    pub order_id: u64,                   // Unique identifier (timestamp-based)
    pub baskt_id: Pubkey,                // Reference to basket
    pub size: u64,                       // Position size
    pub collateral: u64,                 // Collateral amount
    pub is_long: bool,                   // Direction
    pub action: OrderAction,             // Open or Close
    pub status: OrderStatus,             // Pending, Filled, Cancelled
    pub timestamp: i64,                  // Creation timestamp
    pub target_position: Option<Pubkey>, // For close orders
    pub bump: u8,

    // Extra Space
    pub extra_space: [u8; 128],
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
}
