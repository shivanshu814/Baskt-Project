use anchor_lang::prelude::Pubkey;
use anchor_lang::pubkey;

#[allow(non_snake_case)]
pub struct Constants {
    // Fee constants
    pub OPENING_FEE_BPS: u64,
    pub CLOSING_FEE_BPS: u64,
    pub LIQUIDATION_FEE_BPS: u64,
    pub BPS_DIVISOR: u64,

    // Funding rate constants
    pub MAX_FUNDING_RATE_BPS: u64,
    pub FUNDING_INTERVAL_SECONDS: i64,

    // Collateral constants
    pub MIN_COLLATERAL_RATIO_BPS: u64,
    pub LIQUIDATION_THRESHOLD_BPS: u64,

    // Liquidity pool constants
    pub MIN_LIQUIDITY: u64,

    // Oracle constants
    pub MAX_PRICE_AGE_SEC: u32,
    pub MAX_PRICE_ERROR_BPS: u64,
    pub MAX_PRICE_DEVIATION_BPS: u64,
    pub LIQUIDATION_PRICE_DEVIATION_BPS: u64,

    // USDC decimals
    pub USDC_DECIMALS: u8,

    // Price precision
    pub PRICE_EXPONENT: u32,
    pub PRICE_PRECISION: u64,

    // Position constants
    pub FUNDING_PRECISION: u64,
    pub SECONDS_IN_HOUR: i64,

    // Escrow mint
    pub ESCROW_MINT: Pubkey,
}

impl Default for Constants {
    fn default() -> Self {
        Self {
            // Fee constants
            OPENING_FEE_BPS: 10,     // 0.1%
            CLOSING_FEE_BPS: 10,     // 0.1%
            LIQUIDATION_FEE_BPS: 50, // 0.5%
            BPS_DIVISOR: 10_000,     // 100%

            // Funding rate constants
            MAX_FUNDING_RATE_BPS: 100,      // 1% max funding rate
            FUNDING_INTERVAL_SECONDS: 3600, // 1 hour

            // Collateral constants
            MIN_COLLATERAL_RATIO_BPS: 1000, // 10% minimum collateral
            LIQUIDATION_THRESHOLD_BPS: 500, // 5% threshold for liquidation

            // Liquidity pool constants
            MIN_LIQUIDITY: 1000 * 10u64.pow(6), // 1000 USDC minimum

            // Oracle constants
            MAX_PRICE_AGE_SEC: 60,    // 1 minute max oracle price age
            MAX_PRICE_ERROR_BPS: 100, // 1% max price error
            MAX_PRICE_DEVIATION_BPS: 2500, // 25% max price deviation for regular operations
            LIQUIDATION_PRICE_DEVIATION_BPS: 2000, // 20% max price deviation for liquidations

            // USDC decimals
            USDC_DECIMALS: 6,

            // Price precision - aligned with USDC decimals
            PRICE_EXPONENT: 6,
            PRICE_PRECISION: 10u64.pow(6), // 6 decimal places to match USDC

            // Position constants
            FUNDING_PRECISION: 10u64.pow(6), // 6 decimal places
            SECONDS_IN_HOUR: 3600,

            // Escrow mint USDC token Address
            ESCROW_MINT: pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
        }
    }
}

impl Constants {
    // Fee constants
    pub const OPENING_FEE_BPS: u64 = 10; // 0.1%
    pub const CLOSING_FEE_BPS: u64 = 10; // 0.1%
    pub const LIQUIDATION_FEE_BPS: u64 = 50; // 0.5%
    pub const BPS_DIVISOR: u64 = 10_000; // 100%
    pub const BPS_POWER: u32 = 4; // 10^4 = 10000

    // Funding rate constants
    pub const MAX_FUNDING_RATE_BPS: u64 = 57; // 0.57% hourly = ~5000% APR
    pub const FUNDING_INTERVAL_SECONDS: i64 = 3600; // 1 hour

    // Collateral constants
    pub const MIN_COLLATERAL_RATIO_BPS: u64 = 11000; // 110% minimum collateral
    pub const LIQUIDATION_THRESHOLD_BPS: u64 = 500; // 5% threshold for liquidation

    // Liquidity pool constants
    pub const MIN_LIQUIDITY: u64 = 1000 * 10u64.pow(6); // 1000 USDC minimum

    // Oracle constants
    pub const MAX_PRICE_AGE_SEC: u32 = 60; // 1 minute max oracle price age
    pub const MAX_PRICE_ERROR_BPS: u64 = 100; // 1% max price error
    pub const MAX_PRICE_DEVIATION_BPS: u64 = 2500; // 25% max price deviation for regular operations
    pub const LIQUIDATION_PRICE_DEVIATION_BPS: u64 = 2000; // 20% max price deviation for liquidations

    // USDC decimals
    pub const USDC_DECIMALS: u8 = 6;

    // Price precision - aligned with USDC decimals  
    pub const PRICE_EXPONENT: u32 = 6;
    pub const PRICE_PRECISION: u64 = 10u64.pow(6); // 6 decimal places to match USDC

    // Position constants
    pub const FUNDING_PRECISION: u64 = 10u64.pow(6); // 6 decimal places
    pub const SECONDS_IN_HOUR: i64 = 3600;

    // Escrow mint
    pub const ESCROW_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
}
