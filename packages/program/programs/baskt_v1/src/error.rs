use anchor_lang::prelude::*;

#[error_code]
pub enum PerpetualsError {
    #[msg("Math operation overflow")]
    MathOverflow,
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
    #[msg("Unauthorized: Missing required role for this operation")]
    UnauthorizedRole,
    #[msg("Unauthorized: Token account owner mismatch")]
    UnauthorizedTokenOwner,
    #[msg("Invalid LP token amount")]
    InvalidLpTokenAmount,
    #[msg("Invalid oracle price")]
    InvalidOraclePrice,
    #[msg("Submitted price is outside acceptable deviation bounds from oracle price")]
    PriceOutOfBounds,
    #[msg("Insufficient funds for operation")]
    InsufficientFunds,
    #[msg("Baskt is not active for trading")]
    BasktNotActive,
    #[msg("Role not found for the account")]
    RoleNotFound,
    #[msg("Invalid role type")]
    InvalidRoleType,
    #[msg("Invalid asset account")]
    InvalidAssetAccount,
    #[msg("Long positions are disabled for this asset")]
    LongPositionsDisabled,
    #[msg("Short positions are disabled for this asset")]
    ShortPositionsDisabled,
    #[msg("Asset not in baskt")]
    AssetNotInBaskt,
    #[msg("Invalid asset config")]
    InvalidAssetConfig,
    #[msg("Trading operations are currently disabled")]
    TradingDisabled,
    #[msg("Liquidity operations are currently disabled")]
    LiquidityOperationsDisabled,
    #[msg("Position operations are currently disabled")]
    PositionOperationsDisabled,
    #[msg("Baskt management operations are currently disabled")]
    BasktOperationsDisabled,
    #[msg("Asset Not Active")]
    InactiveAsset,
    #[msg("Baskt Already Active")]
    BasktAlreadyActive,
    #[msg("Invalid asset weights")]
    InvalidAssetWeights,
    #[msg("Order already processed")]
    OrderAlreadyProcessed,
    #[msg("Invalid escrow account")]
    InvalidEscrowAccount,
    #[msg("Invalid program authority")]
    InvalidProgramAuthority,
    #[msg("Token has delegate")]
    TokenHasDelegate,
    #[msg("Token has close authority")]
    TokenHasCloseAuthority,
    #[msg("Invalid mint")]
    InvalidMint,
    #[msg("Zero sized position")]
    ZeroSizedPosition,
    #[msg("Invalid target position")]
    InvalidTargetPosition,
    #[msg("Invalid baskt")]
    InvalidBaskt,
    #[msg("Invalid order action")]
    InvalidOrderAction,
    #[msg("Funding not up to date")]
    FundingNotUpToDate,
    #[msg("Position still open")]
    PositionStillOpen,
    #[msg("Invalid treasury account")]
    InvalidTreasuryAccount,
    #[msg("Collateral amount would overflow maximum value")]
    CollateralOverflow,
    #[msg("Invalid deposit amount")]
    InvalidDepositAmount,
    #[msg("Invalid usdc vault account")]
    InvalidUsdcVault,
    #[msg("Invalid fee basis points")]
    InvalidFeeBps,
    #[msg("Invalid collateral ratio")]
    InvalidCollateralRatio,
    #[msg("Funding rate exceeds maximum allowed")]
    FundingRateExceedsMaximum,
    #[msg("Invalid owner")]
    InvalidOwner,
    #[msg("Invalid funding index account")]
    InvalidFundingIndex,
    #[msg("Invalid baskt state for this operation")]
    InvalidBasktState,
    #[msg("Grace period has not ended")]
    GracePeriodNotOver,
    #[msg("Positions are still open")]
    PositionsStillOpen,
    #[msg("Invalid grace period - must be between 1 hour and 7 days")]
    InvalidGracePeriod,
    #[msg("Price deviation too high")]
    PriceDeviationTooHigh,
    #[msg("Realised leverage exceeds declared leverage amount")]
    LeverageExceeded,
    #[msg("Invalid input provided")]
    InvalidInput,
    #[msg("SOL transfer failed")]
    TransferFailed,
    #[msg("Invalid LP token escrow")]
    InvalidLpTokenEscrow,
}
