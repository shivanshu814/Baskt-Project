use {
    crate::error::PerpetualsError,
    crate::events::*,
    crate::state::{
        baskt::BasktV1,
        funding_index::FundingIndex,
        order::{Order, OrderAction, OrderStatus},
        position::{Position, ProgramAuthority},
        protocol::{Protocol, Role},
        registry::ProtocolRegistry,
    },
    anchor_lang::prelude::*,
    anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer},
};

/// Parameters for opening a position
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OpenPositionParams {
    pub position_id: u64,
    pub entry_price: u64,
}

/// OpenPosition using ProtocolRegistry
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
    pub position: Box<Account<'info, Position>>,

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
    pub baskt: Box<Account<'info, BasktV1>>,

    /// Protocol registry containing common addresses
    #[account(
        seeds = [ProtocolRegistry::SEED],
        bump = registry.bump,
    )]
    pub registry: Account<'info, ProtocolRegistry>,

    /// Protocol account for checking permissions
    /// @dev Requires Matcher role to open positions
    #[account(
        constraint = protocol.key() == registry.protocol @ PerpetualsError::Unauthorized,
        constraint = protocol.feature_flags.allow_open_position && protocol.feature_flags.allow_trading @ PerpetualsError::PositionOperationsDisabled,
        constraint = protocol.has_permission(matcher.key(), Role::Matcher) @ PerpetualsError::Unauthorized,
        seeds = [b"protocol"],
        bump
    )]
    pub protocol: Box<Account<'info, Protocol>>,

    //TODO: sidduHERE Does this mean we have cross margined account?
    #[account(
        mut,
        seeds = [b"user_escrow", order.owner.as_ref()],
        bump,
        constraint = order_escrow.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = order_escrow.mint == registry.escrow_mint @ PerpetualsError::InvalidMint
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
        seeds = [b"authority"],
        bump,
        constraint = program_authority.key() == registry.program_authority @ PerpetualsError::InvalidProgramAuthority
    )]
    pub program_authority: Account<'info, ProgramAuthority>,

    /// Escrow mint (USDC) - validated via registry
    #[account(
        constraint = escrow_mint.key() == registry.escrow_mint @ PerpetualsError::InvalidMint
    )]
    pub escrow_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn open_position(ctx: Context<OpenPosition>, params: OpenPositionParams) -> Result<()> {
    let order = &ctx.accounts.order; // Order is closed, access immutably
    let position = &mut ctx.accounts.position;
    let funding_index = &ctx.accounts.funding_index;
    let bump = ctx.bumps.position;
    let clock = Clock::get()?;

    // Validate oracle price is fresh and valid
    ctx.accounts
        .baskt
        .oracle
        .validate_execution_price(params.entry_price, clock.unix_timestamp)?;

    position.initialize(
        order.owner,
        params.position_id,
        order.baskt_id,
        order.size,
        order.collateral,
        order.is_long,
        params.entry_price,
        funding_index.cumulative_index,
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

    // Emit event
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
