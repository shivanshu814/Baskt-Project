use {
    crate::constants::*,
    crate::error::PerpetualsError,
    crate::events::*,
    crate::state::{
        baskt::Baskt,
        funding_index::FundingIndex,
        liquidity::LiquidityPool,
        order::{Order, OrderAction, OrderStatus},
        position::{Position, PositionStatus, ProgramAuthority},
        protocol::{Protocol, Role},
    },
    anchor_lang::prelude::*,
    anchor_spl::token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer},
};

//----------------------------------------------------------------------------
// INSTRUCTION HANDLERS: POSITION
//----------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(params: OpenPositionParams)]
pub struct OpenPosition<'info> {
    #[account(mut)]
    pub matcher: Signer<'info>,

    #[account(
        mut,
        seeds = [b"order", order.owner.as_ref(), &order.order_id.to_le_bytes()],
        bump = order.bump,
        constraint = order.status as u8 == OrderStatus::Pending as u8 @ PerpetualsError::OrderAlreadyProcessed,
        constraint = order.action as u8 == OrderAction::Open as u8 @ PerpetualsError::InvalidOrderAction,
        close = matcher // Close the order account and return rent to matcher
    )]
    pub order: Account<'info, Order>,

    #[account(
        init,
        payer = matcher, // Matcher pays for position account creation
        space = Position::DISCRIMINATOR.len() + Position::INIT_SPACE,
        seeds = [b"position", order.owner.as_ref(), &params.position_id.to_le_bytes()],
        bump
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        seeds = [b"funding_index", order.baskt_id.as_ref()],
        bump = funding_index.bump
    )]
    pub funding_index: Account<'info, FundingIndex>,

    /// Baskt account that contains the embedded oracle for price validation
    #[account(
        constraint = baskt.key() == order.baskt_id.key() @ PerpetualsError::InvalidBaskt,
        constraint = baskt.is_active @ PerpetualsError::BasktInactive
    )]
    pub baskt: Account<'info, Baskt>,

    /// Protocol account for checking permissions
    /// @dev Requires Matcher role to open positions
    #[account(
        seeds = [b"protocol"],
        bump,
        owner = crate::ID @ PerpetualsError::InvalidProgramAuthority,
        constraint = protocol.has_permission(matcher.key(), Role::Matcher) @ PerpetualsError::Unauthorized
    )]
    pub protocol: Account<'info, Protocol>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    #[account( constraint = escrow_mint.key() == Constants::ESCROW_MINT @ PerpetualsError::InvalidMint )]
    pub escrow_mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [b"user_escrow", order.owner.as_ref()],
        bump,
        constraint = order_escrow.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority
    )]
    pub order_escrow: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = matcher,
        seeds = [b"escrow", position.key().as_ref()],
        bump,
        token::mint = escrow_mint,
        token::authority = program_authority,
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    /// PDA used for token authority over escrow
    #[account(
        init_if_needed,
        payer = matcher,
        space = ProgramAuthority::DISCRIMINATOR.len() + ProgramAuthority::INIT_SPACE,
        seeds = [b"authority"],
        bump
    )]
    pub program_authority: Account<'info, ProgramAuthority>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OpenPositionParams {
    pub position_id: u64,
    pub entry_price: u64,
}

pub fn open_position(ctx: Context<OpenPosition>, params: OpenPositionParams) -> Result<()> {
    let order = &ctx.accounts.order; // Order is closed, access immutably
    let position = &mut ctx.accounts.position;
    let funding_index = &ctx.accounts.funding_index;
    let bump = ctx.bumps.position;
    let clock = Clock::get()?;

    // TODO: Validate oracle price is fresh and valid

    // Initialize the position using existing Position::initialize
    position.initialize(
        order.owner,
        params.position_id,
        order.baskt_id,
        order.size,
        order.collateral,
        order.is_long,
        params.entry_price,
        funding_index.cumulative_index, // Use current funding index
        clock.unix_timestamp,
        bump,
    )?;

    // Transfer collateral from order escrow to the new position escrow
    let collateral_amount = order.collateral;
    // PDA signer seeds: ["authority", bump]
    let seeds: &[&[u8]] = &[b"authority".as_ref(), &[ctx.bumps.program_authority]];
    let signer_seeds: &[&[&[u8]]] = &[seeds];
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.order_escrow.to_account_info(),
                to: ctx.accounts.escrow_token.to_account_info(),
                authority: ctx.accounts.program_authority.to_account_info(),
            },
            signer_seeds,
        ),
        collateral_amount,
    )?;

    // Order account is closed automatically via `close = matcher`.
    // No need to call order.fill() if closing.

    // Emit event using existing struct
    emit!(PositionOpenedEvent {
        owner: position.owner,
        position_id: params.position_id,
        baskt_id: position.baskt_id,
        size: position.size,
        collateral: position.collateral,
        is_long: position.is_long,
        entry_price: params.entry_price,
        entry_funding_index: position.entry_funding_index,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(params: AddCollateralParams)]
pub struct AddCollateral<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref(), &position.position_id.to_le_bytes()],
        bump = position.bump,
        constraint = position.owner == owner.key() @ PerpetualsError::Unauthorized,
        constraint = position.status as u8 == PositionStatus::Open as u8 @ PerpetualsError::PositionAlreadyClosed,
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        constraint = owner_token.owner == owner.key() @ PerpetualsError::Unauthorized,
        constraint = owner_token.mint == escrow_token.mint @ PerpetualsError::InvalidMint,
        constraint = owner_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = owner_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub owner_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"escrow", position.key().as_ref()],
        bump,
        constraint = escrow_token.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = escrow_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = escrow_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    /// PDA used for token authority over escrow
    #[account(
        seeds = [b"authority"],
        bump
    )]
    pub program_authority: Account<'info, ProgramAuthority>,

    /// Protocol account - required for validating the feature flag
    #[account(
        seeds = [b"protocol"],
        bump,
        constraint = protocol.feature_flags.allow_add_collateral @ PerpetualsError::FeatureDisabled
    )]
    pub protocol: Account<'info, Protocol>,

    pub token_program: Program<'info, Token>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AddCollateralParams {
    pub additional_collateral: u64,
}

pub fn add_collateral(ctx: Context<AddCollateral>, params: AddCollateralParams) -> Result<()> {
    // Validate input
    require!(
        params.additional_collateral > 0,
        PerpetualsError::InsufficientCollateral
    );

    let position = &mut ctx.accounts.position;
    let clock = Clock::get()?;

    // Transfer tokens from owner to escrow
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.owner_token.to_account_info(),
                to: ctx.accounts.escrow_token.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        ),
        params.additional_collateral,
    )?;

    // Update position collateral
    position.add_collateral(params.additional_collateral)?;

    // Emit event
    emit!(CollateralAddedEvent {
        owner: position.owner,
        position_id: position.position_id,
        baskt_id: position.baskt_id,
        additional_collateral: params.additional_collateral,
        new_total_collateral: position.collateral,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(exit_price: u64)]
pub struct ClosePosition<'info> {
    #[account(mut)]
    pub matcher: Signer<'info>,

    #[account(
        mut,
        seeds = [b"order", order.owner.as_ref(), &order.order_id.to_le_bytes()],
        bump = order.bump,
        constraint = order.status as u8 == OrderStatus::Pending as u8 @ PerpetualsError::OrderAlreadyProcessed,
        constraint = order.action as u8 == OrderAction::Close as u8 @ PerpetualsError::InvalidOrderAction,
        constraint = order.target_position.is_some() @ PerpetualsError::InvalidTargetPosition,
        close = matcher // Close the order account
    )]
    pub order: Box<Account<'info, Order>>,

    #[account(
        mut,
        seeds = [b"position", position.owner.as_ref(), &position.position_id.to_le_bytes()],
        bump = position.bump,
        constraint = position.owner == order.owner @ PerpetualsError::Unauthorized,
        constraint = position.status as u8 == PositionStatus::Open as u8 @ PerpetualsError::PositionAlreadyClosed,
        close = matcher,
    )]
    pub position: Box<Account<'info, Position>>,

    #[account(
        mut,
        seeds = [b"funding_index", position.baskt_id.as_ref()],
        bump = funding_index.bump
    )]
    pub funding_index: Account<'info, FundingIndex>,

    /// Baskt account that contains the embedded oracle for price validation
    #[account(
        constraint = baskt.key() == position.baskt_id @ PerpetualsError::InvalidBaskt,
        constraint = baskt.is_active @ PerpetualsError::BasktInactive
    )]
    pub baskt: Box<Account<'info, Baskt>>,

    #[account(
        mut,
        constraint = owner_token.owner == position.owner @ PerpetualsError::Unauthorized,
        constraint = owner_token.mint == escrow_token.mint @ PerpetualsError::InvalidMint,
        constraint = owner_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = owner_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub owner_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = escrow_token.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = escrow_token.mint == treasury_token.mint @ PerpetualsError::InvalidMint,
        constraint = escrow_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = escrow_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = treasury_token.owner == treasury.key() @ PerpetualsError::InvalidTreasuryAccount,
        constraint = treasury_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = treasury_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub treasury_token: Account<'info, TokenAccount>,

    /// CHECK: Treasury account for fees - should be configured in protocol state?
    #[account(
        constraint = protocol.has_permission(treasury.key(), Role::Treasury) @ PerpetualsError::InvalidTreasuryAccount
    )]
    pub treasury: UncheckedAccount<'info>,

    /// PDA used for token authority over escrow
    #[account(
        seeds = [b"authority"],
        bump
    )]
    pub program_authority: Account<'info, ProgramAuthority>,

    /// Protocol account for checking permissions
    /// @dev Requires Matcher role to close positions
    #[account(
        seeds = [b"protocol"],
        bump,
        owner = crate::ID @ PerpetualsError::InvalidProgramAuthority,
        constraint = protocol.has_permission(matcher.key(), Role::Matcher) @ PerpetualsError::Unauthorized
    )]
    pub protocol: Box<Account<'info, Protocol>>,

    /// Shared liquidity pool (counter-party)
    #[account(
        mut,
        seeds = [b"liquidity_pool", protocol.key().as_ref()],
        bump
    )]
    pub liquidity_pool: Box<Account<'info, LiquidityPool>>,

    /// SPL-token vault that holds pooled collateral
    #[account(
        mut,
        constraint = token_vault.key() == liquidity_pool.token_vault @ PerpetualsError::InvalidTokenVault,
        constraint = token_vault.owner == pool_authority.key() @ PerpetualsError::Unauthorized
    )]
    pub token_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA authority for token_vault
    #[account(
        seeds = [b"pool_authority", liquidity_pool.key().as_ref(), protocol.key().as_ref()],
        bump
    )]
    pub pool_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ClosePositionParams {
    pub exit_price: u64,
}

pub fn close_position(ctx: Context<ClosePosition>, params: ClosePositionParams) -> Result<()> {
    let order = &ctx.accounts.order;
    let position = &mut ctx.accounts.position;
    let funding_index = &ctx.accounts.funding_index;
    let clock = Clock::get()?;

    // Validate that the target position in the order matches the provided position
    let target_pos_key = order
        .target_position
        .ok_or(PerpetualsError::InvalidTargetPosition)?;
    require_keys_eq!(
        target_pos_key,
        position.key(),
        PerpetualsError::InvalidTargetPosition
    );

    // TODO: Validate oracle price is fresh and valid

    // Settle the position state: update funding, set exit price, status, timestamp
    position.settle_close(
        params.exit_price,
        funding_index.cumulative_index,
        clock.unix_timestamp,
    )?;

    // Calculate PnL, funding, and closing fee
    let pnl = position.calculate_pnl()?; // i64
    let funding_amount = position.funding_accumulated; // i128 (can be negative if user pays funding)
    let closing_fee = (position.size as u128)
        .checked_mul(Constants::CLOSING_FEE_BPS as u128)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_div(Constants::BPS_DIVISOR as u128)
        .ok_or(PerpetualsError::MathOverflow)? as u64;

    // Signer seeds
    let authority_signer_seeds = [b"authority".as_ref(), &[ctx.bumps.program_authority]];
    let authority_signer = &[&authority_signer_seeds[..]];

    let lp_key = ctx.accounts.liquidity_pool.key();
    let proto_key = ctx.accounts.protocol.key();
    let pool_authority_signer_seeds = [
        b"pool_authority".as_ref(),
        lp_key.as_ref(),
        proto_key.as_ref(),
        &[ctx.bumps.pool_authority],
    ];
    let pool_authority_signer = &[&pool_authority_signer_seeds[..]];

    // 1. Calculate user's total gross payout (collateral + PnL + Funding)
    let total_gross_to_user_i128 = (position.collateral as i128)
        .checked_add(pnl as i128)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_add(funding_amount) // funding_amount is i128
        .ok_or(PerpetualsError::MathOverflow)?;
    
    // 2. Calculate user's net payout after fee if positive
    let user_total_payout_u64: u64;
    let fee_amount: u64;
    
    if total_gross_to_user_i128 > 0 {
        // User has positive payout, subtract fee from their payout
        let gross_payout = total_gross_to_user_i128 as u64;
        fee_amount = std::cmp::min(closing_fee, gross_payout);
        user_total_payout_u64 = gross_payout.saturating_sub(fee_amount);
    } else {
        // User in loss, pool gets the fee from escrow
        user_total_payout_u64 = 0;
        fee_amount = closing_fee;
    }
    
    let initial_escrow_balance = ctx.accounts.escrow_token.amount;
    let mut current_escrow_balance = initial_escrow_balance;
    
    // 3. Transfer fee to treasury first
    if fee_amount > 0 && fee_amount <= current_escrow_balance {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token.to_account_info(),
                    to: ctx.accounts.treasury_token.to_account_info(),
                    authority: ctx.accounts.program_authority.to_account_info(),
                },
                authority_signer,
            ),
            fee_amount,
        )?;
        current_escrow_balance = current_escrow_balance
            .checked_sub(fee_amount)
            .ok_or(PerpetualsError::MathOverflow)?;
    }

    // 4. Determine amounts from escrow for user payout and update escrow balance
    let payout_from_escrow_to_user = std::cmp::min(user_total_payout_u64, current_escrow_balance);
    
    if payout_from_escrow_to_user > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token.to_account_info(),
                    to: ctx.accounts.owner_token.to_account_info(),
                    authority: ctx.accounts.program_authority.to_account_info(),
                },
                authority_signer,
            ),
            payout_from_escrow_to_user,
        )?;
        current_escrow_balance = current_escrow_balance
            .checked_sub(payout_from_escrow_to_user)
            .ok_or(PerpetualsError::MathOverflow)?;
    }

    // Amount user still needs, to be paid by the liquidity pool
    let payout_from_pool_to_user = user_total_payout_u64
        .checked_sub(payout_from_escrow_to_user)
        .ok_or(PerpetualsError::MathOverflow)?;

    // `current_escrow_balance` now holds the final remainder in escrow, which is destined for the pool vault.
    let final_escrow_remainder_to_pool_vault = current_escrow_balance;

    // 4. Perform token transfers involving the Liquidity Pool Vault
    // 4a. Pool pays user if necessary
    if payout_from_pool_to_user > 0 {
        require!(
            ctx.accounts.liquidity_pool.total_liquidity >= payout_from_pool_to_user,
            PerpetualsError::InsufficientLiquidity
        );
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.token_vault.to_account_info(),
                    to: ctx.accounts.owner_token.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
                pool_authority_signer,
            ),
            payout_from_pool_to_user,
        )?;
    }

    // 4b. Remaining escrow funds go to the pool vault
    if final_escrow_remainder_to_pool_vault > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token.to_account_info(),
                    to: ctx.accounts.token_vault.to_account_info(),
                    authority: ctx.accounts.program_authority.to_account_info(),
                },
                authority_signer,
            ),
            final_escrow_remainder_to_pool_vault,
        )?;
    }

    // 5. Update Liquidity Pool state with the net effect of these transfers
    // Pool gains `final_escrow_remainder_to_pool_vault`
    // Pool loses `payout_from_pool_to_user`
    let net_change_for_lp_state_i128 = (final_escrow_remainder_to_pool_vault as i128)
        .checked_sub(payout_from_pool_to_user as i128)
        .ok_or(PerpetualsError::MathOverflow)?;

    if net_change_for_lp_state_i128 > 0 {
        ctx.accounts
            .liquidity_pool
            .increase_liquidity(net_change_for_lp_state_i128 as u64)?;
    } else if net_change_for_lp_state_i128 < 0 {
        ctx.accounts
            .liquidity_pool
            .decrease_liquidity(net_change_for_lp_state_i128.abs() as u64)?;
    }

    // Manually close the position escrow token account via token program
    token::close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.escrow_token.to_account_info(),
            destination: ctx.accounts.matcher.to_account_info(),
            authority: ctx.accounts.program_authority.to_account_info(),
        },
        authority_signer,
    ))?;

    // Emit event
    emit!(PositionClosedEvent {
        owner: position.owner,
        position_id: position.position_id,
        baskt_id: position.baskt_id.key(),
        size: position.size,
        exit_price: params.exit_price,
        pnl,                                      // Raw PnL
        fee_amount,                              // The actual fee paid to treasury
        funding_payment: funding_amount,          // Raw funding amount component
        settlement_amount: user_total_payout_u64, // Net amount user received
        pool_payout: payout_from_pool_to_user, // Portion of settlement_amount that came from pool
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(exit_price: u64)]
pub struct LiquidatePosition<'info> {
    #[account(mut)]
    pub liquidator: Signer<'info>,

    #[account(
        mut,
        seeds = [b"position", position.owner.as_ref(), &position.position_id.to_le_bytes()],
        bump = position.bump,
        constraint = position.status as u8 == PositionStatus::Open as u8 @ PerpetualsError::PositionAlreadyClosed,
        close = liquidator,
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        seeds = [b"funding_index", position.baskt_id.as_ref()],
        bump = funding_index.bump
    )]
    pub funding_index: Account<'info, FundingIndex>,

    /// Baskt account that contains the embedded oracle for price validation
    #[account(
        constraint = baskt.key() == position.baskt_id @ PerpetualsError::InvalidBaskt,
        constraint = baskt.is_active @ PerpetualsError::BasktInactive
    )]
    pub baskt: Account<'info, Baskt>,

    #[account(
        mut,
        constraint = owner_token.owner == position.owner @ PerpetualsError::Unauthorized,
        constraint = owner_token.mint == escrow_token.mint @ PerpetualsError::InvalidMint,
        constraint = owner_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = owner_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub owner_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = escrow_token.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = escrow_token.mint == treasury_token.mint @ PerpetualsError::InvalidMint,
        constraint = escrow_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = escrow_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = treasury_token.owner == treasury.key() @ PerpetualsError::InvalidTreasuryAccount,
        constraint = treasury_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = treasury_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub treasury_token: Account<'info, TokenAccount>,

    /// CHECK: Treasury account for fees
    #[account(
        constraint = protocol.has_permission(treasury.key(), Role::Treasury) @ PerpetualsError::InvalidTreasuryAccount
    )]
    pub treasury: UncheckedAccount<'info>,

    /// PDA used for token authority over escrow
    #[account(
        seeds = [b"authority"],
        bump
    )]
    pub program_authority: Account<'info, ProgramAuthority>,

    /// Protocol account for checking permissions
    /// @dev Requires Liquidator role to liquidate positions
    #[account(
        seeds = [b"protocol"],
        bump,
        owner = crate::ID @ PerpetualsError::InvalidProgramAuthority,
        constraint = protocol.has_permission(liquidator.key(), Role::Liquidator) @ PerpetualsError::Unauthorized
    )]
    pub protocol: Account<'info, Protocol>,

    /// Shared liquidity pool (counter-party)
    #[account(
        mut,
        seeds = [b"liquidity_pool", protocol.key().as_ref()],
        bump
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    /// SPL-token vault that holds pooled collateral
    #[account(
        mut,
        constraint = token_vault.key() == liquidity_pool.token_vault @ PerpetualsError::InvalidTokenVault,
        constraint = token_vault.owner == pool_authority.key() @ PerpetualsError::Unauthorized
    )]
    pub token_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA authority for token_vault
    #[account(
        seeds = [b"pool_authority", liquidity_pool.key().as_ref(), protocol.key().as_ref()],
        bump
    )]
    pub pool_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct LiquidatePositionParams {
    pub exit_price: u64,
}

pub fn liquidate_position(
    ctx: Context<LiquidatePosition>,
    params: LiquidatePositionParams,
) -> Result<()> {
    let position = &mut ctx.accounts.position;
    let funding_index = &ctx.accounts.funding_index;
    let clock = Clock::get()?;

    // TODO: Validate oracle price is fresh and valid

    // Update funding first to ensure accurate liquidation check
    position.update_funding(funding_index.cumulative_index)?;

    // Check if position is liquidatable at the provided exit_price
    let is_liquidatable = position.is_liquidatable(params.exit_price)?;
    require!(is_liquidatable, PerpetualsError::PositionNotLiquidatable);

    // Liquidate the position state, updating status, exit price, etc.
    position.liquidate(
        params.exit_price,
        funding_index.cumulative_index,
        clock.unix_timestamp,
    )?;

    // Calculate PnL, funding, and raw liquidation fee
    let pnl = position.calculate_pnl()?; // i64
    let funding_amount = position.funding_accumulated; // i128 (can be negative if user pays funding)
                                                       // Liquidation fee is a percentage of position size, intended for treasury
    let raw_liquidation_fee = (position.size as u128)
        .checked_mul(Constants::LIQUIDATION_FEE_BPS as u128)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_div(Constants::BPS_DIVISOR as u128)
        .ok_or(PerpetualsError::MathOverflow)? as u64;

    // Signer seeds
    let authority_signer_seeds = [b"authority".as_ref(), &[ctx.bumps.program_authority]];
    let authority_signer = &[&authority_signer_seeds[..]];

    let lp_key = ctx.accounts.liquidity_pool.key();
    let proto_key = ctx.accounts.protocol.key();
    let pool_authority_signer_seeds = [
        b"pool_authority".as_ref(),
        lp_key.as_ref(),
        proto_key.as_ref(),
        &[ctx.bumps.pool_authority],
    ];
    let pool_authority_signer = &[&pool_authority_signer_seeds[..]];

    // 1. Transfer liquidation fee to treasury (capped at initial escrow balance)
    let initial_escrow_balance = ctx.accounts.escrow_token.amount;
    let mut current_escrow_balance = initial_escrow_balance;

    let liquidation_fee_paid_to_treasury =
        std::cmp::min(raw_liquidation_fee, initial_escrow_balance);

    if liquidation_fee_paid_to_treasury > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token.to_account_info(),
                    to: ctx.accounts.treasury_token.to_account_info(),
                    authority: ctx.accounts.program_authority.to_account_info(),
                },
                authority_signer,
            ),
            liquidation_fee_paid_to_treasury,
        )?;
        current_escrow_balance = current_escrow_balance
            .checked_sub(liquidation_fee_paid_to_treasury)
            .ok_or(PerpetualsError::MathOverflow)?;
    }

    // 2. Calculate position owner's total net settlement (collateral + PnL + Funding)
    let owner_net_settlement_i128 = (position.collateral as i128)
        .checked_add(pnl as i128)
        .ok_or(PerpetualsError::MathOverflow)?
        .checked_add(funding_amount) // funding_amount is i128
        .ok_or(PerpetualsError::MathOverflow)?;

    let owner_payout_u64 = if owner_net_settlement_i128 > 0 {
        owner_net_settlement_i128 as u64
    } else {
        0 // Owner receives nothing if their net settlement is negative
    };

    // 3. Determine amounts from escrow for owner payout and update escrow balance
    let payout_from_escrow_to_owner = std::cmp::min(owner_payout_u64, current_escrow_balance);

    if payout_from_escrow_to_owner > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token.to_account_info(),
                    to: ctx.accounts.owner_token.to_account_info(),
                    authority: ctx.accounts.program_authority.to_account_info(),
                },
                authority_signer,
            ),
            payout_from_escrow_to_owner,
        )?;
        current_escrow_balance = current_escrow_balance
            .checked_sub(payout_from_escrow_to_owner)
            .ok_or(PerpetualsError::MathOverflow)?;
    }

    // Amount owner still needs, to be paid by the liquidity pool
    let payout_from_pool_to_owner = owner_payout_u64
        .checked_sub(payout_from_escrow_to_owner)
        .ok_or(PerpetualsError::MathOverflow)?;

    // `current_escrow_balance` now holds the final remainder in escrow, destined for the pool vault.
    let final_escrow_remainder_to_pool_vault = current_escrow_balance;

    // 4. Perform token transfers involving the Liquidity Pool Vault
    // 4a. Pool pays owner if necessary
    if payout_from_pool_to_owner > 0 {
        require!(
            ctx.accounts.liquidity_pool.total_liquidity >= payout_from_pool_to_owner,
            PerpetualsError::InsufficientLiquidity
        );
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.token_vault.to_account_info(),
                    to: ctx.accounts.owner_token.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
                pool_authority_signer,
            ),
            payout_from_pool_to_owner,
        )?;
    }

    // 4b. Remaining escrow funds go to the pool vault
    if final_escrow_remainder_to_pool_vault > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token.to_account_info(),
                    to: ctx.accounts.token_vault.to_account_info(),
                    authority: ctx.accounts.program_authority.to_account_info(),
                },
                authority_signer,
            ),
            final_escrow_remainder_to_pool_vault,
        )?;
    }

    // 5. Update Liquidity Pool state with the net effect
    let net_change_for_lp_state_i128 = (final_escrow_remainder_to_pool_vault as i128)
        .checked_sub(payout_from_pool_to_owner as i128)
        .ok_or(PerpetualsError::MathOverflow)?;

    if net_change_for_lp_state_i128 > 0 {
        ctx.accounts
            .liquidity_pool
            .increase_liquidity(net_change_for_lp_state_i128 as u64)?;
    } else if net_change_for_lp_state_i128 < 0 {
        ctx.accounts
            .liquidity_pool
            .decrease_liquidity(net_change_for_lp_state_i128.abs() as u64)?;
    }

    // Position account is closed to `liquidator` via constraint in Accounts struct.

    // Emit event
    emit!(PositionLiquidatedEvent {
        owner: position.owner,
        position_id: position.position_id,
        baskt_id: position.baskt_id,
        size: position.size,
        exit_price: params.exit_price,
        pnl,                                               // Raw PnL for the owner
        liquidation_fee: liquidation_fee_paid_to_treasury, // Actual fee paid to treasury
        funding_payment: funding_amount,                   // Raw funding amount component
        remaining_collateral: owner_payout_u64,            // Net amount owner received
        pool_payout: payout_from_pool_to_owner, // Portion of owner's payout that came from pool
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
