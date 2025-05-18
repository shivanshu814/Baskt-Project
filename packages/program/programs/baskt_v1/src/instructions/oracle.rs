use {
    crate::error::PerpetualsError,
    crate::state::baskt::Baskt,
    crate::state::protocol::{Protocol, Role},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct UpdateCustomOracle<'info> {
    #[account(mut)]
    pub baskt: Account<'info, Baskt>,

    /// @dev Requires OracleManager role to update oracle prices
    #[account(mut, constraint = protocol.has_permission(authority.key(), Role::OracleManager) @ PerpetualsError::Unauthorized)]
    pub authority: Signer<'info>,

    #[account(seeds = [b"protocol"], bump, mut)]
    pub protocol: Account<'info, Protocol>,
}

pub fn update_custom_oracle(ctx: Context<UpdateCustomOracle>, price: u64) -> Result<()> {
    let baskt = &mut ctx.accounts.baskt;
    let current_time = Clock::get().unwrap().unix_timestamp;
    baskt.oracle.update(price, current_time);
    Ok(())
}
