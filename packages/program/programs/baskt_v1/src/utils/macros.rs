#![allow(unused_imports)]
pub use anchor_lang::prelude::*;

/// Macro to generate boiler-plate setter instructions for protocol‐level configuration fields
/// that are expressed in basis points (u64) and share the exact same flow:
///  1. Validate the new value using `validate_bps`
///  2. Early-return if the value is unchanged
///  3. Write the new value + metadata stamps
///  4. Emit the corresponding event
///
/// The macro keeps every validation rule intact while avoiding hundreds of
/// lines of near-identical code in `instructions/config.rs`.
#[macro_export]
macro_rules! impl_bps_setter {
    (
        // Function name, e.g. `set_opening_fee_bps`
        $fn_name:ident,
        // The Accounts context type, e.g. `SetOpeningFeeBps<'info>`
        $accounts:ty,
        // Name of the `ProtocolConfig` field to update, e.g. `opening_fee_bps`
        $field:ident,
        // Maximum allowed value passed to `validate_bps`
        $max:expr,
        // Event struct to emit, e.g. `OpeningFeeUpdatedEvent`
        $event:ident,
        // Identifier for the *old* field value captured for the event
        $old_ident:ident,
        // Identifier for the *new* field value passed in by the caller
        $new_ident:ident
    ) => {
        pub fn $fn_name<'info>(
            ctx: anchor_lang::prelude::Context<$accounts>,
            $new_ident: u64,
        ) -> anchor_lang::prelude::Result<()> {
            // --- Validation -------------------------------------------------
            $crate::utils::validate_bps($new_ident, $max)?;

            // --- State update ----------------------------------------------
            let protocol = &mut ctx.accounts.protocol;
            let $old_ident = protocol.config.$field;

            // Early exit if nothing changed – saves compute
            if $old_ident == $new_ident {
                return Ok(());
            }

            protocol.config.$field = $new_ident;

            // Metadata stamp
            let clock = anchor_lang::prelude::Clock::get()?;
            protocol.config.last_updated = clock.unix_timestamp;
            protocol.config.last_updated_by = ctx.accounts.authority.key();

            // --- Event ------------------------------------------------------
            anchor_lang::prelude::emit!($event {
                protocol: protocol.key(),
                $old_ident,
                $new_ident,
                updated_by: ctx.accounts.authority.key(),
                timestamp: clock.unix_timestamp,
            });

            Ok(())
        }
    };
}

#[macro_export]
macro_rules! impl_positive_setter {
    (
        $fn_name:ident,          // function name
        $accounts:ty,            // Accounts struct
        $type:ty,               // parameter type (u32/u64)
        $field:ident,            // config field
        $event:ident,            // event struct
        $old_ident:ident,        // old value ident
        $new_ident:ident,        // new value ident
        $error:path              // error variant for validation
    ) => {
        pub fn $fn_name<'info>(
            ctx: anchor_lang::prelude::Context<$accounts>,
            $new_ident: $type,
        ) -> anchor_lang::prelude::Result<()> {
            // Validate that the value is positive
            if $new_ident == 0 {
                return Err(anchor_lang::error::Error::from($error));
            }

            let protocol = &mut ctx.accounts.protocol;
            let $old_ident = protocol.config.$field;

            // Early exit if nothing changed
            if $old_ident == $new_ident {
                return Ok(());
            }

            // Update the field
            protocol.config.$field = $new_ident;

            // Update metadata
            let clock = anchor_lang::prelude::Clock::get()?;
            protocol.config.last_updated = clock.unix_timestamp;
            protocol.config.last_updated_by = ctx.accounts.authority.key();

            // Emit event
            anchor_lang::prelude::emit!($event {
                protocol: protocol.key(),
                $old_ident,
                $new_ident,
                updated_by: ctx.accounts.authority.key(),
                timestamp: clock.unix_timestamp,
            });

            Ok(())
        }
    };
}