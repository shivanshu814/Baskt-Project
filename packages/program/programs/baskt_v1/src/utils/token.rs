use crate::error::PerpetualsError;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

pub struct TokenUtils;

impl TokenUtils {
    /// Transfer USDC tokens from one account to another
    pub fn transfer_usdc<'info>(
        from: &Account<'info, TokenAccount>,
        to: &Account<'info, TokenAccount>,
        authority: &Signer<'info>,
        token_program: &Program<'info, Token>,
        amount: u64,
    ) -> Result<()> {
        if amount == 0 {
            return Ok(());
        }

        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: from.to_account_info(),
                    to: to.to_account_info(),
                    authority: authority.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    /// Transfer USDC tokens from one account to another with a signer PDA
    pub fn transfer_usdc_with_pda<'info>(
        from: &Account<'info, TokenAccount>,
        to: &Account<'info, TokenAccount>,
        authority: &AccountInfo<'info>,
        token_program: &Program<'info, Token>,
        amount: u64,
        seeds: &[&[&[u8]]],
    ) -> Result<()> {
        if amount == 0 {
            return Ok(());
        }

        token::transfer(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                Transfer {
                    from: from.to_account_info(),
                    to: to.to_account_info(),
                    authority: authority.to_account_info(),
                },
                seeds,
            ),
            amount,
        )?;

        Ok(())
    }

    /// Check if a token account has sufficient balance
    pub fn check_sufficient_balance(account: &Account<TokenAccount>, amount: u64) -> Result<()> {
        if account.amount < amount {
            return Err(PerpetualsError::InsufficientFunds.into());
        }
        Ok(())
    }
}
