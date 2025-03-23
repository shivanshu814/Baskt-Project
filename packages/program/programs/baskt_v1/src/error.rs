use anchor_lang::prelude::*;

#[error_code]
pub enum PerpetualsError {
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("Invalid oracle account")]
    InvalidOracleAccount,
    #[msg("Oracle price is too old")]
    OraclePriceTooOld,
    #[msg("Oracle price has too much uncertainty")]
    OraclePriceTooUncertain,
    #[msg("Insufficient collateral for position")]
    InsufficientCollateral,
    #[msg("Position is not liquidatable")]
    PositionNotLiquidatable,
    #[msg("Position is already closed")]
    PositionAlreadyClosed,
    #[msg("Insufficient liquidity in pool")]
    InsufficientLiquidity,
    #[msg("Invalid baskt configuration")]
    InvalidBasktConfig,
    #[msg("Invalid position size")]
    InvalidPositionSize,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid LP token amount")]
    InvalidLpTokenAmount,
    #[msg("Unsupported oracle type")]
    UnsupportedOracle,
    #[msg("Stale oracle price")]
    StaleOraclePrice,
    #[msg("Invalid oracle price")]
    InvalidOraclePrice,
    #[msg("Insufficient funds for operation")]
    InsufficientFunds,
}
