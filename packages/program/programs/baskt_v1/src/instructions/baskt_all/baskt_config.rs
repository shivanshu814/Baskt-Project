use anchor_lang::prelude::*;

use crate::constants::{BASKT_SEED, PROTOCOL_SEED};
use crate::error::PerpetualsError;
use crate::events::*;
use crate::state::baskt::{Baskt, BasktConfig};
use crate::state::protocol::{Protocol, Role};
use crate::utils::{
     validate_baskt_config, validate_baskt_fee_bps,
    validate_baskt_liquidation_threshold_bps, validate_baskt_min_collateral_ratio_bps,
};

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
        seeds = [BASKT_SEED, &baskt.uid.to_le_bytes()],
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
        seeds = [BASKT_SEED, &baskt.uid.to_le_bytes()],
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
        seeds = [BASKT_SEED, &baskt.uid.to_le_bytes()],
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
        seeds = [BASKT_SEED, &baskt.uid.to_le_bytes()],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>,

    /// Protocol account for role checking
    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}


pub fn set_baskt_min_collateral_ratio_bps(
    ctx: Context<SetBasktMinCollateralRatioBps>,
    new_min_collateral_ratio_bps: Option<u64>,
) -> Result<()> {
    // Validate with cross-validation against existing liquidation threshold
    validate_baskt_min_collateral_ratio_bps(
        new_min_collateral_ratio_bps,
        ctx.accounts.baskt.config.get_liquidation_threshold_bps(),
    )?;
    let baskt = &mut ctx.accounts.baskt;
    let old_min_collateral_ratio_bps = baskt.config.get_min_collateral_ratio_bps();

    // Early exit if nothing changed
    if old_min_collateral_ratio_bps == new_min_collateral_ratio_bps {
        return Ok(());
    }

    baskt.config.set_min_collateral_ratio_bps(new_min_collateral_ratio_bps);

    let clock = Clock::get()?;
    emit!(BasktMinCollateralRatioUpdatedEvent {
        baskt: baskt.key(),
        old_min_collateral_ratio_bps: old_min_collateral_ratio_bps,
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
        seeds = [BASKT_SEED, &baskt.uid.to_le_bytes()],
        bump = baskt.bump
    )]
    pub baskt: Account<'info, Baskt>,

    /// Protocol account for role checking
    #[account(seeds = [PROTOCOL_SEED], bump)]
    pub protocol: Account<'info, Protocol>,
}


pub fn set_baskt_liquidation_threshold_bps(
    ctx: Context<SetBasktLiquidationThresholdBps>,
    new_liquidation_threshold_bps: Option<u64>,
) -> Result<()> {
    // Validate with cross-validation against existing min collateral ratio
    validate_baskt_liquidation_threshold_bps(
        new_liquidation_threshold_bps,
        ctx.accounts.baskt.config.get_min_collateral_ratio_bps(),
    )?;
    let baskt = &mut ctx.accounts.baskt;
    let old_liquidation_threshold_bps = baskt.config.get_liquidation_threshold_bps();

    // Early exit if nothing changed
    if old_liquidation_threshold_bps == new_liquidation_threshold_bps {
        return Ok(());
    }

    baskt.config.set_liquidation_threshold_bps(new_liquidation_threshold_bps);

    let clock = Clock::get()?;
    emit!(BasktLiquidationThresholdUpdatedEvent {
        baskt: baskt.key(),
        old_liquidation_threshold_bps: old_liquidation_threshold_bps,
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
        seeds = [BASKT_SEED, &baskt.uid.to_le_bytes()],
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
    let mut new_config = BasktConfig::default();
    new_config.set_opening_fee_bps(params.opening_fee_bps);
    new_config.set_closing_fee_bps(params.closing_fee_bps);
    new_config.set_liquidation_fee_bps(params.liquidation_fee_bps);
    new_config.set_min_collateral_ratio_bps(params.min_collateral_ratio_bps);
    new_config.set_liquidation_threshold_bps(params.liquidation_threshold_bps);

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



/// Macro to generate boiler-plate setter instructions for baskt-level configuration fields
/// that are expressed in basis points (Option<u64>) and share the exact same flow:
///  1. Validate the new value using the provided validation function
///  2. Early-return if the value is unchanged
///  3. Write the new value to baskt.config.<field>
///  4. Emit the corresponding event
///
/// This macro handles baskt-specific optional configuration fields and their validation.
#[macro_export]
macro_rules! impl_baskt_bps_setter {
    (
        // Function name, e.g. `set_baskt_opening_fee_bps`
        $fn_name:ident,
        // The Accounts context type, e.g. `SetBasktOpeningFeeBps<'info>`
        $accounts:ty,
        // Name of the `BasktConfig` field to update, e.g. `opening_fee_bps`
        $field:ident,
        // Validation function to call, e.g. `validate_baskt_fee_bps`
        $validation_fn:path,
        // Event struct to emit, e.g. `BasktOpeningFeeUpdatedEvent`
        $event:ident,
        // Identifier for the *old* field value captured for the event
        $old_ident:ident,
        // Identifier for the *new* field value passed in by the caller
        $new_ident:ident
    ) => {
        pub fn $fn_name<'info>(
            ctx: anchor_lang::prelude::Context<$accounts>,
            $new_ident: Option<u64>,
        ) -> anchor_lang::prelude::Result<()> {
            // --- Validation -------------------------------------------------
            $validation_fn($new_ident)?;

            // --- State update ----------------------------------------------
            let baskt = &mut ctx.accounts.baskt;
            let $old_ident = match stringify!($field) {
                "opening_fee_bps" => baskt.config.get_opening_fee_bps(),
                "closing_fee_bps" => baskt.config.get_closing_fee_bps(),
                "liquidation_fee_bps" => baskt.config.get_liquidation_fee_bps(),
                _ => panic!("Unknown field"),
            };

            // Early exit if nothing changed – saves compute
            if $old_ident == $new_ident {
                return Ok(());
            }

            match stringify!($field) {
                "opening_fee_bps" => baskt.config.set_opening_fee_bps($new_ident),
                "closing_fee_bps" => baskt.config.set_closing_fee_bps($new_ident),
                "liquidation_fee_bps" => baskt.config.set_liquidation_fee_bps($new_ident),
                _ => panic!("Unknown field"),
            };

            // --- Event ------------------------------------------------------
            let clock = anchor_lang::prelude::Clock::get()?;
            anchor_lang::prelude::emit!($event {
                baskt: baskt.key(),
                $old_ident,
                $new_ident,
                updated_by: ctx.accounts.authority.key(),
                timestamp: clock.unix_timestamp,
            });

            Ok(())
        }
    };
}
