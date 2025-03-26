use crate::error::PerpetualsError;
use crate::state::protocol::{Protocol, Role};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Protocol::INIT_SPACE,
        seeds = [b"protocol"],
        bump
    )]
    pub protocol: Account<'info, Protocol>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_protocol(ctx: Context<InitializeProtocol>) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol;
    let payer = &ctx.accounts.payer;

    protocol.initialize(payer.key())?;

    Ok(())
}

#[derive(Accounts)]
pub struct AddRole<'info> {
    #[account(mut, constraint = protocol.is_owner(&owner.key()) @ PerpetualsError::UnauthorizedSigner)]
    pub owner: Signer<'info>,

    /// Account to assign the role to
    /// CHECK: This is just a public key that will be assigned a role
    pub account: UncheckedAccount<'info>,

    #[account(mut)]
    pub protocol: Account<'info, Protocol>,
}

pub fn add_role(ctx: Context<AddRole>, role_type: u8) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol;
    let account = ctx.accounts.account.key();

    // Convert RoleType to Role
    let role = match role_type {
        0 => Role::Owner,
        1 => Role::AssetManager,
        2 => Role::OracleManager,
        _ => return Err(PerpetualsError::InvalidRoleType.into()),
    };

    // Add the role to the account
    protocol.add_role(account, role)?;

    Ok(())
}

#[derive(Accounts)]
pub struct RemoveRole<'info> {
    #[account(mut, constraint = protocol.is_owner(&owner.key()) @ PerpetualsError::UnauthorizedSigner)]
    pub owner: Signer<'info>,

    /// Account to remove the role from
    /// CHECK: This is just a public key that will have a role removed
    pub account: UncheckedAccount<'info>,

    #[account(mut)]
    pub protocol: Account<'info, Protocol>,
}

pub fn remove_role(ctx: Context<RemoveRole>, role_type: u8) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol;
    let account = ctx.accounts.account.key();

    // Convert RoleType to Role
    let role = match role_type {
        0 => Role::Owner,
        1 => Role::AssetManager,
        2 => Role::OracleManager,
        _ => return Err(PerpetualsError::InvalidRoleType.into()),
    };

    // Remove the role from the account
    protocol.remove_role(&account, role)?;

    Ok(())
}
