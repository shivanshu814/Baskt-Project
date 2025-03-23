use {
    crate::{error::PerpetualsError, state::oracle::CustomOracle},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct InitializeCustomOracle<'info> {
    #[account(init, payer = authority, space = 8 + CustomOracle::INIT_SPACE)]
    pub oracle: Account<'info, CustomOracle>,

    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCustomOracle<'info> {
    #[account(mut)]
    pub oracle: Account<'info, CustomOracle>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn initialize_custom_oracle(
    ctx: Context<InitializeCustomOracle>,
    price: u64,
    expo: i32,
    conf: u64,
    ema: u64,
    publish_time: i64,
) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;
    oracle.set(price, expo, conf, ema, publish_time);
    Ok(())
}

pub fn update_custom_oracle(
    ctx: Context<UpdateCustomOracle>,
    price: u64,
    expo: i32,
    conf: u64,
    ema: u64,
    publish_time: i64,
) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;
    oracle.set(price, expo, conf, ema, publish_time);
    Ok(())
}
