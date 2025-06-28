use super::calc_fee;
use crate::constants::{AUTHORITY_SEED, POOL_AUTHORITY_SEED, PRICE_PRECISION};
use crate::error::PerpetualsError;
use crate::math::mul_div_u64;
use crate::state::liquidity::LiquidityPool;
use crate::state::position::Position;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Token, TokenAccount, Transfer};

/// Enum to define the type of position closing
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum ClosingType {
    Normal { closing_fee_bps: u64 },
    Liquidation { liquidation_fee_bps: u64 },
    ForceSettlement, // No fees, uses settlement price
}

/// Settlement calculation result
pub struct SettlementDetails {
    pub pnl: i128,
    pub funding_accumulated: i128,
    pub fee_to_treasury: u64,
    pub fee_to_blp: u64,
    pub total_user_payout: i128, // Can be negative (bad debt)
    pub user_payout_u64: u64,    // Always >= 0 (what user actually receives)
    pub is_bad_debt: bool,
    pub bad_debt_amount: u64,
    // Fee tracking for accurate bad debt calculation
    pub expected_total_fee: u64, // Total fee that should be collected
    pub collectible_fee: u64,    // Fee that can actually be collected from available funds
    pub uncollected_fee: u64,    // Fee that cannot be collected (part of bad debt)
}

/// Calculate settlement details for a position
/// This is a pure function with no side effects
/// Note: exit_price is used to calculate the correct notional value for fee assessment
pub fn calculate_settlement(
    position: &Position,
    pnl: i64,
    closing_type: ClosingType,
    treasury_cut_bps: u64,
    exit_price: u64,
) -> Result<SettlementDetails> {
    // All calculations in i128 to handle negatives safely
    let collateral = position.collateral as i128;
    let pnl_i128 = pnl as i128;
    let funding_accumulated = position.funding_accumulated;

    // Calculate gross payout before fees
    let gross_payout = collateral
        .checked_add(pnl_i128)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_add(funding_accumulated)
        .ok_or(PerpetualsError::MathOverflow)?;

    // Calculate notional value at exit price for fee calculation
    let exit_notional_u64 = mul_div_u64(position.size, exit_price, PRICE_PRECISION)?;

    // Calculate expected total fee based on closing type using exit notional
    let expected_total_fee = match closing_type {
        ClosingType::Normal { closing_fee_bps } => calc_fee(exit_notional_u64, closing_fee_bps)?,
        ClosingType::Liquidation {
            liquidation_fee_bps,
        } => calc_fee(exit_notional_u64, liquidation_fee_bps)?,
        ClosingType::ForceSettlement => 0, // No fees on forced settlement
    };

    // Determine how much fee can actually be collected from available funds
    let collectible_fee = if gross_payout > 0 {
        expected_total_fee.min(gross_payout as u64)
    } else {
        0 // Can't collect any fees from negative equity positions
    };

    // Calculate uncollected fees (part of protocol loss)
    let uncollected_fee = expected_total_fee.saturating_sub(collectible_fee);

    // Split only the collectible fee between treasury and BLP
    let (fee_to_treasury, fee_to_blp) = if collectible_fee > 0 {
        super::split_fee(collectible_fee, treasury_cut_bps)?
    } else {
        (0, 0)
    };

    // Calculate net payout after deducting only collectible fees
    let total_user_payout = if gross_payout > 0 {
        let gross_u64 = gross_payout as u64;
        let net = gross_u64.saturating_sub(collectible_fee);
        net as i128
    } else {
        // Negative payout - bad debt scenario (fees already accounted for separately)
        gross_payout // Keep it negative
    };

    // Determine bad debt including both negative equity AND uncollected fees
    let (user_payout_u64, is_bad_debt, bad_debt_amount) = if total_user_payout >= 0 {
        if uncollected_fee > 0 {
            // Even if user breaks even, uncollected fees are still a protocol loss
            (total_user_payout as u64, true, uncollected_fee)
        } else {
            (total_user_payout as u64, false, 0)
        }
    } else {
        // Bad debt = negative equity + uncollected fees
        let negative_equity = total_user_payout.abs() as u64;
        let calculated_bad_debt = negative_equity + uncollected_fee;

        // DEBUG: Log bad debt calculation
        msg!("=== BAD DEBT CALCULATION DEBUG ===");
        msg!("total_user_payout: {}", total_user_payout);
        msg!("negative_equity: {}", negative_equity);
        msg!("uncollected_fee: {}", uncollected_fee);
        msg!("calculated_bad_debt: {}", calculated_bad_debt);

        (0, true, calculated_bad_debt)
    };

    Ok(SettlementDetails {
        pnl: pnl_i128,
        funding_accumulated,
        fee_to_treasury,
        fee_to_blp,
        total_user_payout,
        user_payout_u64,
        is_bad_debt,
        bad_debt_amount,
        expected_total_fee,
        collectible_fee,
        uncollected_fee,
    })
}

/// Transfer parameters for settlement execution
pub struct TransferParams {
    pub escrow_balance: u64,
    pub authority_bump: u8,
    pub pool_authority_bump: u8,
}

/// Result of settlement transfers with actual amounts transferred
pub struct SettlementTransferResult {
    pub from_escrow_to_user: u64,
    pub from_pool_to_user: u64,
    pub escrow_to_pool: u64,
    pub actual_fee_to_treasury: u64,
    pub actual_fee_to_blp: u64,
}

/// Execute settlement transfers based on pre-calculated details
/// This function only performs transfers, no business logic
/// Returns actual amounts transferred for accurate accounting
pub fn execute_settlement_transfers<'info>(
    token_program: &Program<'info, Token>,
    escrow_token: &Account<'info, TokenAccount>,
    user_token: &AccountInfo<'info>,
    treasury_token: Option<&AccountInfo<'info>>, // None for force settlement
    pool_vault: &AccountInfo<'info>,
    program_authority: &AccountInfo<'info>,
    pool_authority: &AccountInfo<'info>,
    liquidity_pool_key: Pubkey,
    protocol_key: Pubkey,
    params: &TransferParams,
    details: &SettlementDetails,
) -> Result<SettlementTransferResult> {
    let mut current_escrow_balance = params.escrow_balance;

    // Authority signer seeds
    let authority_signer_seeds = [AUTHORITY_SEED.as_ref(), &[params.authority_bump]];
    let authority_signer = &[&authority_signer_seeds[..]];

    // Pool authority signer seeds
    let pool_authority_signer_seeds = [
        POOL_AUTHORITY_SEED.as_ref(),
        liquidity_pool_key.as_ref(),
        protocol_key.as_ref(),
        &[params.pool_authority_bump],
    ];
    let pool_authority_signer = &[&pool_authority_signer_seeds[..]];

    // Track actual fees transferred for accurate accounting
    let mut actual_fee_to_treasury = 0u64;
    let mut actual_fee_to_blp = 0u64;

    // 1. Transfer treasury fee portion (if applicable)
    if details.fee_to_treasury > 0 && treasury_token.is_some() {
        let fee_from_escrow = details.fee_to_treasury.min(current_escrow_balance);
        if fee_from_escrow > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    token_program.to_account_info(),
                    Transfer {
                        from: escrow_token.to_account_info(),
                        to: treasury_token.unwrap().clone(),
                        authority: program_authority.clone(),
                    },
                    authority_signer,
                ),
                fee_from_escrow,
            )?;
            current_escrow_balance = current_escrow_balance.saturating_sub(fee_from_escrow);
            actual_fee_to_treasury = fee_from_escrow;
        }
    }

    // ------------------------------------------------------------------
    // 2. Transfer payout to user (escrow first, pool vault second)
    // ------------------------------------------------------------------
    let mut from_escrow_to_user = 0u64;
    let mut from_pool_to_user = 0u64;

    if details.user_payout_u64 > 0 {
        // a) From escrow
        from_escrow_to_user = details.user_payout_u64.min(current_escrow_balance);
        if from_escrow_to_user > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    token_program.to_account_info(),
                    Transfer {
                        from: escrow_token.to_account_info(),
                        to: user_token.clone(),
                        authority: program_authority.clone(),
                    },
                    authority_signer,
                ),
                from_escrow_to_user,
            )?;
            current_escrow_balance = current_escrow_balance.saturating_sub(from_escrow_to_user);
        }

        // b) Remaining from pool (will fail if pool lacks pre-existing liquidity)
        from_pool_to_user = details
            .user_payout_u64
            .saturating_sub(from_escrow_to_user);
        if from_pool_to_user > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    token_program.to_account_info(),
                    Transfer {
                        from: pool_vault.clone(),
                        to: user_token.clone(),
                        authority: pool_authority.clone(),
                    },
                    pool_authority_signer,
                ),
                from_pool_to_user,
            )?;
        }
    }

    // ------------------------------------------------------------------
    // 3. Transfer BLP fee portion to pool vault (only after user payout)
    // ------------------------------------------------------------------
    if details.fee_to_blp > 0 {
        let blp_fee_from_escrow = details.fee_to_blp.min(current_escrow_balance);
        if blp_fee_from_escrow > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    token_program.to_account_info(),
                    Transfer {
                        from: escrow_token.to_account_info(),
                        to: pool_vault.clone(),
                        authority: program_authority.clone(),
                    },
                    authority_signer,
                ),
                blp_fee_from_escrow,
            )?;
            current_escrow_balance = current_escrow_balance.saturating_sub(blp_fee_from_escrow);
            actual_fee_to_blp = blp_fee_from_escrow;
        }
    }

    // ------------------------------------------------------------------
    // 4. Sweep any remaining escrow balance to the pool vault
    // ------------------------------------------------------------------
    let escrow_to_pool = current_escrow_balance;
    if escrow_to_pool > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                Transfer {
                    from: escrow_token.to_account_info(),
                    to: pool_vault.clone(),
                    authority: program_authority.clone(),
                },
                authority_signer,
            ),
            escrow_to_pool,
        )?;
    }

    Ok(SettlementTransferResult {
        from_escrow_to_user,
        from_pool_to_user,
        escrow_to_pool,
        actual_fee_to_treasury,
        actual_fee_to_blp,
    })
}

/// Update liquidity pool state based on settlement using actual transferred amounts
pub fn update_pool_state(
    liquidity_pool: &mut LiquidityPool,
    transfer_result: &SettlementTransferResult,
    bad_debt_amount: u64,
) -> Result<()> {
    // DEBUG: Log the values being used in pool state calculation
    msg!("=== POOL STATE UPDATE DEBUG ===");
    msg!("escrow_to_pool: {}", transfer_result.escrow_to_pool);
    msg!("actual_fee_to_blp: {}", transfer_result.actual_fee_to_blp);
    msg!("from_pool_to_user: {}", transfer_result.from_pool_to_user);
    msg!("bad_debt_amount: {}", bad_debt_amount);

    // Calculate net change to pool using ACTUAL transferred amounts
    // Pool gains from escrow and actual BLP fees, loses from payouts and bad debt
    let gains = (transfer_result.escrow_to_pool as i128)
        .checked_add(transfer_result.actual_fee_to_blp as i128)
        .ok_or(PerpetualsError::MathOverflow)?;
    let losses = (transfer_result.from_pool_to_user as i128)
        .checked_add(bad_debt_amount as i128)
        .ok_or(PerpetualsError::MathOverflow)?;

    msg!("gains: {}", gains);
    msg!("losses: {}", losses);

    let net_change = gains
        .checked_sub(losses)
        .ok_or(PerpetualsError::MathOverflow)?;

    msg!("net_change: {}", net_change);
    msg!("pool_liquidity_before: {}", liquidity_pool.total_liquidity);

    if net_change > 0 {
        liquidity_pool.increase_liquidity(net_change as u64)?;
        msg!(
            "pool_liquidity_after_increase: {}",
            liquidity_pool.total_liquidity
        );
    } else if net_change < 0 {
        liquidity_pool.decrease_liquidity(net_change.abs() as u64)?;
        msg!(
            "pool_liquidity_after_decrease: {}",
            liquidity_pool.total_liquidity
        );
    }

    Ok(())
}

/// Close escrow token account and reclaim rent
pub fn close_escrow_account<'info>(
    token_program: &Program<'info, Token>,
    escrow_token: &Account<'info, TokenAccount>,
    destination: &AccountInfo<'info>,
    program_authority: &AccountInfo<'info>,
    authority_bump: u8,
) -> Result<()> {
    let authority_signer_seeds = [AUTHORITY_SEED.as_ref(), &[authority_bump]];
    let authority_signer = &[&authority_signer_seeds[..]];

    token::close_account(CpiContext::new_with_signer(
        token_program.to_account_info(),
        CloseAccount {
            account: escrow_token.to_account_info(),
            destination: destination.clone(),
            authority: program_authority.clone(),
        },
        authority_signer,
    ))?;

    Ok(())
}
