use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;

use crate::constants::{BASKT_SEED, PROTOCOL_SEED};
use crate::error::PerpetualsError;
use crate::events::*;
use crate::state::baskt::Baskt;
use crate::state::config::BasktConfig;
use crate::state::protocol::{Protocol, Role};
use crate::utils::{
    validate_baskt_config, validate_baskt_fee_bps, validate_baskt_liquidation_threshold_bps,
    validate_baskt_min_collateral_ratio_bps,
};

// Helper function to get baskt name seed
fn get_baskt_name_seed(baskt_name: &str) -> [u8; 32] {
    keccak::hash(baskt_name.as_bytes()).to_bytes()
}

// Helper function to check if authority can modify baskt config
fn can_modify_baskt_config(baskt: &Baskt, authority: Pubkey, protocol: &Protocol) -> bool {
    // ConfigManager can modify any baskt config
    if protocol.has_permission(authority, Role::ConfigManager) {
        return true;
    }
    // Creator can modify their own private baskt
    if !baskt.is_public && baskt.creator == authority {
        return true;
    }
    false
}

// ----------------------------------------------------------------------------
// Set Baskt Opening Fee Bps Instruction
// ----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct SetBasktOpeningFeeBps<'info> {
    /// Authority that can modify baskt config
    #[account(
        mut,
        constraint = can_modify_baskt_config(&baskt, authority.key(), &protocol) @ PerpetualsError::Unauthorized,
    )]
    pub authority: Signer<'info>,

    /// Baskt account to update
    #[account(
        mut,
        seeds = [BASKT_SEED, &get_baskt_name_seed(&baskt.baskt_name)[..]],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>,

    /// Protocol account for role checking
    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

// Generate baskt fee setter using the macro
crate::impl_baskt_bps_setter!(
    set_baskt_opening_fee_bps,
    SetBasktOpeningFeeBps<'info>,
    opening_fee_bps,
    validate_baskt_fee_bps,
    BasktOpeningFeeUpdatedEvent,
    old_opening_fee_bps,
    new_opening_fee_bps
);

// ----------------------------------------------------------------------------
// Set Baskt Closing Fee Bps Instruction
// ----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct SetBasktClosingFeeBps<'info> {
    /// Authority that can modify baskt config
    #[account(
        mut,
        constraint = can_modify_baskt_config(&baskt, authority.key(), &protocol) @ PerpetualsError::Unauthorized,
    )]
    pub authority: Signer<'info>,

    /// Baskt account to update
    #[account(
        mut,
        seeds = [BASKT_SEED, &get_baskt_name_seed(&baskt.baskt_name)[..]],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>,

    /// Protocol account for role checking
    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

// Generate baskt fee setter using the macro
crate::impl_baskt_bps_setter!(
    set_baskt_closing_fee_bps,
    SetBasktClosingFeeBps<'info>,
    closing_fee_bps,
    validate_baskt_fee_bps,
    BasktClosingFeeUpdatedEvent,
    old_closing_fee_bps,
    new_closing_fee_bps
);

// ----------------------------------------------------------------------------
// Set Baskt Liquidation Fee Bps Instruction
// ----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct SetBasktLiquidationFeeBps<'info> {
    /// Authority that can modify baskt config
    #[account(
        mut,
        constraint = can_modify_baskt_config(&baskt, authority.key(), &protocol) @ PerpetualsError::Unauthorized,
    )]
    pub authority: Signer<'info>,

    /// Baskt account to update
    #[account(
        mut,
        seeds = [BASKT_SEED, &get_baskt_name_seed(&baskt.baskt_name)[..]],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>,

    /// Protocol account for role checking
    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

// Generate baskt fee setter using the macro
crate::impl_baskt_bps_setter!(
    set_baskt_liquidation_fee_bps,
    SetBasktLiquidationFeeBps<'info>,
    liquidation_fee_bps,
    validate_baskt_fee_bps,
    BasktLiquidationFeeUpdatedEvent,
    old_liquidation_fee_bps,
    new_liquidation_fee_bps
);

// ----------------------------------------------------------------------------
// Set Baskt Min Collateral Ratio Bps Instruction
// ----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct SetBasktMinCollateralRatioBps<'info> {
    /// Authority that can modify baskt config
    #[account(
        mut,
        constraint = can_modify_baskt_config(&baskt, authority.key(), &protocol) @ PerpetualsError::Unauthorized,
    )]
    pub authority: Signer<'info>,

    /// Baskt account to update
    #[account(
        mut,
        seeds = [BASKT_SEED, &get_baskt_name_seed(&baskt.baskt_name)[..]],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>,

    /// Protocol account for role checking
    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

// Wrapper function for min collateral ratio validation with cross-validation
fn validate_baskt_min_collateral_ratio_with_context(
    ctx: &Context<SetBasktMinCollateralRatioBps>,
    new_value: Option<u64>,
) -> Result<()> {
    validate_baskt_min_collateral_ratio_bps(
        new_value,
        ctx.accounts.baskt.config.liquidation_threshold_bps,
    )
}

pub fn set_baskt_min_collateral_ratio_bps(
    ctx: Context<SetBasktMinCollateralRatioBps>,
    new_min_collateral_ratio_bps: Option<u64>,
) -> Result<()> {
    // Validate with cross-validation against existing liquidation threshold
    validate_baskt_min_collateral_ratio_with_context(&ctx, new_min_collateral_ratio_bps)?;

    let baskt = &mut ctx.accounts.baskt;
    let old_min_collateral_ratio_bps = baskt.config.min_collateral_ratio_bps;

    // Early exit if nothing changed
    if old_min_collateral_ratio_bps == new_min_collateral_ratio_bps {
        return Ok(());
    }

    baskt.config.min_collateral_ratio_bps = new_min_collateral_ratio_bps;

    let clock = Clock::get()?;
    emit!(BasktMinCollateralRatioUpdatedEvent {
        baskt: baskt.key(),
        old_min_collateral_ratio_bps,
        new_min_collateral_ratio_bps,
        updated_by: ctx.accounts.authority.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

// ----------------------------------------------------------------------------
// Set Baskt Liquidation Threshold Bps Instruction
// ----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct SetBasktLiquidationThresholdBps<'info> {
    /// Authority that can modify baskt config
    #[account(
        mut,
        constraint = can_modify_baskt_config(&baskt, authority.key(), &protocol) @ PerpetualsError::Unauthorized,
    )]
    pub authority: Signer<'info>,

    /// Baskt account to update
    #[account(
        mut,
        seeds = [BASKT_SEED, &get_baskt_name_seed(&baskt.baskt_name)[..]],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>,

    /// Protocol account for role checking
    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

// Wrapper function for liquidation threshold validation with cross-validation
fn validate_baskt_liquidation_threshold_with_context(
    ctx: &Context<SetBasktLiquidationThresholdBps>,
    new_value: Option<u64>,
) -> Result<()> {
    validate_baskt_liquidation_threshold_bps(
        new_value,
        ctx.accounts.baskt.config.min_collateral_ratio_bps,
    )
}

pub fn set_baskt_liquidation_threshold_bps(
    ctx: Context<SetBasktLiquidationThresholdBps>,
    new_liquidation_threshold_bps: Option<u64>,
) -> Result<()> {
    // Validate with cross-validation against existing min collateral ratio
    validate_baskt_liquidation_threshold_with_context(&ctx, new_liquidation_threshold_bps)?;

    let baskt = &mut ctx.accounts.baskt;
    let old_liquidation_threshold_bps = baskt.config.liquidation_threshold_bps;

    // Early exit if nothing changed
    if old_liquidation_threshold_bps == new_liquidation_threshold_bps {
        return Ok(());
    }

    baskt.config.liquidation_threshold_bps = new_liquidation_threshold_bps;

    let clock = Clock::get()?;
    emit!(BasktLiquidationThresholdUpdatedEvent {
        baskt: baskt.key(),
        old_liquidation_threshold_bps,
        new_liquidation_threshold_bps,
        updated_by: ctx.accounts.authority.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

// ----------------------------------------------------------------------------
// Update Baskt Config - Bulk Update Instruction
// ----------------------------------------------------------------------------

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateBasktConfigParams {
    pub opening_fee_bps: Option<u64>,
    pub closing_fee_bps: Option<u64>,
    pub liquidation_fee_bps: Option<u64>,
    pub min_collateral_ratio_bps: Option<u64>,
    pub liquidation_threshold_bps: Option<u64>,
}

#[derive(Accounts)]
pub struct UpdateBasktConfig<'info> {
    /// Authority that can modify baskt config
    #[account(
        mut,
        constraint = can_modify_baskt_config(&baskt, authority.key(), &protocol) @ PerpetualsError::Unauthorized,
    )]
    pub authority: Signer<'info>,

    /// Baskt account to update
    #[account(
        mut,
        seeds = [BASKT_SEED, &get_baskt_name_seed(&baskt.baskt_name)[..]],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>,

    /// Protocol account for role checking
    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}

pub fn update_baskt_config(
    ctx: Context<UpdateBasktConfig>,
    params: UpdateBasktConfigParams,
) -> Result<()> {
    // Declare clock once at the beginning
    let clock = Clock::get()?;

    let baskt = &mut ctx.accounts.baskt;
    let old_config = baskt.config;

    // Create new config with updated values
    let new_config = BasktConfig {
        opening_fee_bps: params.opening_fee_bps,
        closing_fee_bps: params.closing_fee_bps,
        liquidation_fee_bps: params.liquidation_fee_bps,
        min_collateral_ratio_bps: params.min_collateral_ratio_bps,
        liquidation_threshold_bps: params.liquidation_threshold_bps,
    };

    // Validate the new config
    validate_baskt_config(&new_config)?;

    // Check if anything changed
    if old_config == new_config {
        return Ok(()); // No changes
    }

    // Update config
    baskt.config = new_config;

    // Emit event using the clock declared above
    emit!(BasktConfigUpdatedEvent {
        baskt: baskt.key(),
        old_config,
        new_config,
        updated_by: ctx.accounts.authority.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
