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
    #[msg("Invalid baskt name")]
    InvalidBasktName,
    #[msg("Baskt is inactive")]
    BasktInactive,
    #[msg("Role not found for the account")]
    RoleNotFound,
    #[msg("Missing required role for this operation")]
    MissingRequiredRole,
    #[msg("Unauthorized signer for this operation")]
    UnauthorizedSigner,
    #[msg("Invalid role type")]
    InvalidRoleType,
    #[msg("Invalid remaining accounts")]
    InvalidRemainingAccounts,
    #[msg("Invalid asset account")]
    InvalidAssetAccount,
    #[msg("Long positions are disabled for this asset")]
    LongPositionsDisabled,
    #[msg("Short positions are disabled for this asset")]
    ShortPositionsDisabled,
    #[msg("Invalid or stale oracle price")]
    InvalidOrStaleOraclePrice,
    #[msg("Asset not in baskt")]
    AssetNotInBaskt,
    #[msg("Invalid asset config")]
    InvalidAssetConfig,
    #[msg("Feature is currently disabled")]
    FeatureDisabled,
    #[msg("Price not found")]
    PriceNotFound,
    #[msg("Asset Not Active")]
    InactiveAsset,
    #[msg("Baskt Already Active")]
    BasktAlreadyActive,
}
