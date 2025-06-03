use crate::constants::BPS_DIVISOR;
use crate::error::PerpetualsError;
use anchor_lang::prelude::*;

/// LiquidityPool represents the shared liquidity pool for the entire protocol
/// This is a single pool that acts as the counterparty to all user positions
#[account]
#[derive(InitSpace)]
pub struct LiquidityPool {
    /// The total amount of liquidity in the pool
    pub total_liquidity: u64,

    /// The token mint for the LP tokens
    pub lp_mint: Pubkey,

    /// The token account where collateral is stored
    pub token_vault: Pubkey,

    /// Total supply of LP tokens
    pub total_shares: u64,

    /// The timestamp of the last pool update
    pub last_update_timestamp: i64,

    /// Fee percentage charged on deposits in basis points (e.g. 10 = 0.1%)
    pub deposit_fee_bps: u16,

    /// Fee percentage charged on withdrawals in basis points (e.g. 30 = 0.3%)
    pub withdrawal_fee_bps: u16,

    /// Minimum deposit amount allowed
    pub min_deposit: u64,

    /// Bump for this PDA
    pub bump: u8,
}

impl LiquidityPool {
    /// Calculate the amount of LP tokens to mint for a deposit
    pub fn calculate_shares_to_mint(
        &self,
        gross_deposit_amount: u64,
        fee_amount: u64,
    ) -> Result<u64> {
        msg!("gross_deposit_amount: {}", gross_deposit_amount);
        msg!("fee_amount: {}", fee_amount);
        msg!("min_deposit: {}", self.min_deposit);
        msg!("total_liquidity: {}", self.total_liquidity);
        msg!("total_shares: {}", self.total_shares);
        // Ensure the deposit meets the minimum requirement
        require!(
            gross_deposit_amount >= self.min_deposit,
            PerpetualsError::BelowMinimumDeposit
        );

        // Calculate net deposit (after fee)
        let net_deposit = gross_deposit_amount
            .checked_sub(fee_amount)
            .ok_or(PerpetualsError::MathOverflow)?;

        // If this is the first deposit, mint shares 1:1 with the deposit amount
        if self.total_shares == 0 {
            return Ok(net_deposit);
        }

        // For subsequent deposits, mint shares proportional to the existing pool
        // Formula: (net_deposit * total_shares) / total_liquidity
        let shares = (net_deposit as u128)
            .checked_mul(self.total_shares as u128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(self.total_liquidity as u128)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Check if the result exceeds u64::MAX
        require!(shares <= u64::MAX as u128, PerpetualsError::MathOverflow);

        Ok(shares as u64)
    }

    /// Calculate the amount of collateral to return for burned LP tokens
    pub fn calculate_withdrawal_amount(&self, lp_tokens_to_burn: u64) -> Result<u64> {
        require!(
            self.total_shares > 0,
            PerpetualsError::InsufficientLiquidity
        );

        // Formula: (lp_tokens_to_burn * total_liquidity) / total_shares
        let withdrawal_amount = (lp_tokens_to_burn as u128)
            .checked_mul(self.total_liquidity as u128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(self.total_shares as u128)
            .ok_or(PerpetualsError::MathOverflow)?;

        Ok(withdrawal_amount as u64)
    }

    /// Calculate fee amount based on the specified fee rate
    pub fn calculate_fee(&self, amount: u64, fee_bps: u16) -> Result<u64> {
        // Ensure fee_bps is within the acceptable range (0-BPS_DIVISOR)
        require!(fee_bps as u64 <= BPS_DIVISOR, PerpetualsError::InvalidFeeBps);

        let fee = (amount as u128)
            .checked_mul(fee_bps as u128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(BPS_DIVISOR as u128) // Basis points divisor
            .ok_or(PerpetualsError::MathOverflow)?;

        // Check if the fee exceeds u64::MAX
        require!(fee <= u64::MAX as u128, PerpetualsError::MathOverflow);

        Ok(fee as u64)
    }

    /// Update pool state after adding liquidity
    pub fn process_deposit(&mut self, deposit_amount: u64, shares_to_mint: u64) -> Result<()> {
        // Update pool state
        self.total_liquidity = self
            .total_liquidity
            .checked_add(deposit_amount)
            .ok_or(PerpetualsError::MathOverflow)?;

        self.total_shares = self
            .total_shares
            .checked_add(shares_to_mint)
            .ok_or(PerpetualsError::MathOverflow)?;

        self.last_update_timestamp = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Update pool state after removing liquidity
    pub fn process_withdrawal(
        &mut self,
        lp_tokens_to_burn: u64,
        withdrawal_amount: u64,
    ) -> Result<()> {
        // Update pool state
        self.total_liquidity = self
            .total_liquidity
            .checked_sub(withdrawal_amount)
            .ok_or(PerpetualsError::MathOverflow)?;

        self.total_shares = self
            .total_shares
            .checked_sub(lp_tokens_to_burn)
            .ok_or(PerpetualsError::MathOverflow)?;

        self.last_update_timestamp = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Decrease liquidity from the pool when paying out positions
    /// This is used by position settlement handlers when the escrow doesn't have enough funds
    pub fn decrease_liquidity(&mut self, amount: u64) -> Result<()> {
        // Ensure we have sufficient liquidity
        require!(
            self.total_liquidity >= amount,
            PerpetualsError::InsufficientLiquidity
        );

        // Update pool state
        self.total_liquidity = self
            .total_liquidity
            .checked_sub(amount)
            .ok_or(PerpetualsError::MathOverflow)?;

        // Update timestamp to track last pool modification
        self.last_update_timestamp = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Increase liquidity in the pool when collecting fees or losses
    pub fn increase_liquidity(&mut self, amount: u64) -> Result<()> {
        // Update pool state
        self.total_liquidity = self
            .total_liquidity
            .checked_add(amount)
            .ok_or(PerpetualsError::MathOverflow)?;
        // Update timestamp to track last pool modification
        self.last_update_timestamp = Clock::get()?.unix_timestamp;
        Ok(())
    }
}
