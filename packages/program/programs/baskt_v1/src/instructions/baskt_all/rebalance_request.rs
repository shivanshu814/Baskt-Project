use crate::error::PerpetualsError;
use crate::events::RebalanceRequestEvent;
use crate::state::baskt::{Baskt, BasktStatus};
use crate::state::protocol::Protocol;
use crate::utils::transfer_sol;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RebalanceRequest<'info> {
    #[account(
        constraint = baskt.creator == creator.key() @ PerpetualsError::Unauthorized
    )]
    pub baskt: Account<'info, Baskt>,

    /// @dev Only the baskt creator can request a rebalance
    #[account(mut)]
    pub creator: Signer<'info>,

    /// Protocol account to get fee configuration
    #[account(seeds = [crate::constants::PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,

    /// Treasury account to receive the fee
    /// CHECK: Validated via protocol constraint
    #[account(
        mut,
        constraint = treasury.key() == protocol.treasury @ PerpetualsError::Unauthorized
    )]
    pub treasury: UncheckedAccount<'info>,

    /// System program for SOL transfers
    pub system_program: Program<'info, System>,
}

pub fn rebalance_request(ctx: Context<RebalanceRequest>) -> Result<()> {

    // Verify baskt is active
    require!(
        ctx.accounts.baskt.is_trading() && ctx.accounts.baskt.status == BasktStatus::Active,
        PerpetualsError::BasktNotActive
    );

    let fee_lamports = ctx.accounts.protocol.config.rebalance_request_fee_lamports;
    
    // Transfer fee to treasury using helper method
    if fee_lamports > 0 {
        transfer_sol(
            &ctx.accounts.creator.to_account_info(),
            &ctx.accounts.treasury.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            fee_lamports,
        )?;
    }
    
    let current_timestamp = Clock::get()?.unix_timestamp;

    // Emit the rebalance request event
    emit!(RebalanceRequestEvent {
        rebalance_request_fee: fee_lamports,
        baskt_id: ctx.accounts.baskt.key(),
        creator: ctx.accounts.creator.key(),
        timestamp: current_timestamp,
    });

    Ok(())
}
