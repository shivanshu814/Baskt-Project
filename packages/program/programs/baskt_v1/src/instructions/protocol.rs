use crate::error::PerpetualsError;
use crate::events::RegistryInitializedEvent;
use crate::state::position::ProgramAuthority;
use crate::state::protocol::{FeatureFlags, Protocol, Role};
use crate::state::registry::ProtocolRegistry;
use crate::state::liquidity::LiquidityPool;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

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

    /// Program authority PDA - created during protocol initialization
    #[account(
        init,
        payer = authority,
        space = ProgramAuthority::DISCRIMINATOR.len() + ProgramAuthority::INIT_SPACE,
        seeds = [b"authority"],
        bump
    )]
    pub program_authority: Account<'info, ProgramAuthority>,

    pub system_program: Program<'info, System>,
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
    #[account(mut, constraint = protocol.has_permission(owner.key(), Role::Owner) @ PerpetualsError::UnauthorizedRole)]
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
    #[account(mut, constraint = protocol.has_permission(owner.key(), Role::Owner) @ PerpetualsError::UnauthorizedRole)]
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
    #[account(mut, constraint = protocol.has_permission(owner.key(), Role::Owner) @ PerpetualsError::UnauthorizedRole)]
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

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    /// Protocol owner who can initialize the registry
    #[account(
        mut,
        constraint = protocol.has_permission(owner.key(), Role::Owner) @ PerpetualsError::UnauthorizedRole
    )]
    pub owner: Signer<'info>,

    /// Protocol account
    #[account(seeds = [b"protocol"], bump)]
    pub protocol: Account<'info, Protocol>,

    /// Registry PDA to initialize
    #[account(
        init,
        payer = owner,
        space = ProtocolRegistry::DISCRIMINATOR.len() + ProtocolRegistry::INIT_SPACE,
        seeds = [ProtocolRegistry::SEED],
        bump
    )]
    pub registry: Account<'info, ProtocolRegistry>,

    /// Treasury account that receives fees
    #[account(
        constraint = protocol.has_permission(treasury.key(), Role::Treasury) @ PerpetualsError::InvalidTreasuryAccount
    )]
    pub treasury: SystemAccount<'info>,

    /// Treasury token account for USDC
    #[account(
        constraint = treasury_token.owner == treasury.key() @ PerpetualsError::InvalidTreasuryAccount,
        constraint = treasury_token.mint == escrow_mint.key() @ PerpetualsError::InvalidMint,
        constraint = treasury_token.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = treasury_token.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority
    )]
    pub treasury_token: Account<'info, TokenAccount>,

    /// Liquidity pool account
    #[account(
        seeds = [b"liquidity_pool", protocol.key().as_ref()],
        bump = liquidity_pool.bump,
        constraint = liquidity_pool.token_vault == token_vault.key() @ PerpetualsError::InvalidTokenVault,
        constraint = liquidity_pool.lp_mint != Pubkey::default() @ PerpetualsError::InvalidLiquidityPool
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    /// Token vault for the liquidity pool
    #[account(
        constraint = token_vault.owner == pool_authority.key() @ PerpetualsError::InvalidProgramAuthority,
        constraint = token_vault.mint == escrow_mint.key() @ PerpetualsError::InvalidMint,
        constraint = token_vault.delegate.is_none() @ PerpetualsError::TokenHasDelegate,
        constraint = token_vault.close_authority.is_none() @ PerpetualsError::TokenHasCloseAuthority,
        seeds = [b"token_vault", liquidity_pool.key().as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenAccount>,

    /// Pool authority PDA
    #[account(
        seeds = [b"pool_authority", liquidity_pool.key().as_ref(), protocol.key().as_ref()],
        bump
    )]
    pub pool_authority: SystemAccount<'info>,

    /// Program authority PDA
    #[account(
        seeds = [b"authority"],
        bump
    )]
    pub program_authority: Account<'info, ProgramAuthority>,

    /// Escrow mint (USDC)
    #[account(
        constraint = escrow_mint.decimals == 6 @ PerpetualsError::InvalidMint,
    )]
    pub escrow_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_registry(ctx: Context<InitializeRegistry>) -> Result<()> {
    // Store registry key before mutable borrow
    let registry_key = ctx.accounts.registry.key();
    
    // Populate registry with validated account addresses
    let registry = &mut ctx.accounts.registry;
    registry.protocol = ctx.accounts.protocol.key();
    registry.treasury = ctx.accounts.treasury.key();
    registry.treasury_token = ctx.accounts.treasury_token.key();
    registry.liquidity_pool = ctx.accounts.liquidity_pool.key();
    registry.token_vault = ctx.accounts.token_vault.key();
    registry.pool_authority = ctx.accounts.pool_authority.key();
    registry.pool_authority_bump = ctx.bumps.pool_authority;
    registry.program_authority = ctx.accounts.program_authority.key();
    registry.program_authority_bump = ctx.bumps.program_authority;
    registry.escrow_mint = ctx.accounts.escrow_mint.key();
    registry.bump = ctx.bumps.registry;

    msg!("Registry initialized successfully");
    msg!("Protocol: {}", registry.protocol);
    msg!("Treasury: {}", registry.treasury);
    msg!("Liquidity Pool: {}", registry.liquidity_pool);
    msg!("Token Vault: {}", registry.token_vault);
    msg!("Escrow Mint: {}", registry.escrow_mint);
    
    // Emit event
    emit!(RegistryInitializedEvent {
        registry: registry_key,
        protocol: registry.protocol,
        treasury: registry.treasury,
        treasury_token: registry.treasury_token,
        liquidity_pool: registry.liquidity_pool,
        token_vault: registry.token_vault,
        pool_authority: registry.pool_authority,
        program_authority: registry.program_authority,
        escrow_mint: registry.escrow_mint,
        initializer: ctx.accounts.owner.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}
