use {
    crate::error::PerpetualsError,
    crate::events::*,
    crate::state::{
        position::{Position, PositionStatus, ProgramAuthority},
        protocol::Protocol,
        registry::ProtocolRegistry,
    },
    anchor_lang::prelude::*,
    anchor_spl::token::{self, Token, TokenAccount, Transfer},
};

/// Parameters for adding collateral to a position
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AddCollateralParams {
    pub additional_collateral: u64,
}

/// AddCollateral using ProtocolRegistry
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
        constraint = owner_token.mint == registry.escrow_mint @ PerpetualsError::InvalidMint,
        constraint = owner_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = owner_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub owner_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"escrow", position.key().as_ref()],
        bump,
        constraint = escrow_token.mint == registry.escrow_mint @ PerpetualsError::InvalidMint,
        constraint = escrow_token.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = escrow_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = escrow_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    /// Protocol registry containing common addresses
    #[account(
        seeds = [ProtocolRegistry::SEED],
        bump = registry.bump,
    )]
    pub registry: Account<'info, ProtocolRegistry>,

    /// PDA used for token authority over escrow
    #[account(
        seeds = [b"authority"],
        bump,
        constraint = program_authority.key() == registry.program_authority @ PerpetualsError::InvalidProgramAuthority
    )]
    pub program_authority: Account<'info, ProgramAuthority>,

    /// Protocol account - required for validating the feature flag
    #[account(
        constraint = protocol.key() == registry.protocol @ PerpetualsError::Unauthorized,
        constraint = protocol.feature_flags.allow_add_collateral @ PerpetualsError::PositionOperationsDisabled
    )]
    pub protocol: Account<'info, Protocol>,

    pub token_program: Program<'info, Token>,
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