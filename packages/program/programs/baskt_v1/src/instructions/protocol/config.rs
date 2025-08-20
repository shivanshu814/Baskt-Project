use {
    crate::constants::{
        BPS_DIVISOR, MAX_FEE_BPS, MAX_GRACE_PERIOD,
        MAX_TREASURY_CUT_BPS, MIN_COLLATERAL_RATIO_BPS, MIN_GRACE_PERIOD,
        PROTOCOL_SEED,
        LIQUIDITY_POOL_SEED,
    },
    crate::error::PerpetualsError,
    crate::events::*,
    crate::state::protocol::{Protocol, Role},
    crate::state::liquidity::LiquidityPool,
    anchor_lang::prelude::*,
};

// -----------------------------------------------------------------------------
// Generic Accounts struct + macro-powered setters
// -----------------------------------------------------------------------------
#[derive(Accounts)]
pub struct ConfigMgr<'info> {
    /// Signer that must have the ConfigManager role
    #[account(
        mut,
        constraint = protocol.has_permission(authority.key(), Role::ConfigManager)
            @ PerpetualsError::UnauthorizedRole,
    )]
    pub authority: Signer<'info>,

    /// Protocol account containing configuration
    #[account(mut, seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

// Remove previous type alias lines and instead re-declare lightweight structs so that
// Anchor can derive per-instruction `Accounts` metadata expected by the `#[program]`
// macro. These structs are identical to `ConfigMgr` but keep their own identifiers.

#[derive(Accounts)]
pub struct SetOpeningFeeBps<'info> {
    #[account(
        mut,
        constraint = protocol.has_permission(authority.key(), Role::ConfigManager)
            @ PerpetualsError::UnauthorizedRole,
    )]
    pub authority: Signer<'info>,

    #[account(mut, seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

#[derive(Accounts)]
pub struct SetClosingFeeBps<'info> {
    #[account(
        mut,
        constraint = protocol.has_permission(authority.key(), Role::ConfigManager)
            @ PerpetualsError::UnauthorizedRole,
    )]
    pub authority: Signer<'info>,

    #[account(mut, seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

#[derive(Accounts)]
pub struct SetLiquidationFeeBps<'info> {
    #[account(
        mut,
        constraint = protocol.has_permission(authority.key(), Role::ConfigManager)
            @ PerpetualsError::UnauthorizedRole,
    )]
    pub authority: Signer<'info>,

    #[account(mut, seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

// Generate the three fee-setter bodies via the `crate::impl_bps_setter!` macro.
crate::impl_bps_setter!(
    set_opening_fee_bps,
    SetOpeningFeeBps<'info>,
    opening_fee_bps,
    MAX_FEE_BPS,
    old_opening_fee_bps,
    new_opening_fee_bps
);

crate::impl_bps_setter!(
    set_closing_fee_bps,
    SetClosingFeeBps<'info>,
    closing_fee_bps,
    MAX_FEE_BPS,
    old_closing_fee_bps,
    new_closing_fee_bps
);

crate::impl_bps_setter!(
    set_liquidation_fee_bps,
    SetLiquidationFeeBps<'info>,
    liquidation_fee_bps,
    MAX_FEE_BPS,
    old_liquidation_fee_bps,
    new_liquidation_fee_bps
);

// ----------------------------------------------------------------------------
// Set Min Collateral Ratio Bps Instruction
// ----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct SetMinCollateralRatioBps<'info> {
    /// Signer that must have the ConfigManager role
    #[account(
        mut,
        constraint = protocol.has_permission(authority.key(), Role::ConfigManager) @ PerpetualsError::UnauthorizedRole,
    )]
    pub authority: Signer<'info>,

    /// Protocol account containing configuration
    #[account(mut, seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

pub fn set_min_collateral_ratio_bps(
    ctx: Context<SetMinCollateralRatioBps>,
    new_min_collateral_ratio_bps: u64,
) -> Result<()> {
    // validation: cannot be lower than protocol minimum
    require!(
        new_min_collateral_ratio_bps >= MIN_COLLATERAL_RATIO_BPS
            && new_min_collateral_ratio_bps
                > ctx.accounts.protocol.config.liquidation_threshold_bps,
        PerpetualsError::InvalidCollateralRatio
    );

    let protocol = &mut ctx.accounts.protocol;
    let old_min_collateral_ratio_bps = protocol.config.min_collateral_ratio_bps;
    if old_min_collateral_ratio_bps == new_min_collateral_ratio_bps {
        return Ok(());
    }

    protocol.config.min_collateral_ratio_bps = new_min_collateral_ratio_bps;
    let clock = Clock::get()?;
    protocol.config.last_updated = clock.unix_timestamp;
    protocol.config.last_updated_by = ctx.accounts.authority.key();

    emit!(ProtocolStateUpdatedEvent {
        protocol: protocol.key(),
        updated_by: ctx.accounts.authority.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

// ----------------------------------------------------------------------------
// Set Liquidation Threshold Bps Instruction
// ----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct SetLiquidationThresholdBps<'info> {
    /// Signer that must have the ConfigManager role
    #[account(
        mut,
        constraint = protocol.has_permission(authority.key(), Role::ConfigManager) @ PerpetualsError::UnauthorizedRole,
    )]
    pub authority: Signer<'info>,

    /// Protocol account containing configuration
    #[account(mut, seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

pub fn set_liquidation_threshold_bps(
    ctx: Context<SetLiquidationThresholdBps>,
    new_liquidation_threshold_bps: u64,
) -> Result<()> {
    require!(
        new_liquidation_threshold_bps > 0
            && new_liquidation_threshold_bps <= BPS_DIVISOR
            && new_liquidation_threshold_bps
                < ctx.accounts.protocol.config.min_collateral_ratio_bps,
        PerpetualsError::InvalidCollateralRatio
    );

    let protocol = &mut ctx.accounts.protocol;
    let old_liquidation_threshold_bps = protocol.config.liquidation_threshold_bps;
    if old_liquidation_threshold_bps == new_liquidation_threshold_bps {
        return Ok(());
    }

    protocol.config.liquidation_threshold_bps = new_liquidation_threshold_bps;
    let clock = Clock::get()?;
    protocol.config.last_updated = clock.unix_timestamp;
    protocol.config.last_updated_by = ctx.accounts.authority.key();

    emit!(ProtocolStateUpdatedEvent {
        protocol: protocol.key(),
        updated_by: ctx.accounts.authority.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

// ----------------------------------------------------------------------------
// Update Treasury Instruction
// ----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct UpdateTreasury<'info> {
    /// Signer must be Owner or ConfigManager
    #[account(
        mut,
        constraint = protocol.has_permission(authority.key(), Role::ConfigManager) @ PerpetualsError::UnauthorizedRole
    )]
    pub authority: Signer<'info>,

    /// Protocol account
    #[account(mut, seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

pub fn update_treasury(ctx: Context<UpdateTreasury>, new_treasury: Pubkey) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol;
    let old_treasury = protocol.treasury;

    // If same, no-op
    if old_treasury == new_treasury {
        return Ok(());
    }

    protocol.treasury = new_treasury;
    let clock = Clock::get()?;

    emit!(ProtocolStateUpdatedEvent {
        protocol: protocol.key(),
        updated_by: ctx.accounts.authority.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}



// ----------------------------------------------------------------------------
// Set Min Liquidity Instruction
// ----------------------------------------------------------------------------

/// Sets the minimum liquidity amount that must remain in the pool
#[derive(Accounts)]
pub struct SetMinLiquidity<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump,
        constraint = protocol.has_permission(admin.key(), Role::ConfigManager) @ PerpetualsError::UnauthorizedRole
    )]
    pub protocol: Account<'info, Protocol>,
}

pub fn set_min_liquidity(ctx: Context<SetMinLiquidity>, new_min_liquidity: u64) -> Result<()> {

    require!(new_min_liquidity > 0, PerpetualsError::InvalidInput);

    let protocol = &mut ctx.accounts.protocol;
    
    let old_min_liquidity = protocol.config.min_liquidity;
    protocol.config.min_liquidity = new_min_liquidity;

    protocol.config.last_updated = Clock::get()?.unix_timestamp;
    protocol.config.last_updated_by = ctx.accounts.admin.key();

    // Emit event
    emit!(ProtocolStateUpdatedEvent {
        protocol: protocol.key(),
        updated_by: ctx.accounts.admin.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!(
        "Min liquidity updated from {} to {}",
        old_min_liquidity,
        new_min_liquidity
    );

    Ok(())
}

// ----------------------------------------------------------------------------
// Set Treasury Cut Bps Instruction
// ----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct SetTreasuryCutBps<'info> {
    /// Signer that must have the ConfigManager role
    #[account(
        mut,
        constraint = protocol.has_permission(authority.key(), Role::ConfigManager) @ PerpetualsError::UnauthorizedRole,
    )]
    pub authority: Signer<'info>,

    /// Protocol account containing configuration
    #[account(mut, seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

// ----------------------------------------------------------------------------
// Set Funding Cut Bps Instruction
// ----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct SetFundingCutBps<'info> {
    /// Signer that must have the ConfigManager role
    #[account(
        mut,
        constraint = protocol.has_permission(authority.key(), Role::ConfigManager) @ PerpetualsError::UnauthorizedRole,
    )]
    pub authority: Signer<'info>,

    /// Protocol account containing configuration
    #[account(mut, seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}



// ----------------------------------------------------------------------------
// Set Rebalance Request Fee Instruction
// ----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct SetRebalanceRequestFee<'info> {
    /// Signer that must have the ConfigManager role
    #[account(
        mut,
        constraint = protocol.has_permission(authority.key(), Role::ConfigManager) @ PerpetualsError::UnauthorizedRole,
    )]
    pub authority: Signer<'info>,

    /// Protocol account containing configuration
    #[account(mut, seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

pub fn set_rebalance_request_fee(
    ctx: Context<SetRebalanceRequestFee>,
    new_fee_lamports: u64,
) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol;
    let authority = &ctx.accounts.authority;
    let clock = Clock::get()?;

    let old_fee_lamports = protocol.config.rebalance_request_fee_lamports;
    protocol.config.rebalance_request_fee_lamports = new_fee_lamports;
    protocol.config.last_updated = clock.unix_timestamp;
    protocol.config.last_updated_by = authority.key();

    emit!(ProtocolStateUpdatedEvent {
        protocol: protocol.key(),
        updated_by: authority.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct SetBasktCreationFee<'info> {
    /// Signer that must have the ConfigManager or Owner role
    #[account(
        mut,
        constraint = protocol.has_permission(authority.key(), Role::ConfigManager)
            @ PerpetualsError::UnauthorizedRole,
    )]
    pub authority: Signer<'info>,

    /// Protocol account containing configuration
    #[account(mut, seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

pub fn set_baskt_creation_fee(
    ctx: Context<SetBasktCreationFee>,
    new_fee_lamports: u64,
) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol;
    let authority = &ctx.accounts.authority;
    let clock = Clock::get()?;

    let old_fee_lamports = protocol.config.baskt_creation_fee_lamports;
    protocol.config.baskt_creation_fee_lamports = new_fee_lamports;
    protocol.config.last_updated = clock.unix_timestamp;
    protocol.config.last_updated_by = authority.key();

    emit!(ProtocolStateUpdatedEvent {
        protocol: protocol.key(),
        updated_by: authority.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

crate::impl_bps_setter!(
    set_treasury_cut_bps,
    SetTreasuryCutBps<'info>,
    treasury_cut_bps,
    MAX_TREASURY_CUT_BPS,
    old_treasury_cut_bps,
    new_treasury_cut_bps
);

crate::impl_bps_setter!(
    set_funding_cut_bps,
    SetFundingCutBps<'info>,
    funding_cut_bps,
    BPS_DIVISOR,
    old_funding_cut_bps,
    new_funding_cut_bps
);


