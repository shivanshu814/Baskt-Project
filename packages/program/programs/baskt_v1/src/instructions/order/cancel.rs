use crate::constants::{
    AUTHORITY_SEED, ORDER_SEED, PROTOCOL_SEED,
    USER_ESCROW_SEED,
};
use crate::error::PerpetualsError;
use crate::events::*;
use crate::state::{
    order::{Order, OrderAction, OrderStatus},
    protocol::Protocol,
};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
//----------------------------------------------------------------------------
// INSTRUCTION HANDLERS: ORDER
//----------------------------------------------------------------------------

/**
    1. Cancel an order when non owner 
    2. Rent should go to the user 
    3. Collateral and Escrow Account should belong to the user 
*/

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [ORDER_SEED, owner.key().as_ref(), &order.order_id.to_le_bytes()],
        bump = order.bump,
        constraint = order.owner == owner.key() @ PerpetualsError::Unauthorized,
        constraint = order.status as u8 == OrderStatus::Pending as u8 @ PerpetualsError::OrderAlreadyProcessed,
        close = owner // Close the order account and return rent to owner
    )]
    pub order: Account<'info, Order>,

    #[account(
        mut,
        constraint = owner_collateral_account.owner == owner.key() @ PerpetualsError::UnauthorizedTokenOwner,
        constraint = owner_collateral_account.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = owner_collateral_account.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority,
        constraint = owner_collateral_account.mint == protocol.collateral_mint @ PerpetualsError::InvalidMint
    )]
    pub owner_collateral_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [USER_ESCROW_SEED, owner.key().as_ref()],
        bump,
        constraint = owner_collateral_escrow_account.owner == program_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = owner_collateral_escrow_account.mint == protocol.collateral_mint @ PerpetualsError::InvalidMint,
        constraint = owner_collateral_escrow_account.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = owner_collateral_escrow_account.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub owner_collateral_escrow_account: Account<'info, TokenAccount>,

    ///CHECK: PDA used for token authority. Needed to sign the transfer from escrow.
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

    pub token_program: Program<'info, Token>,
}

pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
    let order = &ctx.accounts.order; // Borrow immutably as state changes are handled by close = owner
    let clock = Clock::get()?;

    // Only open orders have collateral to return from escrow
    if order.action == OrderAction::Open {
        let open_params = order.get_open_params()?;
        // Use signer seeds with canonical bump derived by Anchor
        let signer_seeds = [AUTHORITY_SEED, &[ctx.bumps.program_authority]];
        let signer = &[&signer_seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx
                        .accounts
                        .owner_collateral_escrow_account
                        .to_account_info(),
                    to: ctx.accounts.owner_collateral_account.to_account_info(),
                    authority: ctx.accounts.program_authority.to_account_info(),
                },
                signer,
            ),
            open_params.collateral,
        )?;
    }

    emit!(OrderCancelledEvent {
        owner: order.owner,
        order_id: order.order_id as u64,
        baskt_id: order.baskt_id,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
