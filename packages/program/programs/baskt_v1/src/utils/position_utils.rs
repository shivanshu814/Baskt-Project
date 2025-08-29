use super::{calc_fee, split_fee};
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
    ForceClose { closing_fee_bps: u64 }, // Force close with fees
}

/// Settlement calculation result
pub struct SettlementDetails {
    pub escrow_to_treasury: u64,
    pub escrow_to_pool: u64,
    pub escrow_to_user: u64,
    pub pool_to_user: u64,
    pub user_payout_u64: u64,    // escrow_to_user + pool_to_user
    pub fee_to_treasury: u64,
    pub fee_to_blp: u64,
    pub base_fee: u64,
    pub rebalance_fee: u64,
    pub funding_accumulated: i128,
    pub borrow_accumulated: i128,  // Borrow fee (negative from user perspective)
    pub pnl: i128,
    pub bad_debt_amount: u64,
    pub collateral_to_release: u64,
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
    pub from_escrow_to_pool: u64,
    pub fee_to_treasury: u64,
    pub fee_to_blp: u64,
}

/// Creates pool authority signer seeds for use in CPIs
/// This is a helper to ensure consistent seed construction across the codebase
/// Note: The bump must be passed as a slice reference (e.g., &[bump])
pub fn create_pool_authority_signer_seeds<'a>(
    pool_key: &'a Pubkey,
    protocol_key: &'a Pubkey,
    bump: &'a [u8],
) -> [&'a [u8]; 4] {
    [
        POOL_AUTHORITY_SEED,
        pool_key.as_ref(),
        protocol_key.as_ref(),
        bump,
    ]
}

/// Execute settlement transfers based on pre-calculated details
/// This function performs exactly 3 types of transfers:
/// 1. Escrow to Treasury - Fees
/// 2. Escrow to Pool - BLP fees + Losses (proportional amount only)
/// 3. Pool to User - Profits (if user payout exceeds escrow)
/// Returns actual amounts transferred for accurate accounting
pub fn execute_settlement_transfers<'info>(
    token_program: &Program<'info, Token>,
    owner_collateral_escrow_account: &Account<'info, TokenAccount>,
    user_token: &AccountInfo<'info>,
    treasury_token: Option<&AccountInfo<'info>>, // None for force settlement
    pool_vault: &AccountInfo<'info>,
    program_authority: &AccountInfo<'info>,
    pool_authority: &AccountInfo<'info>,
    liquidity_pool_key: Pubkey,
    protocol_key: Pubkey,
    params: &TransferParams,
    details: &SettlementDetails,
) -> Result<()> {

 
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

    if details.escrow_to_treasury > 0 {
        require!(
            treasury_token.is_some(),
            PerpetualsError::InvalidInput
        );
        token::transfer(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                Transfer {
                    from: owner_collateral_escrow_account.to_account_info(),
                    to: treasury_token.unwrap().clone(),
                    authority: program_authority.clone(),
                },
                authority_signer,
            ),
            details.escrow_to_treasury,
        )?;
    }

    if details.escrow_to_pool > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                Transfer {
                    from: owner_collateral_escrow_account.to_account_info(),
                    to: pool_vault.clone(),
                    authority: program_authority.clone(),
                },
                authority_signer,
            ),
            details.escrow_to_pool,
        )?;
    }

    if details.escrow_to_user > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                Transfer {
                    from: owner_collateral_escrow_account.to_account_info(),
                    to: user_token.clone(), 
                    authority: program_authority.clone(),
                },
                authority_signer,
            ),
            details.escrow_to_user,
        )?; 
    }

    if details.pool_to_user > 0 {
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
            details.pool_to_user,
        )?;
    }   

    Ok(())
}

/// Update liquidity pool state based on settlement using actual transferred amounts
pub fn update_pool_state(
    liquidity_pool: &mut LiquidityPool,
    settlement_details: &SettlementDetails,
) -> Result<()> {

    // Calculate net change to pool using ACTUAL transferred amounts
    // Pool gains from escrow transfers, loses from payouts
    // Note: Borrow and funding fees are already implicit in the equity calculation
    // and reflected in the actual token transfers (escrow_to_pool, pool_to_user)
    let gains = settlement_details.escrow_to_pool as i128;
    
    let losses = settlement_details.pool_to_user as i128;

    let net_change = gains
        .checked_sub(losses)
        .ok_or(PerpetualsError::MathOverflow)?;


    if net_change > 0 {
        liquidity_pool.increase_liquidity(net_change as u64)?;
    } else if net_change < 0 {
        liquidity_pool.decrease_liquidity(net_change.abs() as u64)?;
    }

    Ok(())
}

/// Calculate settlement for closing a position (full or partial)
/// Policy: funding and borrow are fully settled on every settlement.
/// - We always apply the entire `position.funding_accumulated` and `position.borrow_accumulated`
///   to equity regardless of `size_to_close`.
/// - After transfers complete, `update_position_after_settlement()` resets both accumulators to 0
///   and future accrual starts from current indices.
/// - `collateral_to_release` is proportional to `size_to_close` (partial close releases only a
///   proportional share of collateral), but funding/borrow are NOT prorated.
pub fn calculate_position_settlement(
    position: &Position,
    size_to_close: u64,
    exit_price: u64,
    closing_type: ClosingType,
    treasury_cut_bps: u64,
    rebalance_fee_owed: u64,
) -> Result<SettlementDetails> {
    if size_to_close == 0 || size_to_close > position.size {
        return Err(PerpetualsError::InvalidInput.into());
    }

    // 1. Calculate collateral portion for the requested `size_to_close` (handles partial close)
    let collateral_closed = if size_to_close == position.size {
        position.collateral
    } else {
        mul_div_u64(position.collateral, size_to_close, position.size)?
    };

    // 2. Funding and borrow: settle FULL accumulated amounts on any settlement
    // Accumulators will be reset post-settlement; no prorating by `size_to_close`.
    let funding_closed_i128 = position.funding_accumulated;
    let borrow_closed_i128 = position.borrow_accumulated;
    
    let realized_pnl_i128 = calculate_pnl(
        position.is_long, 
        position.entry_price, 
        size_to_close, 
        exit_price
    )? as i128;

    // 3. Calculate total equity (can be negative)
    // Note: borrow_closed_i128 is negative, so adding it reduces equity
    let equity_i128 = (collateral_closed as i128)
        .checked_add(realized_pnl_i128).ok_or(PerpetualsError::MathOverflow)?
        .checked_add(funding_closed_i128).ok_or(PerpetualsError::MathOverflow)?
        .checked_add(borrow_closed_i128).ok_or(PerpetualsError::MathOverflow)?;

    // 4. Calculate total fees
    let exit_notional_u64 = mul_div_u64(size_to_close, exit_price, PRICE_PRECISION)?;
    let base_fee = match closing_type {
        ClosingType::Normal { closing_fee_bps } => calc_fee(exit_notional_u64, closing_fee_bps)?,
        ClosingType::ForceClose { closing_fee_bps } => calc_fee(exit_notional_u64, closing_fee_bps)?,
        ClosingType::Liquidation { liquidation_fee_bps } => calc_fee(exit_notional_u64, liquidation_fee_bps)?,
    };
    let total_fees_u64 = base_fee.checked_add(rebalance_fee_owed).ok_or(PerpetualsError::MathOverflow)?;

    // 5. Handle bad debt case (equity < 0)
    if equity_i128 < 0 {
        let loss_amount = equity_i128.unsigned_abs();
        let available_collateral = collateral_closed;
        
        // Bad debt = losses that exceed available collateral + uncollected fees
        let bad_debt_from_losses = loss_amount.saturating_sub(available_collateral.into());
        let bad_debt_amount = bad_debt_from_losses.saturating_add(total_fees_u64.into());
        
        return Ok(SettlementDetails {
            escrow_to_treasury: 0,
            escrow_to_pool: collateral_closed, // All collateral goes to pool
            escrow_to_user: 0,
            pool_to_user: 0,
            fee_to_treasury: 0,
            fee_to_blp: 0,
            base_fee: 0,
            rebalance_fee: 0,
            pnl: realized_pnl_i128,
            funding_accumulated: funding_closed_i128,
            borrow_accumulated: borrow_closed_i128,
            bad_debt_amount: bad_debt_amount.try_into().unwrap_or(u64::MAX),
            user_payout_u64: 0,
            collateral_to_release: collateral_closed,
        });
    }

    // 6. Collect fees from positive equity
    let collectible_fee = core::cmp::min(total_fees_u64, equity_i128 as u64);
    let uncollected_fee = total_fees_u64.saturating_sub(collectible_fee);
    let (fee_to_treasury, fee_to_blp) = if collectible_fee > 0 {
        split_fee(collectible_fee, treasury_cut_bps)?
    } else { (0, 0) };

    // 7. Calculate user payout after fees
    let user_total_payout = (equity_i128 as u64).saturating_sub(collectible_fee);
    
    // 8. Handle liquidation vs normal close
    if matches!(closing_type, ClosingType::Liquidation { .. }) {
        // In liquidation: user gets nothing, pool gets remainder after fees
        let escrow_to_pool = collateral_closed.saturating_sub(fee_to_treasury);
        
        return Ok(SettlementDetails {
            escrow_to_treasury: fee_to_treasury,
            escrow_to_pool,
            escrow_to_user: 0,
            pool_to_user: 0,
            fee_to_treasury,
            fee_to_blp,
            base_fee,
            rebalance_fee: rebalance_fee_owed,
            pnl: realized_pnl_i128,
            funding_accumulated: funding_closed_i128,
            borrow_accumulated: borrow_closed_i128,
            bad_debt_amount: uncollected_fee,
            user_payout_u64: 0,
            collateral_to_release: collateral_closed,
        });
    }

    // 9. Normal close: split payout between escrow and pool
    let net_collateral = collateral_closed.saturating_sub(fee_to_treasury);
    let escrow_to_user = core::cmp::min(net_collateral, user_total_payout);
    let pool_to_user = user_total_payout.saturating_sub(escrow_to_user);
    
    let escrow_to_pool = net_collateral.saturating_sub(escrow_to_user);

    Ok(SettlementDetails {
        escrow_to_treasury: fee_to_treasury,
        escrow_to_pool,
        escrow_to_user,
        pool_to_user,
        fee_to_treasury,
        fee_to_blp,
        base_fee,
        rebalance_fee: rebalance_fee_owed,
        pnl: realized_pnl_i128,
        funding_accumulated: funding_closed_i128,
        borrow_accumulated: borrow_closed_i128,
        bad_debt_amount: uncollected_fee,
        user_payout_u64: escrow_to_user + pool_to_user,
        collateral_to_release: collateral_closed,
    })
}



pub fn calculate_pnl(
    is_long: bool,
    entry_price: u64,
    size: u64,
    exit_price: u64,
) -> Result<i64> {
    // Calculate price difference based on direction
    // PnL = direction * (exit_price - entry_price) * size / PRICE_PRECISION
    let price_delta = if is_long {
        // For longs: profit if exit_price > entry_price
        (exit_price as i128).checked_sub(entry_price as i128)
    } else {
        // For shorts: profit if entry_price > exit_price
        (entry_price as i128).checked_sub(exit_price as i128)
    }
    .ok_or(PerpetualsError::MathOverflow)?;

    let pnl = (price_delta)
        .checked_mul(size as i128)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_div(PRICE_PRECISION as i128)
        .ok_or(PerpetualsError::MathOverflow)?
        .try_into()
        .map_err(|_| PerpetualsError::MathOverflow)?;

    Ok(pnl)
}

/// Update position state after settlement
/// After settlement, all accumulated fees have been fully paid/received,
/// so we reset the accumulators to 0. The indices are already updated
/// in update_market_indices, so future accumulation will start fresh.
pub fn update_position_after_settlement(
    position: &mut Position,
    size_to_close: u64,
    collateral_to_release: u64,
) -> Result<()> {
    position.size -= size_to_close;
    position.collateral -= collateral_to_release;
    
    // Reset accumulators to 0 since all accumulated fees have been settled
    // The indices (last_funding_index, last_borrow_index) are already updated
    // in update_market_indices, so future accumulation starts from current indices
    position.funding_accumulated = 0;
    position.borrow_accumulated = 0;
    
    Ok(())
}


/// Close escrow token account and reclaim rent
pub fn close_escrow_account<'info>(
    token_program: &Program<'info, Token>,
    owner_collateral_escrow_account: &Account<'info, TokenAccount>,
    destination: &AccountInfo<'info>,
    program_authority: &AccountInfo<'info>,
    authority_bump: u8,
) -> Result<()> {
    let authority_signer_seeds = [AUTHORITY_SEED.as_ref(), &[authority_bump]];
    let authority_signer = &[&authority_signer_seeds[..]];

    token::close_account(CpiContext::new_with_signer(
        token_program.to_account_info(),
        CloseAccount {
            account: owner_collateral_escrow_account.to_account_info(),
            destination: destination.clone(),
            authority: program_authority.clone(),
        },
        authority_signer,
    ))?;

    Ok(())
}
