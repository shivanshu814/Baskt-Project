import BN from 'bn.js';

// Risk parameters
export const MAX_LEVERAGE = 10;
export const INITIAL_MARGIN_RATIO = 0.2; // 20%
export const MAINTENANCE_MARGIN_RATIO = 0.1; // 10%
export const LIQUIDATION_THRESHOLD = 0.85; // Liquidate at 85% of maintenance

// Limits
export const MAX_UTILIZATION = 0.8; // 80% of TVL
export const MAX_SKEW_RATIO = 0.3; // 30% max imbalance
export const MAX_USER_EXPOSURE = new BN(1_000_000); // $1M
export const CASCADE_THRESHOLD = 0.5; // 50% cascade probability

// Pricing
export const SKEW_COEFFICIENT = 250; // 2.5% per 100% skew
export const SIZE_IMPACT_COEFFICIENT = 500; // 5% if order == liquidity
export const UTIL_PENALTY_COEFFICIENT = 1000; // 10% per 100% over 70%
export const MAX_PRICE_DEVIATION = 0.02; // 2% between sources

// Funding
export const FUNDING_COEFFICIENT = 0.7; // 70% of skew as funding
export const MAX_FUNDING_RATE = 0.0042; // 0.42% hourly (10% daily)

// Timing
export const SNAPSHOT_INTERVAL = 5000; // 5 seconds
export const HEARTBEAT_INTERVAL = 10000; // 10 seconds
export const LIQUIDATION_SCAN_INTERVAL = 10000; // 10 seconds
export const MAX_PRICE_AGE = 60000; // 60 seconds

// Transaction
export const MAX_RETRIES = 5;
export const INITIAL_RETRY_DELAY = 2000; // 2 seconds

// Data Bus specific
export const MIN_PRICE_SOURCES = 2; // Minimum price sources for validation
export const MAX_PAYLOAD_SIZE = 1048576; // 1MB default max payload
export const MAX_RETRY_ATTEMPTS = 3; // Max retries before dead letter
