use crate::{error::PerpetualsError, math};
use anchor_lang::prelude::*;

//One thing I am for sure this document is missing is that its not doing tokens as BLP.
// We need it to do that for sure/

#[account]
#[derive(Default, InitSpace)]
pub struct LiquidityPool {
    pub total_usdc: u64,       // Total USDC liquidity
    pub open_interest: u64,    // Total open interest across all positions
    pub lp_token_supply: u64,  // Total issued LP tokens
    pub liquidation_fees: u64, // Fees earned from liquidations
    pub funding_fees: u64,     // Fees earned from funding rate
    pub opening_fees: u64,     // Fees earned from opening positions
    pub closing_fees: u64,     // Fees earned from closing positions
    pub last_update_time: i64, // Last time the pool was updated
}

impl LiquidityPool {
    /// Initialize a new liquidity pool
    pub fn initialize(&mut self, timestamp: i64) -> Result<()> {
        self.total_usdc = 0;
        self.open_interest = 0;
        self.lp_token_supply = 0;
        self.liquidation_fees = 0;
        self.funding_fees = 0;
        self.opening_fees = 0;
        self.closing_fees = 0;
        self.last_update_time = timestamp;

        Ok(())
    }

    /// Process a deposit to the liquidity pool
    pub fn process_deposit(&mut self, amount: u64, timestamp: i64) -> Result<u64> {
        // Validate deposit amount
        if amount == 0 {
            return Err(PerpetualsError::InvalidLpTokenAmount.into());
        }

        // Calculate LP tokens to mint
        let lp_tokens = if self.lp_token_supply == 0 {
            // First deposit, 1:1 ratio
            amount
        } else {
            // Calculate proportional LP tokens
            let lp_tokens = (amount as u128)
                .checked_mul(self.lp_token_supply as u128)
                .ok_or(PerpetualsError::MathOverflow)?
                .checked_div(self.total_usdc as u128)
                .ok_or(PerpetualsError::MathOverflow)? as u64;

            lp_tokens
        };

        // Update liquidity pool
        self.total_usdc = math::checked_add(self.total_usdc, amount)?;
        self.lp_token_supply = math::checked_add(self.lp_token_supply, lp_tokens)?;
        self.last_update_time = timestamp;

        Ok(lp_tokens)
    }

    /// Process a withdrawal from the liquidity pool
    pub fn process_withdrawal(&mut self, lp_tokens: u64, timestamp: i64) -> Result<u64> {
        // Validate LP token amount
        if lp_tokens == 0 || lp_tokens > self.lp_token_supply {
            return Err(PerpetualsError::InvalidLpTokenAmount.into());
        }

        // Check if there's enough liquidity (accounting for open interest)
        let available_liquidity = self
            .total_usdc
            .checked_sub(self.open_interest)
            .ok_or(PerpetualsError::InsufficientLiquidity)?;

        // Calculate USDC to withdraw based on LP token proportion
        let usdc_to_withdraw = (lp_tokens as u128)
            .checked_mul(self.total_usdc as u128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(self.lp_token_supply as u128)
            .ok_or(PerpetualsError::MathOverflow)? as u64;

        // Ensure withdrawal doesn't exceed available liquidity
        if usdc_to_withdraw > available_liquidity {
            return Err(PerpetualsError::InsufficientLiquidity.into());
        }

        // Update liquidity pool
        self.total_usdc = math::checked_sub(self.total_usdc, usdc_to_withdraw)?;
        self.lp_token_supply = math::checked_sub(self.lp_token_supply, lp_tokens)?;
        self.last_update_time = timestamp;

        Ok(usdc_to_withdraw)
    }

    /// Process opening a position
    pub fn process_open_position(&mut self, size: u64, opening_fee: u64) -> Result<()> {
        // Validate position size
        if size == 0 {
            return Err(PerpetualsError::InvalidPositionSize.into());
        }

        // Validate liquidity pool has enough funds
        if self.total_usdc < size {
            return Err(PerpetualsError::InsufficientLiquidity.into());
        }

        // Update liquidity pool
        self.open_interest = math::checked_add(self.open_interest, size)?;
        self.opening_fees = math::checked_add(self.opening_fees, opening_fee)?;

        Ok(())
    }

    /// Process closing a position
    pub fn process_close_position(&mut self, size: u64, closing_fee: u64, pnl: i64) -> Result<()> {
        // Update open interest
        self.open_interest = math::checked_sub(self.open_interest, size)?;
        self.closing_fees = math::checked_add(self.closing_fees, closing_fee)?;

        // Update total USDC based on PnL
        if pnl > 0 {
            // Trader made profit, deduct from pool
            let profit = pnl as u64;
            if profit > self.total_usdc {
                return Err(PerpetualsError::InsufficientLiquidity.into());
            }
            self.total_usdc = math::checked_sub(self.total_usdc, profit)?;
        } else if pnl < 0 {
            // Trader made loss, add to pool
            let loss = (-pnl) as u64;
            self.total_usdc = math::checked_add(self.total_usdc, loss)?;
        }

        Ok(())
    }

    /// Process liquidating a position
    pub fn process_liquidation(&mut self, size: u64, liquidation_fee: u64, pnl: i64) -> Result<()> {
        // Update open interest
        self.open_interest = math::checked_sub(self.open_interest, size)?;
        self.liquidation_fees = math::checked_add(self.liquidation_fees, liquidation_fee)?;

        // Update total USDC based on PnL (similar to closing)
        if pnl > 0 {
            // Trader made profit, deduct from pool
            let profit = pnl as u64;
            if profit > self.total_usdc {
                return Err(PerpetualsError::InsufficientLiquidity.into());
            }
            self.total_usdc = math::checked_sub(self.total_usdc, profit)?;
        } else if pnl < 0 {
            // Trader made loss, add to pool
            let loss = (-pnl) as u64;
            self.total_usdc = math::checked_add(self.total_usdc, loss)?;
        }

        Ok(())
    }

    /// Check if the pool has sufficient liquidity for a position
    pub fn has_sufficient_liquidity(&self, size: u64) -> bool {
        self.total_usdc >= size
    }

    /// Calculate the total value of the pool including fees
    pub fn calculate_total_value(&self) -> u64 {
        self.total_usdc
    }
}

#[account]
#[derive(Default, InitSpace)]
pub struct LPDepositAccount {
    pub owner: Pubkey, // LP's address
    #[max_len(10)]
    pub deposits: Vec<DepositEntry>, // User deposit history
}

impl LPDepositAccount {
    // With InitSpace, we don't need to manually define LEN
    // For backward compatibility
    pub const LEN: usize = LPDepositAccount::INIT_SPACE;
    /// Initialize a new LP deposit account
    pub fn initialize(&mut self, owner: Pubkey) -> Result<()> {
        self.owner = owner;
        self.deposits = Vec::new();

        Ok(())
    }

    /// Add a new deposit entry
    pub fn add_deposit(
        &mut self,
        deposited_usdc: u64,
        lp_tokens: u64,
        total_usdc_in_pool: u64,
        lp_token_supply: u64,
        timestamp: i64,
    ) -> Result<()> {
        let deposit_entry = DepositEntry {
            deposited_usdc,
            lp_tokens,
            total_usdc_in_pool,
            lp_token_supply,
            timestamp,
        };

        self.deposits.push(deposit_entry);

        Ok(())
    }

    /// Calculate total LP tokens held by this account
    pub fn calculate_total_lp_tokens(&self) -> u64 {
        self.deposits.iter().map(|entry| entry.lp_tokens).sum()
    }
}

#[cfg(test)]
mod lp_deposit_account_tests {
    use super::*;

    #[test]
    fn test_lp_deposit_account_size() {
        // With InitSpace, we don't need to manually calculate the size
        // The discriminator (8 bytes) is automatically included
        assert!(LPDepositAccount::INIT_SPACE > 0);
        assert_eq!(LPDepositAccount::LEN, LPDepositAccount::INIT_SPACE);
    }

    #[test]
    fn test_lp_deposit_account_initialize() {
        let mut account = LPDepositAccount::default();
        let owner = Pubkey::new_unique();

        account.initialize(owner).unwrap();

        assert_eq!(account.owner, owner);
        assert_eq!(account.deposits.len(), 0);
    }

    #[test]
    fn test_add_deposit() {
        let mut account = LPDepositAccount::default();
        let owner = Pubkey::new_unique();

        account.initialize(owner).unwrap();

        let deposited_usdc = 1000;
        let lp_tokens = 1000;
        let total_usdc_in_pool = 10000;
        let lp_token_supply = 10000;
        let timestamp = 1234567890;

        account
            .add_deposit(
                deposited_usdc,
                lp_tokens,
                total_usdc_in_pool,
                lp_token_supply,
                timestamp,
            )
            .unwrap();

        assert_eq!(account.deposits.len(), 1);
        assert_eq!(account.deposits[0].deposited_usdc, deposited_usdc);
        assert_eq!(account.deposits[0].lp_tokens, lp_tokens);
        assert_eq!(account.deposits[0].total_usdc_in_pool, total_usdc_in_pool);
        assert_eq!(account.deposits[0].lp_token_supply, lp_token_supply);
        assert_eq!(account.deposits[0].timestamp, timestamp);
    }

    #[test]
    fn test_calculate_total_lp_tokens() {
        let mut account = LPDepositAccount::default();
        let owner = Pubkey::new_unique();

        account.initialize(owner).unwrap();

        // Add multiple deposits
        account
            .add_deposit(1000, 1000, 10000, 10000, 1234567890)
            .unwrap();
        account
            .add_deposit(2000, 1800, 11000, 11000, 1234567900)
            .unwrap();
        account
            .add_deposit(3000, 2500, 13000, 13000, 1234567910)
            .unwrap();

        let total_lp_tokens = account.calculate_total_lp_tokens();
        assert_eq!(total_lp_tokens, 5300); // 1000 + 1800 + 2500
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, InitSpace)]
pub struct DepositEntry {
    pub deposited_usdc: u64,     // Amount deposited
    pub lp_tokens: u64,          // LP tokens minted
    pub total_usdc_in_pool: u64, // Total USDC at deposit time
    pub lp_token_supply: u64,    // Total LP tokens at deposit
    pub timestamp: i64,          // Deposit timestamp
}

impl DepositEntry {
    pub const LEN: usize = 8 +  // deposited_usdc: u64
        8 +  // lp_tokens: u64
        8 +  // total_usdc_in_pool: u64
        8 +  // lp_token_supply: u64
        8; // timestamp: i64
}

#[cfg(test)]
mod deposit_entry_tests {
    use super::*;

    #[test]
    fn test_deposit_entry_size() {
        let size = 8 +  // deposited_usdc: u64
            8 +  // lp_tokens: u64
            8 +  // total_usdc_in_pool: u64
            8 +  // lp_token_supply: u64
            8; // timestamp: i64

        assert_eq!(DepositEntry::LEN, size);
    }
}

#[cfg(test)]
mod liquidity_pool_tests {
    use super::*;

    #[test]
    fn test_liquidity_pool_size() {
        assert!(LiquidityPool::INIT_SPACE > 0);
    }

    #[test]
    fn test_initialize() {
        let mut pool = LiquidityPool::default();
        let timestamp = 1234567890;

        pool.initialize(timestamp).unwrap();

        assert_eq!(pool.total_usdc, 0);
        assert_eq!(pool.open_interest, 0);
        assert_eq!(pool.lp_token_supply, 0);
        assert_eq!(pool.liquidation_fees, 0);
        assert_eq!(pool.funding_fees, 0);
        assert_eq!(pool.opening_fees, 0);
        assert_eq!(pool.closing_fees, 0);
        assert_eq!(pool.last_update_time, timestamp);
    }

    #[test]
    fn test_process_deposit_first_deposit() {
        let mut pool = LiquidityPool::default();
        let timestamp = 1234567890;

        pool.initialize(timestamp).unwrap();

        let amount = 1000;
        let lp_tokens = pool.process_deposit(amount, timestamp).unwrap();

        assert_eq!(lp_tokens, amount); // 1:1 ratio for first deposit
        assert_eq!(pool.total_usdc, amount);
        assert_eq!(pool.lp_token_supply, lp_tokens);
        assert_eq!(pool.last_update_time, timestamp);
    }

    #[test]
    fn test_process_deposit_subsequent_deposit() {
        let mut pool = LiquidityPool::default();
        let timestamp = 1234567890;

        pool.initialize(timestamp).unwrap();

        // First deposit
        let amount1 = 1000;
        let lp_tokens1 = pool.process_deposit(amount1, timestamp).unwrap();

        // Second deposit
        let amount2 = 500;
        let lp_tokens2 = pool.process_deposit(amount2, timestamp + 100).unwrap();

        // For a 50% increase in total_usdc, we should get 50% of existing LP tokens
        assert_eq!(lp_tokens2, 500); // 50% of 1000
        assert_eq!(pool.total_usdc, 1500); // 1000 + 500
        assert_eq!(pool.lp_token_supply, 1500); // 1000 + 500
        assert_eq!(pool.last_update_time, timestamp + 100);
    }

    // #[test]
    // fn test_process_deposit_zero_amount() {
    //     let mut pool = LiquidityPool::default();
    //     let timestamp = 1234567890;
    //
    //     pool.initialize(timestamp).unwrap();
    //
    //     let amount = 0;
    //     let result = pool.process_deposit(amount, timestamp);
    //
    //     assert!(result.is_err());
    //     assert_eq!(result.unwrap_err().to_string(), PerpetualsError::InvalidLpTokenAmount.to_string());
    // }

    #[test]
    fn test_process_withdrawal() {
        let mut pool = LiquidityPool::default();
        let timestamp = 1234567890;

        pool.initialize(timestamp).unwrap();

        // Deposit first
        let deposit_amount = 1000;
        let lp_tokens = pool.process_deposit(deposit_amount, timestamp).unwrap();

        // Withdraw half
        let withdraw_lp_tokens = 500;
        let withdrawn_usdc = pool
            .process_withdrawal(withdraw_lp_tokens, timestamp + 100)
            .unwrap();

        assert_eq!(withdrawn_usdc, 500); // 50% of 1000
        assert_eq!(pool.total_usdc, 500); // 1000 - 500
        assert_eq!(pool.lp_token_supply, 500); // 1000 - 500
        assert_eq!(pool.last_update_time, timestamp + 100);
    }

    // #[test]
    // fn test_process_withdrawal_with_open_interest() {
    //     let mut pool = LiquidityPool::default();
    //     let timestamp = 1234567890;
    //
    //     pool.initialize(timestamp).unwrap();
    //
    //     // Deposit
    //     let deposit_amount = 1000;
    //     let lp_tokens = pool.process_deposit(deposit_amount, timestamp).unwrap();
    //
    //     // Open a position (creates open interest)
    //     let position_size = 600;
    //     let opening_fee = 10;
    //     pool.process_open_position(position_size, opening_fee).unwrap();
    //
    //     // Try to withdraw all LP tokens (should fail due to open interest)
    //     let result = pool.process_withdrawal(lp_tokens, timestamp + 100);
    //
    //     assert!(result.is_err());
    //     assert_eq!(result.unwrap_err().to_string(), PerpetualsError::InsufficientLiquidity.to_string());
    //
    //     // Withdraw a smaller amount that doesn't conflict with open interest
    //     let withdrawn_usdc = pool.process_withdrawal(300, timestamp + 100).unwrap();
    //
    //     assert_eq!(withdrawn_usdc, 300); // 30% of 1000
    //     assert_eq!(pool.total_usdc, 700); // 1000 - 300
    //     assert_eq!(pool.lp_token_supply, 700); // 1000 - 300
    // }

    #[test]
    fn test_process_open_position() {
        let mut pool = LiquidityPool::default();
        let timestamp = 1234567890;

        pool.initialize(timestamp).unwrap();

        // Deposit first
        let deposit_amount = 1000;
        pool.process_deposit(deposit_amount, timestamp).unwrap();

        // Open a position
        let position_size = 500;
        let opening_fee = 10;
        pool.process_open_position(position_size, opening_fee)
            .unwrap();

        assert_eq!(pool.open_interest, position_size);
        assert_eq!(pool.opening_fees, opening_fee);
        assert_eq!(pool.total_usdc, deposit_amount); // Total USDC doesn't change when opening a position
    }

    // #[test]
    // fn test_process_open_position_insufficient_liquidity() {
    //     let mut pool = LiquidityPool::default();
    //     let timestamp = 1234567890;
    //
    //     pool.initialize(timestamp).unwrap();
    //
    //     // Deposit
    //     let deposit_amount = 500;
    //     pool.process_deposit(deposit_amount, timestamp).unwrap();
    //
    //     // Try to open a position larger than the pool
    //     let position_size = 600;
    //     let opening_fee = 10;
    //     let result = pool.process_open_position(position_size, opening_fee);
    //
    //     assert!(result.is_err());
    //     assert_eq!(result.unwrap_err().to_string(), PerpetualsError::InsufficientLiquidity.to_string());
    // }

    #[test]
    fn test_process_close_position_with_profit() {
        let mut pool = LiquidityPool::default();
        let timestamp = 1234567890;

        pool.initialize(timestamp).unwrap();

        // Deposit
        let deposit_amount = 1000;
        pool.process_deposit(deposit_amount, timestamp).unwrap();

        // Open a position
        let position_size = 500;
        let opening_fee = 10;
        pool.process_open_position(position_size, opening_fee)
            .unwrap();

        // Close the position with profit
        let closing_fee = 15;
        let pnl = 100; // Profit
        pool.process_close_position(position_size, closing_fee, pnl)
            .unwrap();

        assert_eq!(pool.open_interest, 0);
        assert_eq!(pool.closing_fees, closing_fee);
        assert_eq!(pool.total_usdc, deposit_amount - pnl as u64); // Pool pays out profit
    }

    #[test]
    fn test_process_close_position_with_loss() {
        let mut pool = LiquidityPool::default();
        let timestamp = 1234567890;

        pool.initialize(timestamp).unwrap();

        // Deposit
        let deposit_amount = 1000;
        pool.process_deposit(deposit_amount, timestamp).unwrap();

        // Open a position
        let position_size = 500;
        let opening_fee = 10;
        pool.process_open_position(position_size, opening_fee)
            .unwrap();

        // Close the position with loss
        let closing_fee = 15;
        let pnl = -100; // Loss
        pool.process_close_position(position_size, closing_fee, pnl)
            .unwrap();

        assert_eq!(pool.open_interest, 0);
        assert_eq!(pool.closing_fees, closing_fee);
        assert_eq!(pool.total_usdc, deposit_amount + (-pnl) as u64); // Pool collects loss
    }

    #[test]
    fn test_process_liquidation() {
        let mut pool = LiquidityPool::default();
        let timestamp = 1234567890;

        pool.initialize(timestamp).unwrap();

        // Deposit
        let deposit_amount = 1000;
        pool.process_deposit(deposit_amount, timestamp).unwrap();

        // Open a position
        let position_size = 500;
        let opening_fee = 10;
        pool.process_open_position(position_size, opening_fee)
            .unwrap();

        // Liquidate the position
        let liquidation_fee = 25;
        let pnl = -150; // Loss
        pool.process_liquidation(position_size, liquidation_fee, pnl)
            .unwrap();

        assert_eq!(pool.open_interest, 0);
        assert_eq!(pool.liquidation_fees, liquidation_fee);
        assert_eq!(pool.total_usdc, deposit_amount + (-pnl) as u64); // Pool collects loss
    }

    #[test]
    fn test_has_sufficient_liquidity() {
        let mut pool = LiquidityPool::default();
        let timestamp = 1234567890;

        pool.initialize(timestamp).unwrap();

        // Deposit
        let deposit_amount = 1000;
        pool.process_deposit(deposit_amount, timestamp).unwrap();

        // Check sufficient liquidity
        assert!(pool.has_sufficient_liquidity(500)); // 50% of pool
        assert!(pool.has_sufficient_liquidity(1000)); // 100% of pool
        assert!(!pool.has_sufficient_liquidity(1001)); // More than pool
    }

    #[test]
    fn test_calculate_total_value() {
        let mut pool = LiquidityPool::default();
        let timestamp = 1234567890;

        pool.initialize(timestamp).unwrap();

        // Deposit
        let deposit_amount = 1000;
        pool.process_deposit(deposit_amount, timestamp).unwrap();

        // Check total value
        assert_eq!(pool.calculate_total_value(), deposit_amount);
    }
}
