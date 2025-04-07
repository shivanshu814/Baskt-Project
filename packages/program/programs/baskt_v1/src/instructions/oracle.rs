use {
    crate::error::PerpetualsError,
    crate::state::oracle::CustomOracle,
    crate::state::protocol::{Protocol, Role},
    anchor_lang::prelude::*,
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CustomOracleInstructionParams {
    pub price: u64,
    pub expo: i32,
    pub conf: u64,
    pub ema: u64,
    pub publish_time: i64,
    pub oracle_name: String,
}

#[derive(Accounts)]
#[instruction(instruction_params: CustomOracleInstructionParams)]
pub struct InitializeCustomOracle<'info> {
    #[account(init, payer = authority, space = 8 + CustomOracle::INIT_SPACE, seeds = [b"oracle", instruction_params.oracle_name.as_bytes()], bump)]
    pub oracle: Account<'info, CustomOracle>,

    //TODO: NO constraint here
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(seeds = [b"protocol"], bump)]
    pub protocol: Account<'info, Protocol>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCustomOracle<'info> {
    //TODO: This constraint is on the wrong account.
    #[account(mut, constraint = protocol.has_permission(&authority.key(), Role::OracleManager) @ PerpetualsError::Unauthorized)]
    pub oracle: Account<'info, CustomOracle>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(seeds = [b"protocol"], bump)]
    pub protocol: Account<'info, Protocol>,
}

pub fn initialize_custom_oracle(
    ctx: Context<InitializeCustomOracle>,
    instruction_params: CustomOracleInstructionParams,
) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;
    oracle.set(
        instruction_params.price,
        instruction_params.expo,
        instruction_params.conf,
        instruction_params.ema,
        instruction_params.publish_time,
    );
    Ok(())
}

pub fn update_custom_oracle(
    ctx: Context<UpdateCustomOracle>,
    instruction_params: CustomOracleInstructionParams,
) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;
    oracle.set(
        instruction_params.price,
        instruction_params.expo,
        instruction_params.conf,
        instruction_params.ema,
        instruction_params.publish_time,
    );
    Ok(())
}
