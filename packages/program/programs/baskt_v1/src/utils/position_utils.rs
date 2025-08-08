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
    ForceClose { closing_fee_bps: u64 }, // Force close with fees
}

/// Settlement calculation result
pub struct SettlementDetails {
    pub collateral_to_release: u64,
    pub funding_accumulated: i128,
    pub pnl: i128,
    pub fee_to_treasury: u64,
    pub fee_to_blp: u64,
    pub user_payout_u64: u64,    // Always >= 0 (what user actually receives)
    pub bad_debt_amount: u64,
}

/// Calculate settlement details for a position
/// This is a pure function with no side effects
/// Note: exit_price is used to calculate the correct notional value for fee assessment
pub fn calculate_settlement(
    collateral: u64,
    funding_accumulated: i128,
    size_to_close: u64,
    pnl: i64,
    closing_type: ClosingType,
    treasury_cut_bps: u64,
    exit_price: u64,
) -> Result<SettlementDetails> {
    // All calculations in i128 to handle negatives safely
    let collateral = collateral as i128;
    let pnl_i128 = pnl as i128;
    let funding_accumulated = funding_accumulated;

    // Calculate gross payout before fees
    let gross_payout = collateral
        .checked_add(pnl_i128)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_add(funding_accumulated)
        .ok_or(PerpetualsError::MathOverflow)?;

    // Calculate notional value at exit price for fee calculation
    let exit_notional_u64 = mul_div_u64(size_to_close, exit_price, PRICE_PRECISION)?;

    // Calculate expected total fee based on closing type using exit notional
    let expected_total_fee = match closing_type {
        ClosingType::Normal { closing_fee_bps } => calc_fee(exit_notional_u64, closing_fee_bps)?,
        ClosingType::Liquidation {
            liquidation_fee_bps,
        } => calc_fee(exit_notional_u64, liquidation_fee_bps)?,
        ClosingType::ForceClose { closing_fee_bps } => calc_fee(exit_notional_u64, closing_fee_bps)?,
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
    let (user_payout_u64,  bad_debt_amount) = if total_user_payout >= 0 {
        if uncollected_fee > 0 {
            // Even if user breaks even, uncollected fees are still a protocol loss
            (total_user_payout as u64,  uncollected_fee)
        } else {
            (total_user_payout as u64,  0)
        }
    } else {
        // Bad debt = negative equity + uncollected fees
        let negative_equity = total_user_payout.abs() as u64;
        let calculated_bad_debt = negative_equity + uncollected_fee;

        (0,  calculated_bad_debt)
    };

    Ok(SettlementDetails {
        collateral_to_release: collateral as u64,
        pnl: pnl_i128,
        funding_accumulated: funding_accumulated as i128,
        fee_to_treasury,
        fee_to_blp,
        user_payout_u64,
        bad_debt_amount
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
) -> Result<SettlementTransferResult> {

 
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


    let available_escrow = details.collateral_to_release; 

    let (funding_paid_to_user, funding_paid_to_pool) = if details.funding_accumulated > 0 {
        (details.funding_accumulated as u64 , 0)
    } else {
        (0, details.funding_accumulated.abs() as u64)
    };

    let (user_profit, user_loss) = if details.pnl > 0 {
        (details.pnl as u64, 0)
    } else {
        (0, details.pnl.abs() as u64)
    };



    let escrow_to_pool = details.fee_to_blp
        .checked_add(funding_paid_to_pool)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_add(user_loss)
        .ok_or(PerpetualsError::MathOverflow)?;
    let escrow_to_treasury = details.fee_to_treasury;
    
    // Handle bad debt scenarios with checked arithmetic
    // In bad debt: total required transfers may exceed available escrow
    let total_required_from_escrow = escrow_to_pool
        .checked_add(escrow_to_treasury)
        .ok_or(PerpetualsError::MathOverflow)?;
    
    let (final_escrow_to_treasury, final_escrow_to_pool, escrow_to_user) = 
        if total_required_from_escrow <= available_escrow {
            // Normal case: sufficient escrow to cover all transfers
            (escrow_to_treasury, escrow_to_pool, available_escrow
                .checked_sub(total_required_from_escrow)
                .ok_or(PerpetualsError::MathOverflow)?)
        } else {
            // Bad debt case: insufficient escrow, prioritize pool first then treasury
            // Treasury will not get any fees in this case. Since the losses suffered 
            // are > collateral. All of the escrow will be used to pay the pool.
            
            let actual_pool = std::cmp::min(escrow_to_pool, available_escrow);
            let remaining_escrow = available_escrow
                .checked_sub(actual_pool)
                .ok_or(PerpetualsError::MathOverflow)?;
            let actual_treasury = remaining_escrow; // Treasury gets remainder after pool
            (actual_treasury, actual_pool, 0) // User gets nothing in bad debt scenario
        };
    
    let pool_to_user = user_profit
        .checked_add(funding_paid_to_user)
        .ok_or(PerpetualsError::MathOverflow)?;


    if final_escrow_to_treasury > 0 {
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
            final_escrow_to_treasury,
        )?;
    }

    if final_escrow_to_pool > 0 {
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
            final_escrow_to_pool,
        )?;
    }

    if escrow_to_user > 0 {
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
            escrow_to_user,
        )?; 
    }

    if pool_to_user > 0 {
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
            pool_to_user,
        )?;
    }   

            
    Ok(SettlementTransferResult {
        from_escrow_to_user: escrow_to_user,
        from_pool_to_user: pool_to_user,
        from_escrow_to_pool: final_escrow_to_pool,
        fee_to_treasury: final_escrow_to_treasury,
        fee_to_blp: details.fee_to_blp,
    })
}

/// Update liquidity pool state based on settlement using actual transferred amounts
pub fn update_pool_state(
    liquidity_pool: &mut LiquidityPool,
    transfer_result: &SettlementTransferResult,
    bad_debt_amount: u64,
) -> Result<()> {

    // Calculate net change to pool using ACTUAL transferred amounts
    // Pool gains from escrow and actual BLP fees, loses from payouts and bad debt
    let gains = (transfer_result.from_escrow_to_pool as i128);
    
    // Removed bad debt from pool losses
    let losses = (transfer_result.from_pool_to_user as i128);


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

/// Shared position closing logic
/// 
/// This function handles the common logic for closing positions:
/// - Proportional amount calculations
/// - Settlement calculations
/// - Position state updates
/// - Pool state updates
/// 
/// # Arguments
/// * `position` - The position to close
/// * `size_to_close` - Amount to close
/// * `exit_price` - Price at which to close
/// * `closing_type` - Type of closing (Normal, ForceClose, etc.)
/// * `treasury_cut_bps` - Treasury fee split
/// * `liquidity_pool` - Liquidity pool to update
/// * `transfer_result` - Result from settlement transfers
/// * `is_full_close` - Whether this is a full close
/// 
/// # Returns
/// * `Result<SettlementDetails>` - settlement_details
pub fn calculate_position_settlement(
    position: &Position,
    size_to_close: u64,
    exit_price: u64,
    closing_type: ClosingType,
    treasury_cut_bps: u64,
) -> Result<SettlementDetails> {
    // Calculate proportional amounts for settlement
    let (collateral_to_release, funding_to_release) = if size_to_close == position.size {
        (position.collateral, position.funding_accumulated)
    } else {
        let collateral = mul_div_u64(position.collateral, size_to_close, position.size)?;
        let funding = ((position.funding_accumulated as i128)
            .checked_mul(size_to_close as i128)
            .ok_or(PerpetualsError::MathOverflow)?)
        .checked_div(position.size as i128)
        .ok_or(PerpetualsError::MathOverflow)?;
        (collateral, funding as i128)
    };

        

    // Calculate PnL for the portion being closed
    let pnl = calculate_pnl(position.is_long, position.entry_price, size_to_close, exit_price)?;

    // Calculate settlement details using the snapshot
    let settlement_details = calculate_settlement(
        collateral_to_release,
        funding_to_release,
        size_to_close,
        pnl,
        closing_type,
        treasury_cut_bps,
        exit_price,
    )?;

    Ok(settlement_details)
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
pub fn update_position_after_settlement(
    position: &mut Position,
    size_to_close: u64,
    collateral_to_release: u64,
    funding_to_release: u64,
) -> Result<()> {
    position.size -= size_to_close;
    position.collateral -= collateral_to_release;
    position.funding_accumulated -= funding_to_release as i128;
    Ok(())
}
