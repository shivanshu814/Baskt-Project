use crate::constants::{BPS_DIVISOR, ESCROW_MINT, MIN_COLLATERAL_RATIO_BPS};
use crate::error::PerpetualsError;
use crate::events::*;
use crate::state::{
    baskt::BasktV1,
    order::{Order, OrderAction, OrderStatus},
    protocol::Protocol,
};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
//----------------------------------------------------------------------------
// INSTRUCTION HANDLERS: ORDER
//----------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(
    order_id: u64,
    size: u64,
    collateral: u64,
    is_long: bool,
    action: OrderAction,
    target_position: Option<Pubkey>
)]
pub struct CreateOrder<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + Order::INIT_SPACE,
        seeds = [b"order", owner.key().as_ref(), &order_id.to_le_bytes()],
        bump
    )]
    pub order: Account<'info, Order>,

    /// Baskt account
    #[account(
        constraint = baskt.is_active @ PerpetualsError::BasktInactive
    )]
    pub baskt: Account<'info, BasktV1>,

    #[account(
        mut,
        constraint = owner_token.owner == owner.key() @ PerpetualsError::UnauthorizedTokenOwner,
        constraint = owner_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = owner_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority,
        constraint = owner_token.mint == escrow_mint.key() @ PerpetualsError::InvalidMint
    )]
    pub owner_token: Account<'info, TokenAccount>,

    #[account(
        constraint = escrow_mint.key() == ESCROW_MINT @ PerpetualsError::InvalidMint
    )]
    pub escrow_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = owner,
        seeds = [b"user_escrow", owner.key().as_ref()],
        bump,
        token::mint = escrow_mint,
        token::authority = program_authority,
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    ///CHECK: PDA used for token authority over escrow for future operations
    #[account(
        seeds = [b"authority"],
        bump,
    )]
    pub program_authority: AccountInfo<'info>,

    /// Protocol account to verify feature flags
    #[account(
        seeds = [b"protocol"],
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
    order_id: u64,
    size: u64,
    collateral: u64,
    is_long: bool,
    action: OrderAction,
    target_position: Option<Pubkey>,
) -> Result<()> {
    // Validate inputs
    require!(size > 0, PerpetualsError::ZeroSizedPosition);

    if action == OrderAction::Open {
        require!(collateral > 0, PerpetualsError::InsufficientCollateral);

        // Check minimum collateral ratio using existing Constants
        let min_collateral = (size as u128)
            .checked_mul(MIN_COLLATERAL_RATIO_BPS as u128)
            .ok_or(PerpetualsError::MathOverflow)?
            .checked_div(BPS_DIVISOR as u128)
            .ok_or(PerpetualsError::MathOverflow)? as u64;

        require!(
            collateral >= min_collateral,
            PerpetualsError::InsufficientCollateral
        );
    } else {
        // Close orders require a target position
        require!(
            target_position.is_some(),
            PerpetualsError::InvalidTargetPosition
        );
    }

    let order = &mut ctx.accounts.order;
    let baskt = &ctx.accounts.baskt;
    let owner = &ctx.accounts.owner;
    let bump = ctx.bumps.order; // Use direct bump access
    let clock = Clock::get()?;

    // Initialize order using existing Order::initialize method
    order.initialize(
        owner.key(),
        order_id,
        baskt.key(),
        size,
        collateral,
        is_long,
        action,
        clock.unix_timestamp,
        target_position,
        bump,
    )?;

    // Transfer collateral to escrow if this is an open order
    if action == OrderAction::Open {
        // Transfer tokens from owner to escrow
        // Assuming owner is the authority for their token account
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.owner_token.to_account_info(),
                    to: ctx.accounts.escrow_token.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(), // Owner signs
                },
            ),
            collateral,
        )?;
    }

    // Emit event for off-chain services using existing Event struct
    emit!(OrderCreatedEvent {
        owner: owner.key(),
        order_id,
        baskt_id: baskt.key(),
        size,
        collateral,
        is_long,
        action,
        target_position,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"order", owner.key().as_ref(), &order.order_id.to_le_bytes()],
        bump = order.bump,
        // has_one = owner, // Simpler constraint for owner check
        constraint = order.owner == owner.key() @ PerpetualsError::Unauthorized,
        constraint = order.status as u8 == OrderStatus::Pending as u8 @ PerpetualsError::OrderAlreadyProcessed,
        close = owner // Close the order account and return rent to owner
    )]
    pub order: Account<'info, Order>,

    #[account(
        mut,
        constraint = owner_token.owner == owner.key() @ PerpetualsError::UnauthorizedTokenOwner,
        constraint = owner_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = owner_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority,
        constraint = owner_token.mint == ESCROW_MINT @ PerpetualsError::InvalidMint
    )]
    pub owner_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"user_escrow", owner.key().as_ref()],
        bump,
        constraint = escrow_token.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = escrow_token.mint == ESCROW_MINT @ PerpetualsError::InvalidMint,
        constraint = escrow_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = escrow_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    ///CHECK: PDA used for token authority. Needed to sign the transfer from escrow.
    #[account(
        seeds = [b"authority"],
        bump,
    )]
    pub program_authority: AccountInfo<'info>,

    /// Protocol account to verify feature flags
    #[account(
        seeds = [b"protocol"],
        bump,
        constraint = protocol.feature_flags.allow_trading @ PerpetualsError::TradingDisabled
    )]
    pub protocol: Account<'info, Protocol>,

    pub token_program: Program<'info, Token>,
    // Removed program_authority_bump parameter since it will be derived
}

pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
    let order = &ctx.accounts.order; // Borrow immutably as state changes are handled by close = owner
    let clock = Clock::get()?;

    // Only open orders have collateral to return from escrow
    if order.action == OrderAction::Open && order.collateral > 0 {
        // Use signer seeds with canonical bump derived by Anchor
        let signer_seeds = [b"authority" as &[u8], &[ctx.bumps.program_authority]];
        let signer = &[&signer_seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token.to_account_info(),
                    to: ctx.accounts.owner_token.to_account_info(),
                    authority: ctx.accounts.program_authority.to_account_info(),
                },
                signer,
            ),
            order.collateral,
        )?;
    }

    // Order account is closed automatically by `close = owner` constraint.
    // No need to call order.cancel() manually if closing the account.

    // Emit event for off-chain services
    emit!(OrderCancelledEvent {
        owner: order.owner,
        order_id: order.order_id,
        baskt_id: order.baskt_id,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
