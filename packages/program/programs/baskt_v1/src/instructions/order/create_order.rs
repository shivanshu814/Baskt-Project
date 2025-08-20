use crate::constants::BPS_DIVISOR;
use crate::constants::{
    AUTHORITY_SEED, ORDER_SEED, PROTOCOL_SEED,
    USER_ESCROW_SEED,
};
use crate::error::PerpetualsError;
use crate::events::*;
use crate::math::mul_div_u64;
use crate::state::{
    baskt::{Baskt, BasktStatus},
    order::{Order, OrderAction, OrderStatus, OrderType, OpenOrderParams, CloseOrderParams, MarketOrderParams, LimitOrderParams},
    protocol::Protocol,
};
use crate::utils::{
    calc_min_collateral_from_notional, calc_opening_fee_with_effective_rate, effective_u64,
};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

//----------------------------------------------------------------------------
// PARAMS STRUCTURES
//----------------------------------------------------------------------------

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct CreateOrderParams {
    pub order_id: u32,
    pub notional_value: u64,
    pub collateral: u64,
    pub is_long: bool,
    pub action: OrderAction,
    pub target_position: Option<Pubkey>,
    pub size_as_contracts: Option<u64>,
    pub limit_price: u64,
    pub max_slippage_bps: u64,
    pub leverage_bps: u64,
    pub order_type: OrderType,
}

//----------------------------------------------------------------------------
// INSTRUCTION HANDLERS: ORDER
//----------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(params: CreateOrderParams)]
pub struct CreateOrder<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = Order::DISCRIMINATOR.len() + Order::INIT_SPACE,
        seeds = [ORDER_SEED, owner.key().as_ref(), &params.order_id.to_le_bytes()],
        bump
    )]
    pub order: Account<'info, Order>,

    /// Baskt account
    #[account()]
    pub baskt: Account<'info, Baskt>,

    #[account(
        mut,
        constraint = owner_collateral_account.owner == owner.key() @ PerpetualsError::UnauthorizedTokenOwner,
        constraint = owner_collateral_account.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = owner_collateral_account.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority,
        constraint = owner_collateral_account.mint == collateral_mint.key() @ PerpetualsError::InvalidMint
    )]
    pub owner_collateral_account: Account<'info, TokenAccount>,

    #[account(
        constraint = collateral_mint.key() == protocol.collateral_mint @ PerpetualsError::InvalidMint
    )]
    pub collateral_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = owner,
        seeds = [USER_ESCROW_SEED, owner.key().as_ref()],
        bump,
        token::mint = collateral_mint,
        token::authority = program_authority,
    )]
    pub owner_collateral_escrow_account: Account<'info, TokenAccount>,

    ///CHECK: PDA used for token authority over escrow for future operations
    #[account(
        seeds = [AUTHORITY_SEED],
        bump,
    )]
    pub program_authority: AccountInfo<'info>,

    /// Protocol account to verify feature flags
    #[account(
        seeds = [PROTOCOL_SEED],
        bump,
        constraint = protocol.feature_flags.allow_trading @ PerpetualsError::TradingDisabled
    )]
    pub protocol: Account<'info, Protocol>,

    pub system_program: Program<'info, System>,

    ///CHECK: Token program is expected
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_order(
    ctx: Context<CreateOrder>,
    params: CreateOrderParams,
) -> Result<()> {

    if params.order_type == OrderType::Limit {
        require!(params.limit_price > 0, PerpetualsError::InvalidInput);
    }

    // Validate based on action type
    if params.action == OrderAction::Open {
        // Ensure the baskt is active for trading
        require!(
            ctx.accounts.baskt.is_trading(),
            PerpetualsError::InvalidBasktState
        );

        // For private baskts, only the creator can create orders
        if !ctx.accounts.baskt.is_public {
            require!(
                ctx.accounts.owner.key() == ctx.accounts.baskt.creator,
                PerpetualsError::Unauthorized
            );
        }

        // Basic collateral check
        require!(params.collateral > 0, PerpetualsError::InsufficientCollateral);

        // Notional value must be > 0 and within configured bounds
        require!(params.notional_value > 0, PerpetualsError::ZeroSizedPosition);          


        const MAX_REASONABLE_NOTIONAL: u64 = 1_000_000_000_000_000; // 1B USDC
        require!(
            params.notional_value <= MAX_REASONABLE_NOTIONAL,
            PerpetualsError::MathOverflow
        );

        let min_collateral_ratio_bps = effective_u64(
            ctx.accounts.baskt.config.get_min_collateral_ratio_bps(),
            ctx.accounts.protocol.config.min_collateral_ratio_bps,
        );

        // Calculate effective collateral ratio: use the higher of min collateral ratio or leverage requirement
        let leverage_ratio_bps = BPS_DIVISOR.checked_div(params.leverage_bps).ok_or(PerpetualsError::MathOverflow)?;
        let effective_collateral_ratio_bps = std::cmp::max(min_collateral_ratio_bps, leverage_ratio_bps);

        // Calculate required collateral using the effective ratio
        let min_collateral = calc_min_collateral_from_notional(params.notional_value, effective_collateral_ratio_bps)?;

        let opening_fee = calc_opening_fee_with_effective_rate(
            params.notional_value,
            ctx.accounts.baskt.config.get_opening_fee_bps(),
            ctx.accounts.protocol.config.opening_fee_bps,
        )?;

        let total_required = min_collateral
            .checked_add(opening_fee)
            .ok_or(PerpetualsError::MathOverflow)?;

        require!(
            params.collateral >= total_required,
            PerpetualsError::InsufficientCollateral
        );
    } else {
        require!(
            ctx.accounts.baskt.is_trading() || ctx.accounts.baskt.is_unwinding(),
            PerpetualsError::InvalidBasktState
        );
        // Close orders still require a target position
        require!(
            params.target_position.is_some(),
            PerpetualsError::InvalidTargetPosition
        );

        // TODO nshmadhani / siddu: HERE
        // Check if position size is >= than order size
    }

    let order = &mut ctx.accounts.order;
    let baskt = &ctx.accounts.baskt;
    let owner = &ctx.accounts.owner;
    let bump = ctx.bumps.order;
    let clock = Clock::get()?;

    // Step 1: Initialize the order with basic info and action
    order.initialize(
        owner.key(),
        params.order_id as u32,
        baskt.key(),
        params.action,
        clock.unix_timestamp as u32,
        bump,
    )?;

    // Step 2: Initialize action-specific parameters
    match params.action {
        OrderAction::Open => {
            order.init_open(OpenOrderParams {
                notional_value: params.notional_value,
                leverage_bps: params.leverage_bps,
                collateral: params.collateral,
                is_long: params.is_long,
            })?;
        }
        OrderAction::Close => {
            let target_position = params.target_position.ok_or(PerpetualsError::InvalidTargetPosition)?;
            require!(params.size_as_contracts.is_some(), PerpetualsError::InvalidInput);
            require!(params.size_as_contracts.unwrap() > 0, PerpetualsError::InvalidInput);
            order.init_close(CloseOrderParams {
                size_as_contracts: params.size_as_contracts.unwrap(), 
                target_position,
            })?;
        }
    }

    // Step 3: Initialize order type-specific parameters
    match params.order_type {
        OrderType::Market => {
            order.init_market()?;
        }
        OrderType::Limit => {
            order.init_limit(LimitOrderParams {
                limit_price: params.limit_price,
                max_slippage_bps: params.max_slippage_bps,
            })?;
        }
    }

    // Transfer collateral to escrow if this is an open order
    if params.action == OrderAction::Open {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.owner_collateral_account.to_account_info(),
                    to: ctx
                        .accounts
                        .owner_collateral_escrow_account
                        .to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            params.collateral,
        )?;
    }

    // Emit event for off-chain services
    emit!(OrderCreatedEvent {
        owner: owner.key(),
        order_id: params.order_id as u64,
        baskt_id: baskt.key(),
        notional_value: params.notional_value,
        collateral: params.collateral,
        is_long: params.is_long,
        action: params.action,
        target_position: params.target_position,
        limit_price: params.limit_price,
        max_slippage_bps: params.max_slippage_bps,
        order_type: params.order_type,
        leverage_bps: params.leverage_bps,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
