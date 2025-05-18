use crate::error::PerpetualsError;
use crate::state::protocol::{FeatureFlags, Protocol, Role};
use anchor_lang::prelude::*;


#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = Protocol::DISCRIMINATOR.len() + Protocol::INIT_SPACE,
        seeds = [b"protocol"],
        bump
    )]
    pub protocol: Account<'info, Protocol>,

    pub system_program: Program<'info, System>
}

pub fn initialize_protocol(ctx: Context<InitializeProtocol>) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol;
    let authority = ctx.accounts.authority.key();

    protocol.initialize(authority)?;

    Ok(())
}

#[derive(Accounts)]
pub struct AddRole<'info> {
    /// @dev Requires Owner role to assign roles to other accounts
    #[account(mut, constraint = protocol.has_permission(owner.key(), Role::Owner) @ PerpetualsError::Unauthorized)]
    pub owner: Signer<'info>,

    /// Account to assign the role to
    /// CHECK: This is just a public key that will be assigned a role
    pub account: UncheckedAccount<'info>,

    #[account(seeds = [b"protocol"], bump, mut)]
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
        3 => Role::Rebalancer,
        4 => Role::Matcher,
        5 => Role::Liquidator,
        6 => Role::FundingManager,
        7 => Role::Treasury,
        _ => return Err(PerpetualsError::InvalidRoleType.into()),
    };
    // Add the role to the account
    protocol.add_role(account, role)?;

    Ok(())
}

#[derive(Accounts)]
pub struct RemoveRole<'info> {
    /// @dev Requires Owner role to remove roles from other accounts
    #[account(mut, constraint = protocol.has_permission(owner.key(), Role::Owner) @ PerpetualsError::Unauthorized)]
    pub owner: Signer<'info>,

    /// Account to remove the role from
    /// CHECK: This is just a public key that will have a role removed
    pub account: UncheckedAccount<'info>,

    #[account(seeds = [b"protocol"], bump, mut)]
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
        3 => Role::Rebalancer,
        4 => Role::Matcher,
        5 => Role::Liquidator,
        6 => Role::FundingManager,
        7 => Role::Treasury,
        _ => return Err(PerpetualsError::InvalidRoleType.into()),
    };

    // Remove the role from the account
    protocol.remove_role(account, role)?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(params: UpdateFeatureFlagsParams)]
pub struct UpdateFeatureFlags<'info> {
    /// @dev Requires Owner role to update feature flags
    #[account(mut, constraint = protocol.has_permission(owner.key(), Role::Owner) @ PerpetualsError::Unauthorized)]
    pub owner: Signer<'info>,

    #[account(seeds = [b"protocol"], bump, mut)]
    pub protocol: Account<'info, Protocol>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateFeatureFlagsParams {
    pub allow_add_liquidity: bool,
    pub allow_remove_liquidity: bool,
    pub allow_open_position: bool,
    pub allow_close_position: bool,
    pub allow_pnl_withdrawal: bool,
    pub allow_collateral_withdrawal: bool,
    pub allow_add_collateral: bool,
    pub allow_baskt_creation: bool,
    pub allow_baskt_update: bool,
    pub allow_trading: bool,
    pub allow_liquidations: bool,
}

pub fn update_feature_flags(
    ctx: Context<UpdateFeatureFlags>,
    params: UpdateFeatureFlagsParams,
) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol;

    // Create new feature flags with provided values
    let new_feature_flags = FeatureFlags {
        allow_add_liquidity: params.allow_add_liquidity,
        allow_remove_liquidity: params.allow_remove_liquidity,
        allow_open_position: params.allow_open_position,
        allow_close_position: params.allow_close_position,
        allow_pnl_withdrawal: params.allow_pnl_withdrawal,
        allow_collateral_withdrawal: params.allow_collateral_withdrawal,
        allow_add_collateral: params.allow_add_collateral,
        allow_baskt_creation: params.allow_baskt_creation,
        allow_baskt_update: params.allow_baskt_update,
        allow_trading: params.allow_trading,
        allow_liquidations: params.allow_liquidations,
    };

    // Update the feature flags
    protocol.update_feature_flags(new_feature_flags)?;

    Ok(())
}
