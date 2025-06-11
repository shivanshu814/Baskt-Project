use anchor_lang::prelude::Pubkey;
use anchor_lang::pubkey;

// Fee constants
pub const OPENING_FEE_BPS: u64 = 10; // 0.1%
pub const CLOSING_FEE_BPS: u64 = 10; // 0.1%
pub const LIQUIDATION_FEE_BPS: u64 = 50; // 0.5%
pub const MAX_FEE_BPS: u64 = 500; // 5% maximum fee
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

// Baskt constants
pub const BASE_NAV: u64 = 100; // Base NAV value for new baskts

// PDA Seeds
pub const PROTOCOL_SEED: &[u8] = b"protocol";
pub const AUTHORITY_SEED: &[u8] = b"authority";
pub const BASKT_SEED: &[u8] = b"baskt";
pub const ASSET_SEED: &[u8] = b"asset";
pub const ORDER_SEED: &[u8] = b"order";
pub const POSITION_SEED: &[u8] = b"position";
pub const USER_ESCROW_SEED: &[u8] = b"user_escrow";
pub const ESCROW_SEED: &[u8] = b"escrow";
pub const FUNDING_INDEX_SEED: &[u8] = b"funding_index";
pub const LIQUIDITY_POOL_SEED: &[u8] = b"liquidity_pool";
pub const TOKEN_VAULT_SEED: &[u8] = b"token_vault";
pub const POOL_AUTHORITY_SEED: &[u8] = b"pool_authority";
