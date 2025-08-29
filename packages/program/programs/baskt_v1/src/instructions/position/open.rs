use {
    crate::constants::{
        AUTHORITY_SEED, BPS_DIVISOR, ESCROW_SEED, LIQUIDITY_POOL_SEED, ORDER_SEED, POSITION_SEED,
        PRICE_PRECISION, PROTOCOL_SEED, USER_ESCROW_SEED,
    },
    crate::error::PerpetualsError,
    crate::events::*,
    crate::math::mul_div_u64,
    crate::state::{
        baskt::Baskt,
        liquidity::LiquidityPool,
        order::{Order, OrderAction, OrderStatus, OrderType},
        position::{Position, ProgramAuthority},
        protocol::{Protocol, Role},
    },
    crate::utils::{
        calc_min_collateral_from_notional, calc_opening_fee_with_effective_rate, effective_u64,
        split_fee,
    },
    anchor_lang::prelude::*,
    anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer},
};

/// Parameters for opening a position
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OpenPositionParams {
    pub position_id: u32,
    pub entry_price: u64,
}

/// OpenPosition
#[derive(Accounts)]
#[instruction(params: OpenPositionParams)]
pub struct OpenPosition<'info> {
    #[account(mut)]
    pub matcher: Signer<'info>,

    #[account(
        mut,
        seeds = [ORDER_SEED, order.owner.as_ref(), &order.order_id.to_le_bytes()],
        bump = order.bump,
        constraint = order.status as u8 == OrderStatus::Pending as u8 @ PerpetualsError::OrderAlreadyProcessed,
        constraint = order.action as u8 == OrderAction::Open as u8 @ PerpetualsError::InvalidOrderAction,
        close = order_owner // Close the order account and return rent to matcher
    )]
    pub order: Box<Account<'info, Order>>,

    /// CHECK: Order owner for return rent to owner
    #[account(
        mut,
        constraint = order_owner.key() == order.owner @ PerpetualsError::InvalidInput
    )]
    pub order_owner: UncheckedAccount<'info>,

    #[account(
        init,
        payer = matcher, // Matcher pays for position account creation
        space = Position::DISCRIMINATOR.len() + Position::INIT_SPACE,
        seeds = [POSITION_SEED, order.owner.as_ref(), &params.position_id.to_le_bytes()],
        bump
    )]
    pub position: Box<Account<'info, Position>>,

    /// Baskt account that contains the embedded oracle for price validation
    #[account(
        mut,
        constraint = baskt.key() == order.baskt_id.key() @ PerpetualsError::InvalidBaskt,
        constraint = baskt.is_trading() @ PerpetualsError::BasktNotActive
    )]
    pub baskt: Box<Account<'info, Baskt>>,

    /// Protocol account for checking permissions
    /// @dev Requires Matcher role to open positions
    #[account(
        constraint = protocol.feature_flags.allow_open_position && protocol.feature_flags.allow_trading @ PerpetualsError::PositionOperationsDisabled,
        constraint = protocol.has_permission(matcher.key(), Role::Matcher) @ PerpetualsError::Unauthorized,
        seeds = [PROTOCOL_SEED],
        bump
    )]
    pub protocol: Box<Account<'info, Protocol>>,

    /// Liquidity pool for account validation and fee accounting
    #[account(
        mut,
        seeds = [LIQUIDITY_POOL_SEED],
        bump = liquidity_pool.bump
    )]
    pub liquidity_pool: Box<Account<'info, LiquidityPool>>,

    #[account(
        mut,
        seeds = [USER_ESCROW_SEED, order.owner.as_ref()],
        bump,
        constraint = order_escrow.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = order_escrow.mint == protocol.collateral_mint @ PerpetualsError::InvalidMint
    )]
    pub order_escrow: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = matcher,
        seeds = [ESCROW_SEED, position.key().as_ref()],
        bump,
        token::mint = collateral_mint,
        token::authority = program_authority,
    )]
    pub owner_collateral_escrow_account: Box<Account<'info, TokenAccount>>,

    /// PDA used for token authority over escrow
    #[account(
        seeds = [AUTHORITY_SEED],
        bump,
    )]
    pub program_authority: Box<Account<'info, ProgramAuthority>>,

    /// Escrow mint (USDC) - validated via protocol
    #[account(
        constraint = collateral_mint.key() == protocol.collateral_mint @ PerpetualsError::InvalidMint
    )]
    pub collateral_mint: Account<'info, Mint>,

    /// Protocol treasury token account for fee collection
    #[account(
        mut,
        constraint = treasury_token.mint == protocol.collateral_mint @ PerpetualsError::InvalidMint,
        constraint = treasury_token.owner == protocol.treasury @ PerpetualsError::InvalidTreasuryAccount,
        constraint = treasury_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = treasury_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub treasury_token: Box<Account<'info, TokenAccount>>,

    /// BLP token vault for liquidity pool fees
    #[account(
        mut,
        constraint = usdc_vault.key() == liquidity_pool.usdc_vault @ PerpetualsError::InvalidUsdcVault,
        constraint = usdc_vault.mint == protocol.collateral_mint @ PerpetualsError::InvalidMint,
        constraint = treasury_token.key() != usdc_vault.key() @ PerpetualsError::InvalidInput
    )]
    pub usdc_vault: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}


pub fn open_position<'info>(
    ctx: Context<'_, '_, 'info, 'info, OpenPosition<'info>>,
    params: OpenPositionParams,
) -> Result<()> {
    let order = &ctx.accounts.order; // Order is closed, access immutably
    let position = &mut ctx.accounts.position;
    let market_indices = &ctx.accounts.baskt.market_indices;
    let bump = ctx.bumps.position;
    let clock = Clock::get()?;
    

    let open_params = order.get_open_params()?;

    // 1. Validate execution price is within order's slippage bounds
    order.validate_execution_price(params.entry_price)?;



    // ------------------------------------------------------------------
    // Derive the effective position size (auto-sizing for market orders)
    // ------------------------------------------------------------------

    let effective_leverage_bps = mul_div_u64(BPS_DIVISOR, open_params.leverage_bps, BPS_DIVISOR)?;
    let effective_min_cr_bps = std::cmp::max(effective_u64(
        ctx.accounts.baskt.config.get_min_collateral_ratio_bps(),
        ctx.accounts.protocol.config.min_collateral_ratio_bps,
    ), effective_leverage_bps);


    let opening_fee = calc_opening_fee_with_effective_rate(
        open_params.notional_value,
        ctx.accounts.baskt.config.get_opening_fee_bps(),
        ctx.accounts.protocol.config.opening_fee_bps,
    )?;

 
    let min_collateral_real =
        calc_min_collateral_from_notional(open_params.notional_value, effective_min_cr_bps)?;
    let total_required_real = min_collateral_real
        .checked_add(opening_fee)
        .ok_or(PerpetualsError::MathOverflow)?;

    require!(
        open_params.collateral >= total_required_real,
        PerpetualsError::InsufficientCollateral
    );

    // 6. Calculate net collateral after fee (using real notional for fee calculation)
    let net_collateral_amount = open_params
        .collateral
        .checked_sub(opening_fee)
        .ok_or(PerpetualsError::InsufficientCollateral)?;

    let num_of_contracts = mul_div_u64(open_params.notional_value, PRICE_PRECISION, params.entry_price)?;

    require!(num_of_contracts > 0, PerpetualsError::ZeroSizedPosition);
    position.initialize(
        order.owner,
        params.position_id as u32,
        order.baskt_id,
        num_of_contracts,
        net_collateral_amount,
        open_params.is_long,
        params.entry_price,
        market_indices.cumulative_funding_index,
        market_indices.cumulative_borrow_index,
        ctx.accounts.baskt.rebalance_fee_index.cumulative_index,
        clock.unix_timestamp as u32,
        bump,
    )?;

    // Increment open positions count
    ctx.accounts.baskt.open_positions = ctx
        .accounts
        .baskt
        .open_positions
        .checked_add(1)
        .ok_or(PerpetualsError::MathOverflow)?;

    // Signer seeds for program authority
    let authority_seeds: &[&[u8]] = &[AUTHORITY_SEED, &[ctx.bumps.program_authority]];
    let authority_signer: &[&[&[u8]]] = &[authority_seeds];

    // 1. Split and transfer opening fee between treasury and BLP
    let (fee_to_treasury, fee_to_blp) = if opening_fee > 0 {
        let (treasury_fee, blp_fee) =
            split_fee(opening_fee, ctx.accounts.protocol.config.treasury_cut_bps)?;

        // Transfer treasury portion
        if treasury_fee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.order_escrow.to_account_info(),
                        to: ctx.accounts.treasury_token.to_account_info(),
                        authority: ctx.accounts.program_authority.to_account_info(),
                    },
                    authority_signer,
                ),
                treasury_fee,
            )?;
        }

        // Transfer BLP portion to token vault
        if blp_fee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.order_escrow.to_account_info(),
                        to: ctx.accounts.usdc_vault.to_account_info(),
                        authority: ctx.accounts.program_authority.to_account_info(),
                    },
                    authority_signer,
                ),
                blp_fee,
            )?;

            // Update liquidity pool accounting to match vault balance
            // This ensures vault_balance == total_liquidity and prevents LP share calculation exploits
            ctx.accounts.liquidity_pool.increase_liquidity(blp_fee)?;
        }

        (treasury_fee, blp_fee)
    } else {
        (0, 0)
    };

    // 2. Transfer net collateral from order escrow to the new position escrow
    let collateral_amount = net_collateral_amount;
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.order_escrow.to_account_info(),
                to: ctx
                    .accounts
                    .owner_collateral_escrow_account
                    .to_account_info(),
                authority: ctx.accounts.program_authority.to_account_info(),
            },
            authority_signer,
        ),
        collateral_amount,
    )?;

    // Emit events
 
    emit!(PositionOpenedEvent {
        order_id: order.order_id as u64,
        owner: position.owner,
        position_id: params.position_id as u64,
        baskt_id: position.baskt_id,
        size: position.size,
        collateral: position.collateral,
        is_long: position.is_long,
        entry_price: params.entry_price,
        fee_to_treasury,
        fee_to_blp,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
