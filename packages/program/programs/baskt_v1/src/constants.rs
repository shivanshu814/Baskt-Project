use anchor_lang::prelude::Pubkey;
use anchor_lang::pubkey;

// Fee constants
pub const OPENING_FEE_BPS: u64 = 10; // 0.1%
pub const CLOSING_FEE_BPS: u64 = 10; // 0.1%
pub const LIQUIDATION_FEE_BPS: u64 = 50; // 0.5%
pub const MAX_FEE_BPS: u64 = 1000; // 10% maximum fee
pub const BPS_DIVISOR: u64 = 10_000; // 100%

// Default fee split bps
pub const DEFAULT_TREASURY_CUT_BPS: u64 = 1_000; // 10%
pub const DEFAULT_FUNDING_CUT_BPS: u64 = 1_000; // 10%
pub const MAX_TREASURY_CUT_BPS: u64 = 5_000; // 50% maximum treasury cut

// Funding rate constants
pub const MAX_FUNDING_RATE_BPS: u64 = 1000; // 10% hourly = 87,600% APR
pub const FUNDING_INTERVAL_SECONDS: i64 = 3600; // 1 hour

// Collateral constants
pub const MIN_COLLATERAL_RATIO_BPS: u64 = 10000; // 100% minimum collateral
pub const LIQUIDATION_THRESHOLD_BPS: u64 = 500; // 5% threshold for liquidation

// Liquidity pool constants
pub const MIN_LIQUIDITY: u64 = 1 * 10u64.pow(6); // 1000 USDC minimum



// Position constants
pub const FUNDING_PRECISION: u64 = 10u64.pow(6); // 6 decimal places
pub const SECONDS_IN_HOUR: i64 = 3600;

// Escrow mint
pub const COLLATERAL_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
// pub const COLLATERAL_MINT: Pubkey = pubkey!("6uBc97h6XMKY4kqQ3DJA9R8y9AXC7yUMsm7AUxM8QKpr");

// Baskt constants
pub const BASE_NAV: u64 = 100; // Base NAV value for new baskts ($100)
pub const PRICE_PRECISION: u64 = 10u64.pow(6); // 6 decimal places to match USDC

pub const MIN_GRACE_PERIOD: i64 = 1; // 1 second
pub const MAX_GRACE_PERIOD: i64 = 604800; // 7 days

// PDA Seeds
pub const PROTOCOL_SEED: &[u8] = b"protocol";
pub const AUTHORITY_SEED: &[u8] = b"authority";
pub const BASKT_SEED: &[u8] = b"baskt";
pub const ASSET_SEED: &[u8] = b"asset";
pub const ORDER_SEED: &[u8] = b"order";
pub const POSITION_SEED: &[u8] = b"position";
pub const USER_ESCROW_SEED: &[u8] = b"user_escrow";
pub const ESCROW_SEED: &[u8] = b"escrow";
pub const LIQUIDITY_POOL_SEED: &[u8] = b"liquidity_pool";
pub const TOKEN_VAULT_SEED: &[u8] = b"token_vault"; // DO NOT CHANGE THIS for now
pub const POOL_AUTHORITY_SEED: &[u8] = b"pool_authority";
pub const LP_ESCROW_SEED: &[u8] = b"lp_escrow";
