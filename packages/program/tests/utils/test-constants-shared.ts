import BN from 'bn.js';

/**
 * Shared test constants to avoid duplication across test files
 */

// Common test amounts
export const TEST_AMOUNTS = {
  SMALL_ORDER: new BN(10_000_000), // 10 USDC
  MEDIUM_ORDER: new BN(20_000_000), // 20 USDC  
  LARGE_ORDER: new BN(100_000_000), // 100 USDC
  MINIMAL_COLLATERAL_BUFFER: 105, // 5% buffer over minimum
  LIQUIDATION_COLLATERAL_RATIO: 90, // 90% of minimum for easier liquidation
} as const;

// Common test prices
export const TEST_PRICES = {
  BASELINE: new BN(100_000_000), // $100 with 6 decimals
  MODERATE_INCREASE: new BN(120_000_000), // $120 (20% increase)
  HIGH_INCREASE: new BN(200_000_000), // $200 (100% increase)
  LIQUIDATION_TRIGGER: new BN(300_000_000), // $300 (200% increase for SHORT liquidation)
} as const;

// Common test parameters
export const TEST_PARAMS = {
  DEFAULT_LEVERAGE: new BN(10000), // 1x leverage (10000 BPS)
  DEFAULT_MAX_SLIPPAGE: new BN(500), // 5% slippage
  LIQUIDATION_THRESHOLD: 4000, // 40% liquidation threshold BPS
} as const;

// Common test timeouts
export const TEST_TIMEOUTS = {
  DEFAULT: 60000, // 60 seconds
  EXTENDED: 120000, // 2 minutes for complex operations
} as const;

// Common tickers for consistent testing
export const TEST_TICKERS = {
  PRIMARY: 'BTC',
  SECONDARY: 'ETH', 
  TERTIARY: 'SOL',
} as const;